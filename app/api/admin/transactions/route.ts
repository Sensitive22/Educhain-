import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {

    // ================= FETCH PURCHASES =================
    const { data: purchases, error } = await supabase
      .from("purchases")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!purchases) return NextResponse.json({ data: [] });

    // ================= GET STUDENT NAMES =================
    const studentIds = purchases.map(p => p.user_id);
    const lectureIds = purchases.map(p => p.lecture_id);

    const { data: students } = await supabase
      .from("user_settings")
      .select("user_id, full_name")
      .in("user_id", studentIds);

    const { data: lectures } = await supabase
      .from("lectures")
      .select("id, title, user_id")
      .in("id", lectureIds);

    // ================= GET TEACHER NAMES =================
    const teacherIds = lectures?.map(l => l.user_id) || [];

    const { data: teachers } = await supabase
      .from("user_settings")
      .select("user_id, full_name")
      .in("user_id", teacherIds);

    // ================= MAPS =================
    const studentMap: Record<string, string> = {};
    students?.forEach(s => {
      studentMap[s.user_id] = s.full_name;
    });

    const lectureMap: Record<string, string> = {};
    lectures?.forEach(l => {
      lectureMap[l.id] = l.title;
    });

    const teacherMap: Record<string, string> = {};
    teachers?.forEach(t => {
      teacherMap[t.user_id] = t.full_name;
    });

    // ================= FINAL FORMAT =================
    const formatted = purchases.map(p => {
      const lecture = lectures?.find(l => l.id === p.lecture_id);
      const teacherId = lecture?.user_id;

      const amount = Number(p.amount || 0);
      const platformFee = Math.round(amount * 0.1);
      const teacherEarning = amount - platformFee;

      return {
        id: p.id,
        student: studentMap[p.user_id] || "Student",
        lecture: lectureMap[p.lecture_id] || "Lecture",
        amount,
        teacherEarning,
        platformFee,
        status: "success",
        created_at: p.created_at
      };
    });

    return NextResponse.json({ data: formatted });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}