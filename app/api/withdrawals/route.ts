import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { teacher_id, amount } = await req.json();

    if (!teacher_id || !amount) {
      return NextResponse.json({ error: "teacher_id and amount required" }, { status: 400 });
    }

    if (amount < 100) {
      return NextResponse.json({ error: "Minimum withdrawal is ₹100" }, { status: 400 });
    }

    // Check available balance
    const { data: wallet } = await supabase
      .from("teacher_wallet")
      .select("available_balance, pending_balance")
      .eq("teacher_id", teacher_id)
      .single();

    if (!wallet || wallet.available_balance < amount) {
      return NextResponse.json({ error: "Insufficient available balance" }, { status: 400 });
    }

    // Create withdrawal request
    const { data: withdrawal, error: wError } = await supabase
      .from("withdrawal_requests")
      .insert({ teacher_id, amount, status: "pending" })
      .select()
      .single();

    if (wError) return NextResponse.json({ error: wError.message }, { status: 500 });

    // Update wallet balances
    const { error: walletError } = await supabase
      .from("teacher_wallet")
      .update({
        available_balance: wallet.available_balance - amount,
        pending_balance: wallet.pending_balance + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("teacher_id", teacher_id);

    if (walletError) return NextResponse.json({ error: walletError.message }, { status: 500 });

    return NextResponse.json({ success: true, withdrawal });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacher_id");

  if (!teacherId) return NextResponse.json({ error: "teacher_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ withdrawals: data });
}