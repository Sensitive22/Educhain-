import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lectureId, amount, type } = body;

    if (!amount) {
      return NextResponse.json({ success: false, message: "Amount missing" });
    }

    // Razorpay amount paisa me hota hai
    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`

    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (err) {
    console.error("Create order error:", err);
    return NextResponse.json({ success: false });
  }
}
