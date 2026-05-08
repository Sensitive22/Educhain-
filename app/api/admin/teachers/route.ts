import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// ─── Supabase (service role — bypasses RLS) ─────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Types ──────────────────────────────────────────────────────────────

interface TeacherRow {
  id: string;
  email: string;
  status: string;
}

interface TeacherResult {
  id: string;
  name: string;
  email: string;
  status: string;
  totalEarnings: number;
  totalLectures: number;
  totalStudents: number;
}

// ─────────────────────────────────────────────────────────────────────────
// GET /api/admin/teachers
// ─────────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    // 1️⃣ Fetch teacher profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, status")
      .eq("role", "teacher");

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0)
      return NextResponse.json({ data: [] });

    const teacherIds = profiles.map((p: TeacherRow) => p.id);

    // 2️⃣ Fetch related data in parallel
    const [
      userSettingsResult,
      purchasesResult,
      lecturesResult,
    ] = await Promise.all([
      supabase
        .from("user_settings")
        .select("user_id, full_name")
        .in("user_id", teacherIds),

      supabase
        .from("purchases")
        .select("teacher_id, amount")
        .in("teacher_id", teacherIds),

      supabase
        .from("lectures")
        .select("user_id")
        .in("user_id", teacherIds),
    ]);

    if (userSettingsResult.error) throw userSettingsResult.error;
    if (purchasesResult.error) throw purchasesResult.error;
    if (lecturesResult.error) throw lecturesResult.error;

    // 3️⃣ Build Maps (O(1) lookups)

    const nameMap = new Map<string, string>(
      (userSettingsResult.data ?? []).map((u: any) => [
        u.user_id,
        u.full_name ?? "Unknown",
      ])
    );

    const earningsMap = new Map<string, number>();
    const studentsMap = new Map<string, number>();

    // purchases = earnings + totalStudents
    for (const row of purchasesResult.data ?? []) {
      const teacherId = row.teacher_id;
      const amount = Number(row.amount) || 0;

      earningsMap.set(
        teacherId,
        (earningsMap.get(teacherId) ?? 0) + amount
      );

      studentsMap.set(
        teacherId,
        (studentsMap.get(teacherId) ?? 0) + 1
      );
    }

    const lecturesMap = new Map<string, number>();
    for (const row of lecturesResult.data ?? []) {
      lecturesMap.set(
        row.user_id,
        (lecturesMap.get(row.user_id) ?? 0) + 1
      );
    }

    // 4️⃣ Format final result
    const teachers: TeacherResult[] = profiles
      .map((p: TeacherRow) => ({
        id: p.id,
        name: nameMap.get(p.id) ?? "Unknown",
        email: p.email,
        status: p.status,
        totalEarnings: earningsMap.get(p.id) ?? 0,
        totalLectures: lecturesMap.get(p.id) ?? 0,
        totalStudents: studentsMap.get(p.id) ?? 0,
      }))
      .sort((a, b) => b.totalEarnings - a.totalEarnings);

    return NextResponse.json({ data: teachers });
  } catch (err: any) {
    console.error("[GET /api/admin/teachers]", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────
// POST /api/admin/teachers
// ─────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teacher_id, action } = body;

    if (!teacher_id || typeof teacher_id !== "string") {
      return NextResponse.json(
        { error: "teacher_id is required" },
        { status: 400 }
      );
    }

    if (action !== "suspend" && action !== "activate") {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    const newStatus = action === "suspend" ? "suspended" : "active";

    // verify teacher exists
    const { data: teacher, error: lookupError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", teacher_id)
      .eq("role", "teacher")
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!teacher)
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );

    // update status
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", teacher_id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[POST /api/admin/teachers]", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}