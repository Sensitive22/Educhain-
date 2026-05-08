import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacher_id");

  if (!teacherId) {
    return NextResponse.json({ error: "teacher_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("purchases")
    .select(`
      id,
      amount,
      type,
      payment_status,
      created_at,
      lecture_id,
      user_id,
      lectures(title, thumbnail_cid),
      user_settings!purchases_user_id_fkey(full_name)
    `)
    .eq("teacher_id", teacherId)
    .eq("payment_status", "success")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = (data || []).map((p: any) => ({
    id: p.id,
    studentName: p.user_settings?.full_name || "Student",

    lectureTitle: p.lectures?.title || "Lecture",
    lectureThumbnail: p.lectures?.thumbnail_cid
      ? `https://gateway.pinata.cloud/ipfs/${p.lectures.thumbnail_cid}`
      : "",

    amount: p.amount,
    platformFee: (p.amount * 0.1).toFixed(2),
    teacherEarning: (p.amount * 0.9).toFixed(2),

    date: p.created_at,
    type: p.type,
    status: p.payment_status,
  }));

  return NextResponse.json(result);
}