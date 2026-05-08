"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  GraduationCap,
  BookOpen,
  BarChart3,
  ChevronRight,
  LogOut,
  Filter,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  BookMarked,
  DollarSign,
  Clock,
  Star,
  Menu,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab =
  | "dashboard"
  | "transactions"
  | "withdrawals"
  | "teachers"
  | "lectures"
  | "analytics";

type WithdrawalRequest = {
  id: string;
  teacher_id: string;
  amount: number;
  status: string;
  created_at: string;
  teacher_name: string;
  teacher_email: string;
};

// ─── Sidebar config ───────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { id: "withdrawals", label: "Withdrawals", icon: Wallet },
  { id: "teachers", label: "Teachers", icon: GraduationCap },
  { id: "lectures", label: "Lectures", icon: BookOpen },
  { id: "analytics", label: "Platform Analytics", icon: BarChart3 },
];

const TAB_TITLES: Record<Tab, string> = {
  dashboard: "Admin Overview",
  transactions: "All Transactions",
  withdrawals: "Withdrawal Requests",
  teachers: "Teacher Management",
  lectures: "Lecture Management",
  analytics: "Platform Analytics",
};

// ─── Dark Mode Hook ───────────────────────────────────────────────────────────

function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("adminDarkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved !== null ? saved === "true" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem("adminDarkMode", String(next));
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  return { dark, toggle };
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
        <BarChart3 className="w-7 h-7 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{message}</p>
    </div>
  );
}

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Section Components ───────────────────────────────────────────────────────

function DashboardSection() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalLectures: 0,
    pendingWithdrawAmount: 0,
    pendingWithdrawCount: 0,
    platformCommission: 0,
  });

  useEffect(() => {
    fetchRecentActivity();
    fetchDashboard();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const res = await fetch("/api/admin/recent-activity");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setActivities(json.data || []);
    } catch (err) {
      console.error("Recent activity error:", err);
    } finally {
      setLoadingActivity(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDashboardData(data);
    } catch (err) {
      console.log("Dashboard fetch error", err);
    }
  };

  const stats = [
    {
      label: "Total Platform Earnings",
      icon: DollarSign,
      gradient: "from-violet-500 to-purple-600",
    },
    {
      label: "Total Students",
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      label: "Total Teachers",
      icon: GraduationCap,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      label: "Total Lectures",
      icon: BookMarked,
      gradient: "from-amber-500 to-orange-500",
    },
    {
      label: "Pending Withdrawals",
      icon: Clock,
      gradient: "from-rose-500 to-pink-500",
    },
    {
      label: "Platform Commission",
      icon: TrendingUp,
      gradient: "from-indigo-500 to-violet-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {stats.map((s) => (
          <SectionCard key={s.label} className="p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.gradient} flex-shrink-0`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate">{s.label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5 tracking-tight">
                  {s.label === "Total Platform Earnings" && `₹${dashboardData.totalSales}`}
                  {s.label === "Total Students" && dashboardData.totalStudents}
                  {s.label === "Total Teachers" && dashboardData.totalTeachers}
                  {s.label === "Total Lectures" && dashboardData.totalLectures}
                  {s.label === "Pending Withdrawals" && `₹${dashboardData.pendingWithdrawAmount}`}
                  {s.label === "Platform Commission" && `₹${dashboardData.platformCommission}`}
                </p>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <th className="py-3 px-4 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Activity</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Amount</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {loadingActivity ? (
                <tr><td colSpan={3} className="py-6 text-center text-slate-400 dark:text-slate-500">Loading...</td></tr>
              ) : activities.length === 0 ? (
                <tr><td colSpan={3} className="py-6 text-center text-slate-400 dark:text-slate-500">No recent activity</td></tr>
              ) : (
                activities.map((a, index) => (
                  <tr key={index} className="border-b border-slate-50 dark:border-slate-700/50">
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{a.message}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{a.amount ? `₹${a.amount}` : "-"}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">{new Date(a.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function TransactionsSection() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/admin/transactions");
      const json = await res.json();
      setTransactions(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">💳 Transaction History</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">All platform payments & earnings</p>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">Total: {transactions.length}</div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr className="text-slate-600 dark:text-slate-400 text-xs uppercase">
              <th className="py-3 px-4 text-left">Student</th>
              <th className="py-3 px-4 text-left">Lecture</th>
              <th className="py-3 px-4 text-left">Amount</th>
              <th className="py-3 px-4 text-left">Teacher</th>
              <th className="py-3 px-4 text-left">Platform</th>
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400 dark:text-slate-500">Loading transactions...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400 dark:text-slate-500">No transactions found</td></tr>
            ) : (
              transactions.map((t, i) => (
                <tr key={t.id} className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition ${i % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50/40 dark:bg-slate-800/60"}`}>
                  <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{t.student}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{t.lecture}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">₹{t.amount}</td>
                  <td className="py-3 px-4 font-medium text-green-600 dark:text-green-400">₹{t.teacherEarning}</td>
                  <td className="py-3 px-4 font-medium text-violet-600 dark:text-violet-400">₹{t.platformFee}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-medium">Success</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function WithdrawalsSection() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/withdraw");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch");
      setRequests(json.data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load withdrawal requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    setProcessingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <SectionCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Withdrawal Requests</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Manage teacher payout requests</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {loading ? "Loading..." : `${requests.length} Pending`}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700">
              {["Teacher", "Amount", "Request Date", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="py-3 px-4">
                      <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                      <Wallet className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Withdrawal requests will appear here</p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Approve or reject teacher payouts from this panel</p>
                  </div>
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-700 dark:text-slate-300 text-sm leading-none">{r.teacher_name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{r.teacher_email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">₹{r.amount.toFixed(2)}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-medium capitalize">{r.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        disabled={processingId === r.id}
                        onClick={() => handleAction(r.id, "approved")}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {processingId === r.id ? "..." : "Approve"}
                      </button>
                      <button
                        disabled={processingId === r.id}
                        onClick={() => handleAction(r.id, "rejected")}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-200 dark:hover:bg-rose-900/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {processingId === r.id ? "..." : "Reject"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function TeachersSection() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => { fetchTeachers(); }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/teachers");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch teachers");
      setTeachers(json.data || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const filtered = teachers.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200 flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">Teacher Management</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-none">All registered teachers on the platform</p>
            </div>
          </div>
          {!loading && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-300 self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {teachers.length} Teacher{teachers.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="mt-4 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 flex items-center gap-2.5">
          <p className="text-xs font-medium text-rose-700 dark:text-rose-400">{error}</p>
          <button onClick={fetchTeachers} className="ml-auto text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-800 underline underline-offset-2">Retry</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-700/30">
              {["Teacher", "Email", "Earnings", "Lectures", "Students", "Status", "Action"].map((h) => (
                <th key={h} className="py-3 px-5 text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="py-4 px-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex-shrink-0" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full w-28" />
                  </div>
                </td>
                {Array.from({ length: 5 }).map((__, j) => (
                  <td key={j} className="py-4 px-5"><div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full w-20" /></td>
                ))}
                <td className="py-4 px-5"><div className="h-7 bg-slate-100 dark:bg-slate-700 rounded-lg w-20" /></td>
              </tr>
            ))}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                      <GraduationCap className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {search ? "No teachers match your search" : "No teachers found"}
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && filtered.map((t) => {
              const isActive = t.status === "active";
              return (
                <tr key={t.id} className="group hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors duration-100">
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-[11px] font-bold text-white uppercase">{String(t.name)?.[0] ?? "?"}</span>
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{t.name || "—"}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">{t.email || "—"}</span>
                  </td>
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">₹{Number(t.totalEarnings || 0).toLocaleString("en-IN")}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800">
                      <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">{t.totalLectures ?? 0}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">{t.totalStudents ?? 0}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${isActive ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" : "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                      {isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <button
                      onClick={() => router.push(`/dashboard/admin/teachers/${t.id}`)}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 transition"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/20 flex items-center justify-between">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Showing <span className="text-slate-600 dark:text-slate-300 font-semibold">{filtered.length}</span> teacher{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

function LecturesSection() {
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const router = useRouter();

  const fetchLectures = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/lectures");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch lectures");
      setLectures(json.data || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLectures(); }, []);

  const uniqueTeachers = Array.from(
    new Map(lectures.map((l) => [l.teacherId, l.teacherName])).entries()
  ).map(([id, name]) => ({ id, name }));

  const filtered = lectures.filter((l) => {
    const matchSearch = l.title?.toLowerCase().includes(search.toLowerCase()) || l.teacherName?.toLowerCase().includes(search.toLowerCase());
    const matchTeacher = teacherFilter === "all" || l.teacherId === teacherFilter;
    return matchSearch && matchTeacher;
  });

  const fmt = (n: number) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-200 flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">Lecture Management</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-none">All lectures published on the platform</p>
            </div>
          </div>
          {!loading && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-300 self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {lectures.length} Lecture{lectures.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lectures or teacher name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
            />
          </div>
          <div className="relative sm:w-52">
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Teachers</option>
              {uniqueTeachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800">
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex-1">{error}</p>
          <button onClick={() => { setError(null); fetchLectures(); }} className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-800 underline underline-offset-2">Retry</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-700/30">
              {["Lecture", "Teacher", "Price", "Students", "Revenue", "Status", "Date", "Actions"].map((h) => (
                <th key={h} className="py-3 px-4 text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex-shrink-0" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full w-36" />
                  </div>
                </td>
                {Array.from({ length: 6 }).map((__, j) => (
                  <td key={j} className="py-4 px-4"><div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full w-16" /></td>
                ))}
                <td className="py-4 px-4"><div className="h-7 w-24 bg-slate-100 dark:bg-slate-700 rounded-lg" /></td>
              </tr>
            ))}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                      <BookOpen className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {search || teacherFilter !== "all" ? "No lectures match your filters" : "No lectures found"}
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && filtered.map((lecture) => (
              <tr key={lecture.id} className={`group hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors duration-100 ${lecture.isHidden ? "opacity-60" : ""}`}>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3 max-w-[220px]">
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-700 flex items-center justify-center">
                      {lecture.thumbnailUrl ? (
                        <img src={lecture.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                        </svg>
                      )}
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-snug line-clamp-2">{lecture.title}</p>
                  </div>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-black text-white uppercase">{String(lecture.teacherName)?.[0] ?? "T"}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-none">{lecture.teacherName}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none">{lecture.teacherEmail}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {lecture.price > 0 && (
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded-md">{fmt(lecture.price)}</span>
                  )}
                  {lecture.price === 0 && lecture.rentPrice === 0 && (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 px-2 py-0.5 rounded-md">Free</span>
                  )}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 px-2.5 py-1 rounded-lg">{lecture.totalStudents}</span>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 px-2.5 py-1 rounded-lg">{fmt(lecture.totalRevenue)}</span>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${lecture.isHidden ? "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${lecture.isHidden ? "bg-rose-500" : "bg-emerald-500"}`} />
                    {lecture.isHidden ? "Hidden" : "Visible"}
                  </span>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{fmtDate(lecture.createdAt)}</span>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <button
                    onClick={() => router.push(`/dashboard/admin/lectures/${lecture.id}`)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                  >
                    Lecture Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/20 flex items-center justify-between">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Showing <span className="text-slate-600 dark:text-slate-300 font-semibold">{filtered.length}</span> lecture{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {lectures.filter((l) => !l.isHidden).length} visible
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              {lectures.filter((l) => l.isHidden).length} hidden
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch analytics");
      setData(json);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 dark:bg-slate-700 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-700 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mb-4">
          <BarChart3 className="w-6 h-6 text-rose-400" />
        </div>
        <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm">{error}</p>
        <button onClick={fetchAnalytics} className="mt-4 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition">Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const topRevenue = data.revenueOverTime?.length ? Math.max(...data.revenueOverTime.map((r: any) => r.revenue ?? 0)) : 1;
  const topVolume = data.transactionVolume?.length ? Math.max(...data.transactionVolume.map((r: any) => r.count ?? 0)) : 1;

  const statCards = [
    { label: "Total Revenue", value: fmt(data.totalRevenue ?? 0), icon: DollarSign, gradient: "from-violet-500 to-purple-600", shadow: "shadow-violet-200" },
    { label: "Total Transactions", value: data.totalTransactions ?? 0, icon: ArrowLeftRight, gradient: "from-blue-500 to-cyan-500", shadow: "shadow-blue-200" },
    { label: "Total Teachers", value: data.totalTeachers ?? 0, icon: GraduationCap, gradient: "from-emerald-500 to-teal-500", shadow: "shadow-emerald-200" },
    { label: "Total Students", value: data.totalStudents ?? 0, icon: Users, gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <SectionCard key={s.label} className="p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${s.gradient} shadow-md ${s.shadow}`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate">{s.label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5 tracking-tight">{s.value}</p>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Revenue Over Time</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Daily earnings trend</p>
            </div>
          </div>
          {!data.revenueOverTime?.length ? (
            <div className="flex items-center justify-center h-40 text-slate-400 dark:text-slate-500 text-xs">No data available</div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {data.revenueOverTime.map((r: any, i: number) => {
                const pct = Math.max(4, ((r.revenue ?? 0) / topRevenue) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 w-20 flex-shrink-0 font-medium">{fmtDate(r.date)}</span>
                    <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-20 text-right flex-shrink-0">{fmt(r.revenue ?? 0)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Transaction Volume</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Daily transaction count</p>
            </div>
          </div>
          {!data.transactionVolume?.length ? (
            <div className="flex items-center justify-center h-40 text-slate-400 dark:text-slate-500 text-xs">No data available</div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {data.transactionVolume.map((r: any, i: number) => {
                const pct = Math.max(4, ((r.count ?? 0) / topVolume) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 w-20 flex-shrink-0 font-medium">{fmtDate(r.date)}</span>
                    <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-10 text-right flex-shrink-0">{r.count ?? 0}</span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Top Teachers</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Ranked by revenue earned</p>
            </div>
          </div>
          {!data.topTeachers?.length ? (
            <div className="flex items-center justify-center h-40 text-slate-400 dark:text-slate-500 text-xs">No data available</div>
          ) : (
            <div className="space-y-3">
              {data.topTeachers.map((t: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-700 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-black text-white">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{t.name ?? t.teacher_name ?? "—"}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 rounded-lg flex-shrink-0">{fmt(t.revenue ?? t.total_revenue ?? 0)}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <BookMarked className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Top Lectures</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Ranked by purchase count</p>
            </div>
          </div>
          {!data.topLectures?.length ? (
            <div className="flex items-center justify-center h-40 text-slate-400 dark:text-slate-500 text-xs">No data available</div>
          ) : (
            <div className="space-y-3">
              {data.topLectures.map((l: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-700 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-black text-white">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{l.lecture_id ?? l.id ?? `Lecture ${i + 1}`}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 rounded-lg flex-shrink-0">{l.purchase_count ?? l.count ?? 0} sales</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Recent Transactions</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Last 5 platform transactions</p>
          </div>
        </div>
        {!data.recentTransactions?.length ? (
          <div className="flex items-center justify-center h-20 text-slate-400 dark:text-slate-500 text-xs">No recent transactions</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  {["#", "Amount", "Date"].map((h) => (
                    <th key={h} className="py-2 px-3 text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {data.recentTransactions.slice(0, 5).map((t: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                    </td>
                    <td className="py-2.5 px-3"><span className="text-xs font-bold text-slate-800 dark:text-slate-200">{fmt(t.amount ?? 0)}</span></td>
                    <td className="py-2.5 px-3"><span className="text-xs text-slate-500 dark:text-slate-400">{fmtDate(t.created_at ?? t.date)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { dark, toggle } = useDarkMode();
  const router = useRouter();

  // ── Logout handler ──────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // If you're using Supabase auth:
      // const { createClient } = await import("@/utils/supabase/client");
      // const supabase = createClient();
      // await supabase.auth.signOut();

      // If you have a custom logout API endpoint:
      await fetch("/api/auth/logout", { method: "POST" });

      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      // Fallback: still redirect to login
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const renderSection = () => {
    switch (activeTab) {
      case "dashboard":    return <DashboardSection />;
      case "transactions": return <TransactionsSection />;
      case "withdrawals":  return <WithdrawalsSection />;
      case "teachers":     return <TeachersSection />;
      case "lectures":     return <LecturesSection />;
      case "analytics":    return <AnalyticsSection />;
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans flex transition-colors duration-200">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 shadow-xl z-40 flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        {/* Logo */}
        <div className="px-5 py-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">EduAdmin</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none">Control Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                activeTab === id
                  ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 group-hover:scale-110 ${activeTab === id ? "text-white" : ""}`} />
              {label}
              {activeTab === id && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-700">
          <div className="px-3 py-3 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/30 dark:to-indigo-900/30 border border-violet-100 dark:border-violet-800">
            <p className="text-[11px] font-semibold text-violet-700 dark:text-violet-400">Super Admin</p>
            <p className="text-[10px] text-violet-400 dark:text-violet-500 mt-0.5">Full platform access</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-700 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <div>
                <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">{TAB_TITLES[activeTab]}</h1>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none hidden sm:block">EduAdmin Platform</p>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Dark mode toggle */}
              <button
                onClick={toggle}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                title={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {dark ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-500" />
                )}
              </button>

              <div className="hidden sm:flex items-center gap-1.5 bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 px-3 py-1.5 rounded-xl">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
                <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">Admin</span>
              </div>

              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-200 cursor-pointer hover:opacity-90 transition-opacity">
                <span className="text-xs font-bold text-white">A</span>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-700 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{loggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 py-6">
          <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {renderSection()}
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">EduAdmin · Built with Next.js + Supabase</p>
        </footer>
      </div>
    </div>
  );
}