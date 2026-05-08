import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

import type {
  StatsOverview,
  EarningsPoint,
  LecturePerformance,
  Transaction,
  WalletData,
  WithdrawalRequest,
  DateFilter,
} from "@/lib/types/analytics";

const API = "/api/analytics";

// ───────────────── STATS OVERVIEW ─────────────────
export async function fetchStatsOverview(teacherId: string): Promise<StatsOverview> {
  const res = await fetch(`${API}/stats?teacher_id=${teacherId}`);
  const data = await res.json();

  return {
    totalEarnings: Number(data.totalEarnings || 0),
    availableBalance: Number(data.availableBalance || 0),
    pendingBalance: Number(data.pendingBalance || 0),
    totalStudents: Number(data.totalStudents || 0),
    totalSold: Number(data.totalSold || 0),
    totalRentals: Number(data.totalRentals || 0),
    earningsChange: Number(data.earningsChange || 0),
    studentsChange: Number(data.studentsChange || 0),
  };
}

// ───────────────── CHART ─────────────────
export async function fetchEarningsChart(teacherId: string): Promise<EarningsPoint[]> {
  const res = await fetch(`${API}/chart?teacher_id=${teacherId}`);
  const data = await res.json();
  return data || [];
}

// ───────────────── LECTURE PERFORMANCE ─────────────────
export async function fetchLecturePerformance(teacherId: string): Promise<LecturePerformance[]> {
  const res = await fetch(`${API}/lectures?teacher_id=${teacherId}`);
  const data = await res.json();
  return data || [];
}

// ───────────────── TRANSACTIONS FIX ─────────────────
export async function fetchRecentTransactions(teacherId: string): Promise<Transaction[]> {
  const res = await fetch(`${API}/transactions?teacher_id=${teacherId}`);
  const data = await res.json();

  if (!data || !Array.isArray(data)) return [];

  return data.map((t: any) => ({
    id: t.id,
    studentName: t.studentName || "Student",
    studentEmail: t.studentEmail || "",
    lectureTitle: t.lectureTitle || "Lecture",
    lectureThumbnail: t.lectureThumbnail || "",
    amount: Number(t.amount || 0),
    platformFee: Number(t.platformFee || 0),
    teacherEarning: Number(t.teacherEarning || 0),
    date: t.date,
    paymentId: t.paymentId || "",
    type: t.type,
    status: t.status,
  }));
}

// ───────────────── WALLET FIX ─────────────────
export async function fetchWalletData(teacherId: string): Promise<WalletData> {
  const res = await fetch(`${API}/wallet?teacher_id=${teacherId}`);
  const data = await res.json();

  return {
    totalEarnings: Number(data.totalEarnings || 0),
    availableBalance: Number(data.availableBalance || 0),
    pendingBalance: Number(data.pendingBalance || 0),
    totalWithdrawn: Number(data.totalWithdrawn || 0),
  };
}

// ───────────────── WITHDRAW HISTORY ─────────────────
export async function fetchWithdrawalHistory(teacherId: string): Promise<WithdrawalRequest[]> {
  const res = await fetch(`${API}/withdrawals?teacher_id=${teacherId}`);
  const data = await res.json();
  return data || [];
}

// ───────────────── WITHDRAW REQUEST ─────────────────
export async function requestWithdrawal(teacherId: string, amount: number) {
  const res = await fetch(`${API}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      teacher_id: teacherId,
      amount,
    }),
  });

  return res.json();
}