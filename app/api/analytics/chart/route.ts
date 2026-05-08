import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEACHER_SHARE = 0.9;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacher_id");

  const { data } = await supabase
    .from("purchases")
    .select("amount, created_at")
    .eq("teacher_id", teacherId)
    .eq("payment_status", "success")
    .order("created_at", { ascending: true });

  const grouped: any = {};

  (data || []).forEach((p: any) => {
    const d = new Date(p.created_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });

    if (!grouped[d]) grouped[d] = { date: d, earnings: 0, sales: 0 };

    grouped[d].earnings += (p.amount || 0) * TEACHER_SHARE;
    grouped[d].sales += 1;
  });

  return NextResponse.json(Object.values(grouped));
}