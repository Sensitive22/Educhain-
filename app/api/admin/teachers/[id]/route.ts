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
  if (cid.startsWith("http")) return cid;
  return `https://ipfs.io/ipfs/${cid}`;
}

////////////////////////////////////////////////////////////
// PATCH → SUSPEND / ACTIVATE TEACHER
////////////////////////////////////////////////////////////

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const teacherId = params.id;

  if (!teacherId) {
    return NextResponse.json({ error: "Teacher ID missing" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action !== "suspend" && action !== "activate") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'suspend' or 'activate'" },
        { status: 400 }
      );
    }

    const newStatus = action === "suspend" ? "suspended" : "active";

    const { data, error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", teacherId)
      .eq("role", "teacher")
      .select("id, status")
      .single();

    if (error || !data) {
      console.error("SUSPEND/ACTIVATE ERROR:", error);
      return NextResponse.json(
        { error: "Failed to update teacher status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id, status: data.status });
  } catch (err: any) {
    console.error("PATCH TEACHER ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

////////////////////////////////////////////////////////////
// GET → TEACHER FULL DETAILS
////////////////////////////////////////////////////////////

export async function GET(req: NextRequest, { params }: RouteContext) {
  const teacherId = params.id;

  if (!teacherId) {
    return NextResponse.json({ error: "Teacher ID missing" }, { status: 400 });
  }

  try {
    // ── Profile ──────────────────────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id,email,role,status,created_at")
      .eq("id", teacherId)
      .eq("role", "teacher")
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // ── Parallel fetch ───────────────────────────────────────────────────────
    const [nameRes, lectureRes, studentsRes, walletRes] = await Promise.all([
      supabase
        .from("user_settings")
        .select("full_name, profile_picture")   // FIX: fetch profile_picture too
        .eq("user_id", teacherId)
        .maybeSingle(),

      supabase
        .from("lectures")
        .select("id", { count: "exact", head: true })
        .eq("user_id", teacherId),

      supabase
        .from("purchases")
        .select("user_id")
        .eq("teacher_id", teacherId),

      supabase
        .from("teacher_wallet")
        .select("total_earnings,available_balance,withdrawn_amount,pending_balance")
        .eq("teacher_id", teacherId)
        .maybeSingle(),
    ]);

    // ── Fallback: if user_settings has no picture, try lectures table ────────
    // lectures.teacher_profile_picture is a CID stored alongside every lecture
    let profilePictureCid: string | null = nameRes.data?.profile_picture ?? null;

    if (!profilePictureCid) {
      const { data: lecturePic } = await supabase
        .from("lectures")
        .select("teacher_profile_picture")
        .eq("user_id", teacherId)
        .not("teacher_profile_picture", "is", null)
        .limit(1)
        .maybeSingle();

      profilePictureCid = lecturePic?.teacher_profile_picture ?? null;
    }

    // ── Calculations ─────────────────────────────────────────────────────────
    const totalLectures = lectureRes.count || 0;
    const totalStudents = new Set(studentsRes.data?.map((s) => s.user_id) || []).size;
    const totalEarnings = walletRes.data?.total_earnings || 0;
    const totalWithdrawn = walletRes.data?.withdrawn_amount || 0;
    const walletBalance = walletRes.data?.available_balance || 0;
    const pendingBalance = walletRes.data?.pending_balance || 0;

    return NextResponse.json({
      id: profile.id,
      name: nameRes.data?.full_name || "Unknown",
      email: profile.email,
      status: profile.status,
      joined: profile.created_at,
      // FIX: convert CID → full IPFS URL (null if no picture)
      profilePicture: toIpfsUrl(profilePictureCid),
      totalEarnings,
      totalLectures,
      totalStudents,
      totalWithdrawn,
      walletBalance,
      pendingBalance,
    });
  } catch (err: any) {
    console.error("TEACHER DETAILS ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}