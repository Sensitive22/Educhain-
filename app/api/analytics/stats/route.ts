import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEACHER_SHARE = 0.9;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacher_id");

    if (!teacherId) {
      return NextResponse.json({ error: "teacher_id required" }, { status: 400 });
    }

    // purchases
    const { data: purchases } = await supabase
      .from("purchases")
      .select("amount, type, user_id")
      .eq("teacher_id", teacherId)
      .eq("payment_status", "success");

    // wallet
    const { data: wallet } = await supabase
      .from("teacher_wallet")
      .select("available_balance, pending_balance")
      .eq("teacher_id", teacherId)
      .single();

    const totalEarnings =
      (purchases || []).reduce((s, p) => s + (p.amount || 0) * TEACHER_SHARE, 0);

    const students = new Set((purchases || []).map((p: any) => p.user_id));

    return NextResponse.json({
      totalEarnings: Math.round(totalEarnings),
      availableBalance: wallet?.available_balance || 0,
      pendingBalance: wallet?.pending_balance || 0,
      totalStudents: students.size,
      totalSold: (purchases || []).filter((p: any) => p.type === "buy").length,
      totalRentals: (purchases || []).filter((p: any) => p.type === "rent").length,
      earningsChange: 0,
      studentsChange: 0,
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}