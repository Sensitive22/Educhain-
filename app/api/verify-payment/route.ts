import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const razorpay_secret = process.env.RAZORPAY_KEY_SECRET!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role (important)
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      lectureId,
      type,
      userId
    } = body;

    // 🔴 basic validation
    if (!userId || !lectureId || !razorpay_payment_id) {
      return NextResponse.json({ success: false, message: "Missing data" });
    }

    // 🔐 signature verify
    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", razorpay_secret)
      .update(sign.toString())
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return NextResponse.json({ success: false, message: "Invalid signature" });
    }

    // 📘 lecture fetch
    const { data: lecture, error: lectureError } = await supabase
      .from("lectures")
      .select("*")
      .eq("id", lectureId)
      .single();

    if (lectureError || !lecture) {
      return NextResponse.json({ success: false, message: "Lecture not found" });
    }

    // 🟢 TYPE FIX for DB constraint
    let finalType = "buy";
    if (type === "rent") finalType = "rent";
    if (type === "subscription") finalType = "buy";
    if (type === "purchase") finalType = "buy";

    // 🟠 RENT expiry
    let rentExpiresAt = null;
    if (finalType === "rent") {
      const days = lecture.rent_duration || 30;
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + days);
      rentExpiresAt = expiry.toISOString();
    }

    // 🔍 check duplicate purchase
    const { data: existing } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("lecture_id", lectureId)
      .single();

    if (existing) {
      return NextResponse.json({ success: true });
    }

    // 🧾 insert purchase
    const { error: insertError } = await supabase.from("purchases").insert({
      user_id: userId,
      lecture_id: lectureId,
      amount: lecture.price,
      type: finalType,
      currency: "INR",
      razorpay_order_id,
      razorpay_payment_id,
      payment_status: "success",
      teacher_id: lecture.user_id,
      rent_expires_at: rentExpiresAt
    });

    if (insertError) {
      console.log("Insert error:", insertError);
      return NextResponse.json({ success: false, message: "DB insert failed" });
    }

    // =====================================================
    // 💰 TEACHER WALLET UPDATE (10% commission)
    // =====================================================

    const platformCommission = lecture.price * 0.10;
    const teacherEarning = lecture.price - platformCommission;

    const { data: wallet } = await supabase
      .from("teacher_wallet")
      .select("*")
      .eq("teacher_id", lecture.user_id)
      .single();

    if (!wallet) {
      // create wallet first time
      await supabase.from("teacher_wallet").insert({
        teacher_id: lecture.user_id,
        total_earnings: teacherEarning,
        available_balance: teacherEarning,
        withdrawn_amount: 0
      });
    } else {
      // update existing wallet
      await supabase
        .from("teacher_wallet")
        .update({
          total_earnings: Number(wallet.total_earnings) + teacherEarning,
          available_balance: Number(wallet.available_balance) + teacherEarning
        })
        .eq("teacher_id", lecture.user_id);
    }

    // =====================================================

    return NextResponse.json({ success: true });

  } catch (err) {
    console.log("Verify error:", err);
    return NextResponse.json({ success: false });
  }
}