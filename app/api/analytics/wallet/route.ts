import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacher_id");

    if (!teacherId) {
      return NextResponse.json({ error: "teacher_id required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("teacher_wallet")
      .select("*")
      .eq("teacher_id", teacherId)
      .single();

    if (error || !data) {
      return NextResponse.json({
        totalEarnings: 0,
        availableBalance: 0,
        pendingBalance: 0,
        totalWithdrawn: 0,
      });
    }

    return NextResponse.json({
      totalEarnings: data.total_earnings || 0,
      availableBalance: data.available_balance || 0,
      pendingBalance: data.pending_balance || 0,
      totalWithdrawn: data.withdrawn_amount || 0,
    });

  } catch (err) {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}