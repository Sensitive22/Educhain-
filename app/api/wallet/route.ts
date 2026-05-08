import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacher_id");

  if (!teacherId) return NextResponse.json({ error: "teacher_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("teacher_wallet")
    .select("*")
    .eq("teacher_id", teacherId)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    wallet: data || { total_earnings: 0, available_balance: 0, pending_balance: 0, total_withdrawn: 0 }
  });
}