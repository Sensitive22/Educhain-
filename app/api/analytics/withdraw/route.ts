import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { teacher_id, amount } = await req.json();

  if (!teacher_id || !amount) {
    return NextResponse.json({ error: "missing data" }, { status: 400 });
  }

  const { data: wallet } = await supabase
    .from("teacher_wallet")
    .select("*")
    .eq("teacher_id", teacher_id)
    .single();

  if (!wallet || wallet.available_balance < amount) {
    return NextResponse.json({ error: "insufficient balance" }, { status: 400 });
  }

  await supabase.from("withdrawal_requests").insert({
    teacher_id,
    amount,
    status: "pending",
  });

  await supabase
    .from("teacher_wallet")
    .update({
      available_balance: wallet.available_balance - amount,
      pending_balance: wallet.pending_balance + amount,
    })
    .eq("teacher_id", teacher_id);

  return NextResponse.json({ success: true });
}