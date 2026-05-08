import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacher_id");
  const filter = searchParams.get("filter") || "30d";

  if (!teacherId) {
    return NextResponse.json({ error: "teacher_id required" }, { status: 400 });
  }

  const days = filter === "7d" ? 7 : filter === "30d" ? 30 : filter === "90d" ? 90 : null;
  const from = days ? new Date(Date.now() - days * 86400000).toISOString() : null;

  let query = supabase
    .from("purchases")
    .select("id, amount, teacher_earning, platform_fee, purchase_type, payment_status, created_at, lecture_id, student_id")
    .eq("teacher_id", teacherId)
    .eq("payment_status", "success")
    .order("created_at", { ascending: false });

  if (from) query = query.gte("created_at", from);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ purchases: data });
}