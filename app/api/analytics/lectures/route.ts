import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SHARE = 0.9;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacher_id");

  const { data: lectures } = await supabase
    .from("lectures")
    .select("*")
    .eq("user_id", teacherId);

  const { data: purchases } = await supabase
    .from("purchases")
    .select("*")
    .eq("teacher_id", teacherId)
    .eq("payment_status", "success");

  const result =
    (lectures || []).map((lec: any) => {
      const lp = (purchases || []).filter((p: any) => p.lecture_id === lec.id);

      return {
        id: lec.id,
        title: lec.title,
        price: lec.price,
        totalSales: lp.length,
        totalRevenue: lp.reduce(
          (s: number, p: any) => s + (p.amount || 0) * SHARE,
          0
        ),
        studentsEnrolled: new Set(lp.map((p: any) => p.user_id)).size,
        buyCount: lp.filter((p: any) => p.type === "buy").length,
        rentCount: lp.filter((p: any) => p.type === "rent").length,
        thumbnail: lec.thumbnail_cid
          ? `https://gateway.pinata.cloud/ipfs/${lec.thumbnail_cid}`
          : "",
      };
    }) || [];

  return NextResponse.json(result);
}