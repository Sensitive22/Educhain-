"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, IndianRupee, Users, BookOpen,
  Clock, Wallet, ArrowDownToLine, RefreshCw, ChevronRight,
  AlertCircle, CheckCircle2, XCircle, Loader2, Eye,
  ShoppingCart, RotateCcw, Award, BarChart3, ArrowUpRight,
  Filter, X, ChevronDown, Video, Banknote, Percent
} from "lucide-react";
import { supabase } from "@/lib/analytics";
import {
  fetchStatsOverview, fetchEarningsChart, fetchLecturePerformance,
  fetchRecentTransactions, fetchWalletData, fetchWithdrawalHistory,
  requestWithdrawal
} from "@/lib/analytics";
import type {
  StatsOverview, EarningsPoint, LecturePerformance,
  Transaction, WalletData, WithdrawalRequest, DateFilter
} from "@/lib/types/analytics";

// ─── Sub-components ────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, change, changeLabel, color, prefix = ""
}: {
  label: string; value: string | number; icon: any;
  change?: number; changeLabel?: string;
  color: "emerald" | "violet" | "amber" | "sky" | "rose" | "indigo";
  prefix?: string;
}) {
  const colorMap = {
    emerald: { bg: "bg-emerald-50", icon: "bg-emerald-500", text: "text-emerald-600", ring: "ring-emerald-100" },
    violet: { bg: "bg-violet-50", icon: "bg-violet-500", text: "text-violet-600", ring: "ring-violet-100" },
    amber: { bg: "bg-amber-50", icon: "bg-amber-500", text: "text-amber-600", ring: "ring-amber-100" },
    sky: { bg: "bg-sky-50", icon: "bg-sky-500", text: "text-sky-600", ring: "ring-sky-100" },
    rose: { bg: "bg-rose-50", icon: "bg-rose-500", text: "text-rose-600", ring: "ring-rose-100" },
    indigo: { bg: "bg-indigo-50", icon: "bg-indigo-500", text: "text-indigo-600", ring: "ring-indigo-100" },
  };
  const c = colorMap[color];
  const isPositive = (change ?? 0) >= 0;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white ring-1 ${c.ring} shadow-sm hover:shadow-md transition-all duration-300 group`}>
      <div className={`absolute top-0 right-0 w-32 h-32 ${c.bg} rounded-full -translate-y-8 translate-x-8 opacity-60 group-hover:scale-110 transition-transform duration-500`} />
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 ${c.icon} rounded-xl flex items-center justify-center shadow-sm`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-slate-900 tracking-tight">
          {prefix}{typeof value === "number" ? value.toLocaleString("en-IN") : value}
        </p>
        <p className="text-sm text-slate-500 mt-1">{label}</p>
        {changeLabel && (
          <p className="text-xs text-slate-400 mt-2">{changeLabel}</p>
        )}
      </div>
    </div>
  );
}

function DateFilterTabs({ value, onChange }: { value: DateFilter; onChange: (v: DateFilter) => void }) {
  const tabs: { label: string; value: DateFilter }[] = [
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
    { label: "90 Days", value: "90d" },
    { label: "All Time", value: "all" },
  ];
  return (
    <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            value === t.value
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const CHART_COLORS = {
  primary: "#7c3aed",
  secondary: "#0ea5e9",
  accent: "#f59e0b",
  success: "#10b981",
  danger: "#f43f5e",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white rounded-xl px-4 py-3 shadow-2xl text-sm">
      <p className="font-semibold text-slate-300 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name === "earnings" ? `₹${p.value.toLocaleString("en-IN")}` : `${p.value} sales`}
        </p>
      ))}
    </div>
  );
};

// ─── Withdrawal Modal ────────────────────────────────────────────────────────

function WithdrawalModal({
  available, onClose, onSuccess
}: { available: number; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const num = parseFloat(amount);
    if (!num || num < 100) return setError("Minimum withdrawal is ₹100");
    if (num > available) return setError("Exceeds available balance");
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const result = await requestWithdrawal(user.id, num);
    setLoading(false);
    if (result.success) onSuccess();
    else setError(result.error || "Failed to request withdrawal");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
        <div className="mb-6">
          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
            <Banknote className="w-6 h-6 text-violet-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Request Withdrawal</h3>
          <p className="text-sm text-slate-500 mt-1">
            Available: <span className="font-semibold text-emerald-600">₹{available.toLocaleString("en-IN")}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(null); }}
                placeholder="Enter amount"
                className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-lg font-semibold"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(String(Math.min(amt, available)))}
                  className="text-xs px-3 py-1 bg-slate-100 hover:bg-violet-100 hover:text-violet-700 rounded-lg transition-colors"
                >
                  ₹{amt}
                </button>
              ))}
              <button
                onClick={() => setAmount(String(available))}
                className="text-xs px-3 py-1 bg-slate-100 hover:bg-violet-100 hover:text-violet-700 rounded-lg transition-colors font-medium"
              >
                Max
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Withdrawals are processed within 3–5 business days. Minimum ₹100. Your bank/UPI details must be configured in Settings.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2">
              <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !amount}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowDownToLine className="w-5 h-5" />}
            {loading ? "Submitting..." : "Request Withdrawal"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Table sort ────────────────────────────────────────────────────────────

type SortKey = "totalRevenue" | "totalSales" | "studentsEnrolled" | "conversionRate";

// ─── MAIN DASHBOARD ─────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("30d");
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [chartData, setChartData] = useState<EarningsPoint[]>([]);
  const [lectures, setLectures] = useState<LecturePerformance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "lectures" | "transactions" | "wallet">("overview");
  const [sortKey, setSortKey] = useState<SortKey>("totalRevenue");
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [chartType, setChartType] = useState<"earnings" | "sales">("earnings");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [s, c, l, t, w, wr] = await Promise.all([
      fetchStatsOverview(user.id),
      fetchEarningsChart(user.id),
      fetchLecturePerformance(user.id),
      fetchRecentTransactions(user.id),
      fetchWalletData(user.id),
      fetchWithdrawalHistory(user.id),
    ]);

    setStats(s); setChartData(c); setLectures(l);
    setTransactions(t); setWallet(w); setWithdrawals(wr);
    setLoading(false);
  }, [dateFilter]);

  useEffect(() => { load(); }, [load]);

  const sortedLectures = [...lectures].sort((a, b) => b[sortKey] - a[sortKey]);

  const topLecture = lectures[0];
  const totalRevenue = lectures.reduce((s, l) => s + l.totalRevenue, 0);
  const platformRevenue = transactions.reduce((s, t) => s + t.platformFee, 0);
  const teacherRevenue = transactions.reduce((s, t) => s + t.teacherEarning, 0);

  const pieData = [
    { name: "Your Earnings (90%)", value: teacherRevenue, color: CHART_COLORS.primary },
    { name: "Platform Fee (10%)", value: platformRevenue, color: "#e2e8f0" },
  ];

  const pricingBreakdown = [
    { name: "Buy", value: lectures.reduce((s, l) => s + l.buyCount, 0), color: CHART_COLORS.primary },
    { name: "Rent", value: lectures.reduce((s, l) => s + l.rentCount, 0), color: CHART_COLORS.secondary },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-violet-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Loading your analytics…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Earnings & Analytics</h1>
              <p className="text-sm text-slate-500">Track performance, revenue, and student engagement</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <DateFilterTabs value={dateFilter} onChange={setDateFilter} />
              <button
                onClick={load}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex gap-1 mt-4 border-b border-slate-100 -mb-px">
            {(["overview", "lectures", "transactions", "wallet"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition-all ${
                  activeTab === tab
                    ? "border-violet-600 text-violet-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard
                label="Total Earnings" prefix="₹"
                value={stats?.totalEarnings?.toFixed(0) ?? 0}
                icon={IndianRupee} color="violet"
                change={stats?.earningsChange} changeLabel="vs previous period"
              />
              <StatCard
                label="Available Balance" prefix="₹"
                value={wallet?.availableBalance?.toFixed(0) ?? 0}
                icon={Wallet} color="emerald"
              />
              <StatCard
                label="Pending Balance" prefix="₹"
                value={wallet?.pendingBalance?.toFixed(0) ?? 0}
                icon={Clock} color="amber"
              />
              <StatCard
                label="Total Students"
                value={stats?.totalStudents ?? 0}
                icon={Users} color="sky"
                change={stats?.studentsChange} changeLabel="vs previous period"
              />
              <StatCard
                label="Lectures Sold"
                value={stats?.totalSold ?? 0}
                icon={ShoppingCart} color="indigo"
              />
              <StatCard
                label="Active Rentals"
                value={stats?.totalRentals ?? 0}
                icon={RotateCcw} color="rose"
              />
            </div>

            {/* Top Lecture Highlight */}
            {topLecture && (
              <div className="bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm font-semibold text-violet-200 uppercase tracking-wider">Top Performing Lecture</span>
                </div>
                <div className="flex items-center gap-6 flex-wrap">
                  {topLecture.thumbnail ? (
                    <img src={topLecture.thumbnail} alt={topLecture.title} className="w-20 h-20 rounded-xl object-cover ring-2 ring-white/30" />
                  ) : (
                    <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center">
                      <Video className="w-8 h-8 text-white/60" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold truncate">{topLecture.title}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                      <span className="text-violet-200">₹{topLecture.totalRevenue.toLocaleString("en-IN")} earned</span>
                      <span className="text-violet-200">{topLecture.studentsEnrolled} students</span>
                      <span className="text-violet-200">{topLecture.totalSales} sales</span>
                      <span className="text-yellow-300 font-semibold">{topLecture.conversionRate}% conversion</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Earnings Chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-100">
                <SectionHeader
                  title="Revenue Over Time"
                  subtitle={`${dateFilter === "7d" ? "Last 7 days" : dateFilter === "30d" ? "Last 30 days" : dateFilter === "90d" ? "Last 90 days" : "All time"}`}
                  action={
                    <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                      {(["earnings", "sales"] as const).map((t) => (
                        <button key={t} onClick={() => setChartType(t)}
                          className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all ${chartType === t ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  }
                />
                {chartData.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <BarChart3 className="w-10 h-10 mb-2" />
                    <p className="text-sm">No data for selected period</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                        tickFormatter={(v) => chartType === "earnings" ? `₹${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}` : String(v)} />
                      <Tooltip content={<CustomTooltip />} />
                      {chartType === "earnings" ? (
                        <Area type="monotone" dataKey="earnings" stroke={CHART_COLORS.primary}
                          strokeWidth={2.5} fill="url(#earningsGrad)" dot={false} activeDot={{ r: 5, fill: CHART_COLORS.primary }} />
                      ) : (
                        <Area type="monotone" dataKey="sales" stroke={CHART_COLORS.secondary}
                          strokeWidth={2.5} fill="url(#salesGrad)" dot={false} activeDot={{ r: 5, fill: CHART_COLORS.secondary }} />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Revenue Split Pie */}
              <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-100">
                <SectionHeader title="Revenue Split" subtitle="Platform vs. you" />
                {teacherRevenue + platformRevenue === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-400">
                    <Percent className="w-8 h-8 mb-2" />
                    <p className="text-sm">No sales yet</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                          dataKey="value" strokeWidth={0}>
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {pieData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-xs text-slate-600">{d.name}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-900">₹{d.value.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Pricing Breakdown */}
            {pricingBreakdown.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-100">
                <SectionHeader title="Sales by Type" subtitle="Buy vs. rental breakdown" />
                <div className="grid grid-cols-2 gap-4 max-w-xs">
                  {pricingBreakdown.map((p) => (
                    <div key={p.name} className="text-center p-4 rounded-xl bg-slate-50">
                      <p className="text-3xl font-bold" style={{ color: p.color }}>{p.value}</p>
                      <p className="text-sm text-slate-500 mt-1">{p.name}s</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── LECTURES TAB ── */}
        {activeTab === "lectures" && (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Lecture Performance</h2>
                  <p className="text-sm text-slate-500">{lectures.length} lectures tracked</p>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">Sort by:</span>
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 outline-none"
                  >
                    <option value="totalRevenue">Highest Earning</option>
                    <option value="totalSales">Most Sold</option>
                    <option value="studentsEnrolled">Most Students</option>
                    <option value="conversionRate">Best Conversion</option>
                  </select>
                </div>
              </div>
            </div>

            {sortedLectures.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3" />
                <p>No lecture data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lecture</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Price</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Revenue</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Sales</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Buys</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Rents</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Students</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Conversion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sortedLectures.map((lec, idx) => (
                      <tr key={lec.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-300 text-sm font-mono w-5">{idx + 1}</span>
                            {lec.thumbnail ? (
                              <img src={lec.thumbnail} alt={lec.title} className="w-12 h-9 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-12 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Video className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">{lec.title}</p>
                              <p className="text-xs text-slate-400 capitalize">{lec.pricingModel}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-medium text-slate-700">
                            {lec.pricingModel === "free" ? "Free" : `₹${lec.price}`}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-bold text-emerald-600">₹{lec.totalRevenue.toLocaleString("en-IN")}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-semibold text-slate-900">{lec.totalSales}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm text-slate-600">{lec.buyCount}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm text-slate-600">{lec.rentCount}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm text-slate-600">{lec.studentsEnrolled}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min(lec.conversionRate, 100)}%` }} />
                            </div>
                            <span className={`text-xs font-semibold ${lec.conversionRate > 10 ? "text-emerald-600" : lec.conversionRate > 5 ? "text-amber-600" : "text-slate-500"}`}>
                              {lec.conversionRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TRANSACTIONS TAB ── */}
        {activeTab === "transactions" && (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
              <p className="text-sm text-slate-500">Last 10 purchases from your students</p>
            </div>

            {transactions.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3" />
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lecture</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Platform (10%)</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">You (90%)</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{tx.studentName}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[150px]">{tx.studentEmail}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {tx.lectureThumbnail ? (
                              <img src={tx.lectureThumbnail} alt={tx.lectureTitle} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Video className="w-4 h-4 text-slate-400" />
                              </div>
                            )}
                            <p className="text-sm text-slate-700 truncate max-w-[140px]">{tx.lectureTitle}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-semibold text-slate-900">₹{tx.amount.toLocaleString("en-IN")}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm text-rose-500">-₹{tx.platformFee.toLocaleString("en-IN")}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-bold text-emerald-600">₹{tx.teacherEarning.toLocaleString("en-IN")}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            tx.type === "buy" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"
                          }`}>
                            {tx.type === "buy" ? "Purchase" : "Rental"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</p>
                          {tx.paymentId && <p className="text-xs text-slate-400 font-mono truncate max-w-[100px]">{tx.paymentId}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            tx.status === "success" ? "bg-emerald-100 text-emerald-700"
                            : tx.status === "pending" ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                          }`}>
                            {tx.status === "success" ? <CheckCircle2 className="w-3 h-3" /> : tx.status === "pending" ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── WALLET TAB ── */}
        {activeTab === "wallet" && (
          <div className="space-y-6">
            {withdrawalSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-900">Withdrawal requested!</p>
                  <p className="text-sm text-emerald-700">We'll process it within 3–5 business days.</p>
                </div>
                <button onClick={() => setWithdrawalSuccess(false)} className="ml-auto text-emerald-500 hover:text-emerald-700"><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Wallet Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Earned" prefix="₹" value={wallet?.totalEarnings?.toFixed(0) ?? 0} icon={TrendingUp} color="violet" />
              <StatCard label="Available to Withdraw" prefix="₹" value={wallet?.availableBalance?.toFixed(0) ?? 0} icon={Wallet} color="emerald" />
              <StatCard label="Pending (Processing)" prefix="₹" value={wallet?.pendingBalance?.toFixed(0) ?? 0} icon={Clock} color="amber" />
              <StatCard label="Total Withdrawn" prefix="₹" value={wallet?.totalWithdrawn?.toFixed(0) ?? 0} icon={ArrowDownToLine} color="sky" />
            </div>

            {/* Withdraw Button Panel */}
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-bold text-slate-900">Request Payout</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Available: <span className="font-semibold text-emerald-600">₹{(wallet?.availableBalance ?? 0).toLocaleString("en-IN")}</span>
                    <span className="mx-2 text-slate-300">·</span>
                    Minimum ₹100 · Processed in 3–5 days
                  </p>
                </div>
                <button
                  onClick={() => setShowWithdrawalModal(true)}
                  disabled={(wallet?.availableBalance ?? 0) < 100}
                  className="flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Request Withdrawal
                </button>
              </div>
            </div>

            {/* Withdrawal History */}
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Withdrawal History</h3>
              </div>
              {withdrawals.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <ArrowDownToLine className="w-10 h-10 mx-auto mb-3" />
                  <p>No withdrawal requests yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          w.status === "approved" ? "bg-emerald-100" : w.status === "rejected" ? "bg-rose-100" : "bg-amber-100"
                        }`}>
                          {w.status === "approved" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                           : w.status === "rejected" ? <XCircle className="w-5 h-5 text-rose-600" />
                           : <Clock className="w-5 h-5 text-amber-600" />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">₹{w.amount.toLocaleString("en-IN")}</p>
                          <p className="text-xs text-slate-400">
                            Requested {new Date(w.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            {w.processedAt && ` · Processed ${new Date(w.processedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          w.status === "approved" ? "bg-emerald-100 text-emerald-700"
                          : w.status === "rejected" ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                        }`}>
                          {w.status}
                        </span>
                        {w.notes && <p className="text-xs text-slate-400 mt-1">{w.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <WithdrawalModal
          available={wallet?.availableBalance ?? 0}
          onClose={() => setShowWithdrawalModal(false)}
          onSuccess={() => {
            setShowWithdrawalModal(false);
            setWithdrawalSuccess(true);
            load();
          }}
        />
      )}
    </div>
  );
}