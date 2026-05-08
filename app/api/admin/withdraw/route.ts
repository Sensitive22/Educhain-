import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

//////////////////////////////////////////////////////
// GET → Fetch pending withdrawals with name + email
//////////////////////////////////////////////////////
export async function GET() {
  try {
    const { data: withdrawals, error } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!withdrawals?.length) return NextResponse.json({ data: [] });

    const teacherIds = withdrawals.map(w => w.teacher_id);

    // Get teacher names
    const { data: users } = await supabase
      .from("user_settings")
      .select("user_id, full_name")
      .in("user_id", teacherIds);

    // Get teacher emails
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", teacherIds);

    // Create lookup maps
    const nameMap: Record<string, string> = {};
    users?.forEach(u => {
      nameMap[u.user_id] = u.full_name;
    });

    const emailMap: Record<string, string> = {};
    profiles?.forEach(p => {
      emailMap[p.id] = p.email;
    });

    const merged = withdrawals.map(w => ({
      ...w,
      teacher_name: nameMap[w.teacher_id] || "Unknown Teacher",
      teacher_email: emailMap[w.teacher_id] || "No Email",
    }));

    return NextResponse.json({ data: merged });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

//////////////////////////////////////////////////////
// POST → Approve / Reject withdrawal
//////////////////////////////////////////////////////
export async function POST(req: NextRequest) {
try {
const body = await req.json();
const { id, action } = body;


if (!id || !["approved", "rejected"].includes(action)) {
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

// fetch withdrawal
const { data: withdrawal, error } = await supabase
  .from("withdrawal_requests")
  .select("*")
  .eq("id", id)
  .single();

if (error || !withdrawal) {
  return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
}

if (withdrawal.status !== "pending") {
  return NextResponse.json({ error: "Already processed" }, { status: 400 });
}

const { teacher_id, amount } = withdrawal;

// update withdrawal status
await supabase
  .from("withdrawal_requests")
  .update({
    status: action,
    processed_at: new Date().toISOString(),
  })
  .eq("id", id);

// fetch wallet
const { data: wallet } = await supabase
  .from("teacher_wallet")
  .select("*")
  .eq("teacher_id", teacher_id)
  .single();

if (!wallet) {
  return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
}

let newPending = (wallet.pending_balance || 0) - amount;
if (newPending < 0) newPending = 0;

const updateWallet: any = {
  pending_balance: newPending,
  updated_at: new Date().toISOString(),
};

if (action === "approved") {
  updateWallet.withdrawn_amount =
    (wallet.withdrawn_amount || 0) + amount;
} else {
  updateWallet.available_balance =
    (wallet.available_balance || 0) + amount;
}

await supabase
  .from("teacher_wallet")
  .update(updateWallet)
  .eq("teacher_id", teacher_id);

return NextResponse.json({ success: true });


} catch (err: any) {
return NextResponse.json({ error: err.message }, { status: 500 });
}
}
