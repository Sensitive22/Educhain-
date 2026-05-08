import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ethers } from "ethers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

// ✅ Public Polygon Amoy RPC — env variable optional, fallback always works
const RPC_URL =
  "https://rpc-amoy.polygon.technology";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txHash, lectureId, userId } = body;

    if (!txHash || !lectureId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: txHash, lectureId, userId" },
        { status: 400 }
      );
    }

    // 1. Verify transaction on-chain
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    let receipt: ethers.TransactionReceipt | null = null;
    try {
      receipt = await provider.getTransactionReceipt(txHash);
    } catch (err) {
      return NextResponse.json(
        { error: "Failed to fetch transaction receipt" },
        { status: 500 }
      );
    }

    if (!receipt) {
      return NextResponse.json(
        { error: "Transaction receipt not found. It may still be pending." },
        { status: 400 }
      );
    }

    if (receipt.status !== 1) {
      return NextResponse.json(
        { error: "Transaction failed on-chain" },
        { status: 400 }
      );
    }

    if (receipt.to?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
      return NextResponse.json(
        { error: "Transaction was not sent to the expected contract address" },
        { status: 400 }
      );
    }

    // 2. Check for duplicate purchase
    const { data: existingPurchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("transaction_hash", txHash)
      .maybeSingle();

    if (existingPurchase) {
      return NextResponse.json(
        { error: "Transaction already recorded" },
        { status: 409 }
      );
    }

    // 3. Fetch lecture (teacher_id is lectures.user_id)
    const { data: lecture, error: lectureError } = await supabase
      .from("lectures")
      .select("id, user_id, price, currency")
      .eq("id", lectureId)
      .single();

    if (lectureError || !lecture) {
      return NextResponse.json(
        { error: `Lecture not found: ${lectureError?.message ?? "unknown error"}` },
        { status: 404 }
      );
    }

    // 4. Insert purchase record
    const { data: purchase, error: insertError } = await supabase
      .from("purchases")
      .insert({
        lecture_id: lectureId,
        user_id: userId,           // student_id
        teacher_id: lecture.user_id, // from lectures.user_id
        amount: lecture.price,
        currency: "crypto",
        type: "buy",
        payment_status: "success",
        transaction_hash: txHash,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("DB insert error:", insertError);
      return NextResponse.json(
        { error: `Failed to record purchase: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, purchase }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    console.error("verify-crypto-purchase error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}