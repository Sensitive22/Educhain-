import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Helper: CID → IPFS URL ───────────────────────────────────────────────────
function toIpfsUrl(cid: string | null | undefined): string | null {
  if (!cid) return null;
  if (cid.startsWith("http")) return cid;
  return `https://ipfs.io/ipfs/${cid}`;
}

export async function GET() {
  try {
    // =========================
    // FETCH ALL DATA IN PARALLEL
    // =========================
    const [purchasesRes, lecturesRes, profilesRes] = await Promise.all([
      supabase
        .from("purchases")
        .select("id, amount, created_at, lecture_id, user_id, teacher_id, payment_status, type")
        .order("created_at", { ascending: false }),

      supabase
        .from("lectures")
        .select("id, title, teacher_name, user_id, thumbnail_cid, price, pricing_model, status"),

      supabase
        .from("profiles")
        .select("id")
        .eq("role", "student"),
    ]);

    const lecturesRaw = lecturesRes.data ?? [];
    const profilesRaw = profilesRes.data ?? [];

    // =========================
    // FILTER VALID PURCHASES
    // Only count successful payments
    // =========================
    const SUCCESSFUL_STATUSES = ["captured", "paid", "success", "completed"];
    const cleanPurchases = (purchasesRes.data ?? []).filter(
      (p) =>
        p &&
        p.lecture_id &&
        (!p.payment_status || SUCCESSFUL_STATUSES.includes(p.payment_status))
    );

    // =========================
    // SAFE DATE FUNCTION
    // =========================
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return "No Date";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "No Date";
      return d.toISOString().split("T")[0];
    };

    // =========================
    // BUILD LECTURE LOOKUP MAP
    // id → lecture object (for fast O(1) lookup instead of .find() in loops)
    // =========================
    const lectureMap = new Map(lecturesRaw.map((l) => [l.id, l]));

    // =========================
    // TOTALS
    // =========================
    const totalRevenue = cleanPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalTransactions = cleanPurchases.length;

    // Count unique teacher IDs from lectures (not teacher_name — avoids duplicates)
    const totalTeachers = new Set(lecturesRaw.map((l) => l.user_id).filter(Boolean)).size;

    // Students = distinct student profiles
    const totalStudents = profilesRaw.length || new Set(cleanPurchases.map((p) => p.user_id)).size;

    // =========================
    // REVENUE OVER TIME
    // =========================
    const revenueMap: Record<string, number> = {};
    cleanPurchases.forEach((p) => {
      const date = formatDate(p.created_at);
      revenueMap[date] = (revenueMap[date] || 0) + (p.amount || 0);
    });

    const revenueOverTime = Object.entries(revenueMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    // =========================
    // TRANSACTION VOLUME
    // =========================
    const txMap: Record<string, number> = {};
    cleanPurchases.forEach((p) => {
      const date = formatDate(p.created_at);
      txMap[date] = (txMap[date] || 0) + 1;
    });

    const transactionVolume = Object.entries(txMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    // =========================
    // TOP TEACHERS
    // Group by teacher user_id (not name) — then resolve name from lectures
    // =========================
    const teacherRevenueMap: Record<string, { name: string; revenue: number; sales: number }> = {};

    cleanPurchases.forEach((p) => {
      const lecture = lectureMap.get(p.lecture_id);
      if (!lecture) return;

      const teacherId = lecture.user_id || "unknown";
      const teacherName = lecture.teacher_name || "Unknown Teacher";

      if (!teacherRevenueMap[teacherId]) {
        teacherRevenueMap[teacherId] = { name: teacherName, revenue: 0, sales: 0 };
      }

      teacherRevenueMap[teacherId].revenue += p.amount || 0;
      teacherRevenueMap[teacherId].sales += 1;
    });

    const topTeachers = Object.values(teacherRevenueMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((t) => ({ name: t.name, revenue: t.revenue, sales: t.sales }));

    // =========================
    // TOP LECTURES
    // FIX: was losing title because lectureMap was keyed wrong.
    // Now uses lectureMap.get() with lecture.id as key.
    // =========================
    const lectureSalesMap: Record<
      string,
      { id: string; title: string; teacherName: string; thumbnailUrl: string | null; sales: number; revenue: number }
    > = {};

    cleanPurchases.forEach((p) => {
      const lecture = lectureMap.get(p.lecture_id);
      if (!lecture) return;

      const lectureId = lecture.id;

      if (!lectureSalesMap[lectureId]) {
        lectureSalesMap[lectureId] = {
          id: lectureId,
          // FIX: trim + fallback so empty-string titles show as "Untitled Lecture"
          title:
            lecture.title && lecture.title.trim().length > 0
              ? lecture.title.trim()
              : "Untitled Lecture",
          teacherName: lecture.teacher_name || "Unknown",
          // FIX: convert thumbnail CID to IPFS URL
          thumbnailUrl: toIpfsUrl(lecture.thumbnail_cid),
          sales: 0,
          revenue: 0,
        };
      }

      lectureSalesMap[lectureId].sales += 1;
      lectureSalesMap[lectureId].revenue += p.amount || 0;
    });

    const topLectures = Object.values(lectureSalesMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // =========================
    // RECENT TRANSACTIONS (last 10)
    // FIX: was using .slice(-5) on unsorted array — now uses pre-sorted desc order
    // =========================
    const recentTransactions = cleanPurchases.slice(0, 10).map((p) => {
      const lecture = lectureMap.get(p.lecture_id);

      return {
        id: p.id,
        amount: p.amount || 0,
        date: formatDate(p.created_at),
        rawDate: p.created_at,
        // FIX: direct map lookup instead of .find() in loop
        lecture: lecture?.title?.trim() || "Unknown Lecture",
        teacher: lecture?.teacher_name || "Unknown",
        thumbnailUrl: toIpfsUrl(lecture?.thumbnail_cid),
        type: p.type || "buy",
      };
    });

    // =========================
    // PLATFORM REVENUE SPLIT
    // =========================
    const platformRevenue = cleanPurchases.reduce(
      (sum, p) => sum + Math.round((p.amount || 0) * 0.1 * 100) / 100,
      0
    );
    const teacherRevenue = totalRevenue - platformRevenue;

    // =========================
    // FINAL RESPONSE
    // =========================
    return NextResponse.json({
      totalRevenue,
      totalTransactions,
      totalTeachers,
      totalStudents,
      platformRevenue,
      teacherRevenue,
      revenueOverTime,
      transactionVolume,
      topTeachers,
      topLectures,
      recentTransactions,
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}