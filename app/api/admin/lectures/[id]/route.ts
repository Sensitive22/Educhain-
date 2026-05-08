import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type RouteContext = { params: { id: string } };

// ─── Helper: CID → IPFS URL ───────────────────────────────────────────────────
function toIpfsUrl(cid: string | null | undefined): string | null {
  if (!cid) return null;
  // Already a full URL
  if (cid.startsWith("http")) return cid;
  return `https://ipfs.io/ipfs/${cid}`;
}

// ─── GET /api/admin/lectures/[id] ────────────────────────────────────────────

export async function GET(_req: NextRequest, context: RouteContext) {
  const lectureId = context.params.id;

  if (!lectureId) {
    return NextResponse.json({ error: "Lecture ID is required" }, { status: 400 });
  }

  try {
    // ── Fetch lecture ────────────────────────────────────────────────────────
    const { data: lecture, error: lectureError } = await supabase
      .from("lectures")
      .select("*")
      .eq("id", lectureId)
      .single();

    if (lectureError) {
      if (lectureError.code === "PGRST116") {
        return NextResponse.json({ error: `No lecture found with id: ${lectureId}` }, { status: 404 });
      }
      if (lectureError.code === "42501") {
        return NextResponse.json({ error: "Permission denied (RLS). Check service_role key." }, { status: 403 });
      }
      return NextResponse.json(
        { error: "Supabase query failed", code: lectureError.code, message: lectureError.message },
        { status: 500 }
      );
    }

    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    // ── Fetch purchases for this lecture ─────────────────────────────────────
    // NOTE: No payment_status filter — Razorpay uses "captured" not "paid".
    // We fetch all rows and log the distinct statuses so you can see what's in your DB.
    const { data: allPurchases, error: purchasesError } = await supabase
      .from("purchases")
      .select("user_id, amount, created_at, teacher_id, payment_status, currency")
      .eq("lecture_id", lectureId)
      .order("created_at", { ascending: false });

    // ── DEBUG: log raw purchase rows so you can inspect in server logs ────────
    console.log("=== PURCHASES DEBUG ===");
    console.log("purchasesError:", JSON.stringify(purchasesError, null, 2));
    console.log("allPurchases count:", allPurchases?.length ?? 0);
    if (allPurchases && allPurchases.length > 0) {
      // Log distinct payment_status values and a sample row
      const statuses = Array.from(
new Set(allPurchases.map((p) => p.payment_status))
);

      console.log("distinct payment_status values:", statuses);
      console.log("sample row:", JSON.stringify(allPurchases[0], null, 2));
    }

    if (purchasesError) {
      console.error("PURCHASE FETCH ERROR:", JSON.stringify(purchasesError, null, 2));
    }

    // ── Filter to successful payments only ────────────────────────────────────
    // Razorpay typically sets payment_status = "captured" for successful payments.
    // We include: captured, paid, success, completed — adjust if your values differ.
    const SUCCESSFUL_STATUSES = ["captured", "paid", "success", "completed"];
    const purchases = (allPurchases ?? []).filter(
      (p) => !p.payment_status || SUCCESSFUL_STATUSES.includes(p.payment_status)
    );

    console.log("purchases after status filter:", purchases.length);

    // ── Detect if amounts are stored in paise (Razorpay stores paise) ─────────
    // If the first amount is > 10000 and currency is INR, it's likely paise.
    const firstAmount = purchases[0]?.amount ? Number(purchases[0].amount) : 0;
    const isPaise = firstAmount > 10000 && (purchases[0]?.currency === "INR" || !purchases[0]?.currency);
    console.log("isPaise:", isPaise, "| firstAmount raw:", firstAmount);

    // ── Aggregate stats ───────────────────────────────────────────────────────
    const totalStudents = new Set(purchases.map((p) => p.user_id)).size;
    const totalRevenue = purchases.reduce((sum, p) => {
      const raw = Number(p.amount ?? 0);
      return sum + (isPaise ? raw / 100 : raw);
    }, 0);
    const totalTransactions = purchases.length;

    console.log("totalStudents:", totalStudents, "| totalRevenue:", totalRevenue, "| totalTransactions:", totalTransactions);

    // ── Recent transactions (last 5) ─────────────────────────────────────────
    const recentRaw = purchases.slice(0, 5);
    const studentIds = Array.from(
new Set(recentRaw.map((p) => p.user_id))
);

    let studentEmailMap = new Map<string, string>();

    if (studentIds.length > 0) {
      const { data: studentProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", studentIds);

      console.log("profilesError:", JSON.stringify(profilesError, null, 2));
      console.log("studentProfiles:", JSON.stringify(studentProfiles, null, 2));

      studentEmailMap = new Map(
        (studentProfiles ?? []).map((p) => [p.id, p.email ?? "Unknown"])
      );
    }

    // teacher_earning = 90% of amount — adjust if you have a dedicated column
    const recentTransactions = recentRaw.map((p) => {
      const raw = Number(p.amount ?? 0);
      const amount = isPaise ? raw / 100 : raw;
      const teacherEarning = Math.round(amount * 0.9 * 100) / 100;
      return {
        studentEmail: studentEmailMap.get(p.user_id) ?? "Unknown",
        amount,
        teacherEarning,
        platformFee: Math.round((amount - teacherEarning) * 100) / 100,
        date: p.created_at,
      };
    });

    // FIX: thumbnail_cid converted to IPFS URL here in the API
    return NextResponse.json({
      id: lecture.id,
      title: lecture.title ?? "",
      description: lecture.description ?? "",
      videoUrl: toIpfsUrl(lecture.video_cid),
      // FIX: convert CID → full IPFS URL
      thumbnailUrl: toIpfsUrl(lecture.thumbnail_cid),
      price: Number(lecture.price ?? 0),
      rentPrice: 0,
      createdAt: lecture.created_at,
      // FIX: use is_hidden column (not status)
      isHidden: lecture.is_hidden === true,
      teacherId: lecture.user_id,
      teacherName: lecture.teacher_name ?? "Unknown",
      teacherEmail: "",
      totalStudents,
      totalRevenue,
      totalTransactions,
      recentTransactions,
    });
  } catch (err) {
    console.error("LECTURE DETAILS CATCH ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH /api/admin/lectures/[id] — Hide / Unhide ──────────────────────────
// FIX: Use PATCH for visibility updates (not POST), using is_hidden column

export async function PATCH(req: NextRequest, context: RouteContext) {
  const lectureId = context.params.id;

  if (!lectureId) {
    return NextResponse.json({ error: "Lecture ID is required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (!["hide", "unhide"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Use 'hide' or 'unhide'." }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("lectures")
      .select("id")
      .eq("id", lectureId)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    // FIX: update is_hidden column (not status)
    const { error } = await supabase
      .from("lectures")
      .update({ is_hidden: action === "hide" })
      .eq("id", lectureId);

    if (error) {
      console.error("VISIBILITY UPDATE ERROR:", error);
      return NextResponse.json({ error: "Update failed", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, isHidden: action === "hide" });
  } catch (err) {
    console.error("PATCH ACTION ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/admin/lectures/[id] — Permanently delete ────────────────────
// FIX: Use DELETE HTTP method (not POST with action:"delete")

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const lectureId = context.params.id;

  if (!lectureId) {
    return NextResponse.json({ error: "Lecture ID is required" }, { status: 400 });
  }

  try {
    const { data: existing } = await supabase
      .from("lectures")
      .select("id")
      .eq("id", lectureId)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    const { error } = await supabase.from("lectures").delete().eq("id", lectureId);

    if (error) {
      console.error("DELETE ERROR:", error);
      return NextResponse.json({ error: "Delete failed", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE ACTION ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST kept for backward compatibility ─────────────────────────────────────
// Remove this once frontend is updated to use PATCH/DELETE

export async function POST(req: NextRequest, context: RouteContext) {
  const lectureId = context.params.id;

  try {
    const { action } = await req.json();

    if (action === "delete") {
      return DELETE(req, context);
    }
    if (action === "hide" || action === "unhide") {
      // Re-use PATCH logic
      const patchReq = new NextRequest(req.url, {
        method: "PATCH",
        headers: req.headers,
        body: JSON.stringify({ action }),
      });
      return PATCH(patchReq, context);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}