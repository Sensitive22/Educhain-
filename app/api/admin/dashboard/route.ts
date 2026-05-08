import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {

    // ================= TOTAL SALES =================
    const { data: salesData, error: salesError } = await supabase
      .from("purchases")
      .select("amount");

    if (salesError) throw salesError;

    let totalSales = 0;
    salesData?.forEach(p => {
      totalSales += Number(p.amount || 0);
    });

    // ================= PLATFORM COMMISSION (10%) =================
    const platformCommission = Math.floor(totalSales * 0.10);

    // ================= PARALLEL COUNTS =================
    const [
      studentsRes,
      teachersRes,
      lecturesRes,
      pendingWithdrawRes
    ] = await Promise.all([

      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student"),

      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "teacher"),

      supabase
        .from("lectures")
        .select("*", { count: "exact", head: true }),

      supabase
        .from("withdrawal_requests")
        .select("amount")
        .eq("status", "pending")
    ]);

    // ================= PENDING WITHDRAW AMOUNT =================
    let pendingWithdrawAmount = 0;
    pendingWithdrawRes.data?.forEach(w => {
      pendingWithdrawAmount += Number(w.amount || 0);
    });

    const pendingWithdrawCount = pendingWithdrawRes.data?.length || 0;

    // ================= FINAL RESPONSE =================
    return NextResponse.json({
      totalSales,                     // total revenue
      platformCommission,             // your 10%
      totalStudents: studentsRes.count || 0,
      totalTeachers: teachersRes.count || 0,
      totalLectures: lecturesRes.count || 0,
      pendingWithdrawAmount,
      pendingWithdrawCount,
      
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}