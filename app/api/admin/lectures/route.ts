import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

////////////////////////////////////////////////////////////
// GET ALL LECTURES (ADMIN)
////////////////////////////////////////////////////////////

export async function GET() {
  try {
    // 1️⃣ Fetch lectures
    const { data: lectures, error: lecturesError } = await supabase
      .from("lectures")
      .select("id, title, price, user_id, created_at, is_hidden")
      .order("created_at", { ascending: false });

    if (lecturesError) {
      console.error("LECTURES FETCH ERROR:", lecturesError);
      return NextResponse.json(
        { error: "Failed to fetch lectures" },
        { status: 500 }
      );
    }

    if (!lectures || lectures.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const teacherIds: string[] = Array.from(
      new Set(lectures.map((l: any) => l.user_id).filter(Boolean))
    );

    const lectureIds: string[] = lectures
      .map((l: any) => l.id)
      .filter(Boolean);

    ////////////////////////////////////////////////////////////
    // 2️⃣ Fetch related data in parallel
    ////////////////////////////////////////////////////////////

    const [nameRes, profileRes, purchaseRes] = await Promise.all([
      supabase
        .from("user_settings")
        .select("user_id, full_name")
        .in("user_id", teacherIds),

      supabase
        .from("profiles")
        .select("id, email")
        .in("id", teacherIds),

      // 👇 Revenue source of truth = purchases.amount
      supabase
        .from("purchases")
        .select("lecture_id, user_id, amount")
        .in("lecture_id", lectureIds),
    ]);

    if (nameRes.error || profileRes.error || purchaseRes.error) {
      console.error("RELATED DATA ERROR:", {
        nameErr: nameRes.error,
        profileErr: profileRes.error,
        purchaseErr: purchaseRes.error,
      });

      return NextResponse.json(
        { error: "Failed to fetch related data" },
        { status: 500 }
      );
    }

    ////////////////////////////////////////////////////////////
    // 3️⃣ Build lookup maps
    ////////////////////////////////////////////////////////////

    const nameMap = new Map<string, string>(
      (nameRes.data ?? []).map((u: any) => [
        u.user_id,
        u.full_name ?? "Unknown",
      ])
    );

    const emailMap = new Map<string, string>(
      (profileRes.data ?? []).map((p: any) => [
        p.id,
        p.email ?? "",
      ])
    );

    const studentsMap = new Map<string, Set<string>>();
    const revenueMap = new Map<string, number>();

    for (const purchase of purchaseRes.data ?? []) {
      // Students count (unique)
      if (!studentsMap.has(purchase.lecture_id)) {
        studentsMap.set(purchase.lecture_id, new Set());
      }

      studentsMap.get(purchase.lecture_id)!.add(purchase.user_id);

      // Revenue calculation
      revenueMap.set(
        purchase.lecture_id,
        (revenueMap.get(purchase.lecture_id) ?? 0) +
          Number(purchase.amount ?? 0)
      );
    }

    ////////////////////////////////////////////////////////////
    // 4️⃣ Final structured response
    ////////////////////////////////////////////////////////////

    const data = lectures.map((lecture: any) => ({
      id: lecture.id,
      title: lecture.title,
      price: Number(lecture.price ?? 0),
      teacherId: lecture.user_id,
      teacherName: nameMap.get(lecture.user_id) ?? "Unknown",
      teacherEmail: emailMap.get(lecture.user_id) ?? "",
      totalStudents: studentsMap.get(lecture.id)?.size ?? 0,
      totalRevenue: revenueMap.get(lecture.id) ?? 0,
      createdAt: lecture.created_at,
      isHidden: lecture.is_hidden ?? false,
    }));

    return NextResponse.json({ data });

  } catch (err: any) {
    console.error("ADMIN LECTURES ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

////////////////////////////////////////////////////////////
// POST → DELETE / HIDE / UNHIDE
////////////////////////////////////////////////////////////

export async function POST(req: NextRequest) {
  try {
    const { action, lecture_id } = await req.json();

    if (!lecture_id) {
      return NextResponse.json(
        { error: "lecture_id required" },
        { status: 400 }
      );
    }

    if (!["delete", "hide", "unhide"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    if (action === "delete") {
      const { error } = await supabase
        .from("lectures")
        .delete()
        .eq("id", lecture_id);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from("lectures")
      .update({ is_hidden: action === "hide" })
      .eq("id", lecture_id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      isHidden: action === "hide",
    });

  } catch (err: any) {
    console.error("LECTURE ACTION ERROR:", err);
    return NextResponse.json(
      { error: "Action failed" },
      { status: 500 }
    );
  }
}