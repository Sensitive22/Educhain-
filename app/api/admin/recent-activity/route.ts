import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {

    // ================= PARALLEL FETCH =================
    const [
      purchasesRes,
      withdrawalsRes,
      teachersRes,
      lecturesRes
    ] = await Promise.all([

      supabase
        .from("purchases")
        .select("id, user_id, lecture_id, amount, created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("withdrawal_requests")
        .select("id, teacher_id, amount, created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("profiles")
        .select("id, email, role, created_at")
        .eq("role", "teacher")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("lectures")
        .select("id, title, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (purchasesRes.error) throw purchasesRes.error;
    if (withdrawalsRes.error) throw withdrawalsRes.error;
    if (teachersRes.error) throw teachersRes.error;
    if (lecturesRes.error) throw lecturesRes.error;

    const purchases = purchasesRes.data || [];
    const withdrawals = withdrawalsRes.data || [];
    const teachers = teachersRes.data || [];
    const lectures = lecturesRes.data || [];

    // ================= USER IDS FOR NAME FETCH =================
    const userIds: string[] = [
  ...purchases.map((p: any) => p.user_id),
  ...withdrawals.map((w: any) => w.teacher_id),
  ...lectures.map((l: any) => l.user_id)
].filter(Boolean);

    const uniqueIds: string[] = Array.from(new Set(userIds));

    // get names
    const { data: users } = await supabase
      .from("user_settings")
      .select("user_id, full_name")
      .in("user_id", uniqueIds);

    const nameMap: Record<string, string> = {};
    users?.forEach(u => {
      nameMap[u.user_id] = u.full_name;
    });

    // ================= CREATE ACTIVITY =================
    const activity = [

      ...purchases.map(p => ({
        type: "purchase",
        message: `${nameMap[p.user_id] || "Student"} purchased lecture`,
        amount: p.amount,
        created_at: p.created_at
      })),

      ...withdrawals.map(w => ({
        type: "withdrawal",
        message: `${nameMap[w.teacher_id] || "Teacher"} requested withdrawal`,
        amount: w.amount,
        created_at: w.created_at
      })),

      ...teachers.map(t => ({
        type: "teacher_joined",
        message: `New teacher joined (${t.email})`,
        amount: null,
        created_at: t.created_at
      })),

      ...lectures.map(l => ({
        type: "lecture_uploaded",
        message: `${nameMap[l.user_id] || "Teacher"} uploaded "${l.title}"`,
        amount: null,
        created_at: l.created_at
      })),
    ];

    // ================= SORT =================
    activity.sort((a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      data: activity.slice(0, 10)
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}