"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeacherData {
  id: string;
  name: string;
  email: string;
  status: string;
  joined: string;
  profilePicture: string | null; // FIX: added
  totalEarnings: number;
  totalLectures: number;
  totalStudents: number;
  totalWithdrawn: number;
  walletBalance: number;
}

// ─── Icon helpers (inline SVG — no extra deps) ────────────────────────────────

const icons = {
  back: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  ),
  rupee: (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  wallet: (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
    </svg>
  ),
  book: (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  ),
  shield: (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  ),
  ban: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  spinner: (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  ),
  alert: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  ),
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />;
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-36" />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-2xl flex-shrink-0" />
          <div className="space-y-2.5 flex-1">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3.5 w-56" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Stat Mini Card ───────────────────────────────────────────────────────────

function MiniStatCard({
  label,
  value,
  icon,
  gradient,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow duration-200 flex items-center gap-3.5">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${gradient} shadow-md`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400 leading-none truncate">{label}</p>
        <p className="text-xl font-bold text-slate-800 mt-1 leading-none tracking-tight">{value}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <span className={`text-sm font-semibold text-right ${valueClass || "text-slate-700"}`}>{value}</span>
    </div>
  );
}

// ─── Teacher Avatar ───────────────────────────────────────────────────────────
// FIX: shows real profile picture with graceful fallback to initial letter

function TeacherAvatar({ name, pictureUrl, size = "lg" }: { name: string; pictureUrl: string | null; size?: "sm" | "lg" }) {
  const [imgError, setImgError] = useState(false);
  const initial = String(name)?.[0]?.toUpperCase() ?? "T";

  const sizeClasses = size === "lg"
    ? "w-16 h-16 rounded-2xl text-2xl shadow-lg shadow-emerald-200"
    : "w-10 h-10 rounded-xl text-base";

  if (pictureUrl && !imgError) {
    return (
      <img
        src={pictureUrl}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sizeClasses} object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div className={`${sizeClasses} bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-black text-white flex-shrink-0`}>
      {initial}
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function TeacherDetails({ params }: { params: { id: string } }) {
  const id = params.id;

  const [data, setData] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState(false);

  const fetchTeacher = async () => {
    setLoading(true);
    setPageError(null);
    try {
      const res = await fetch(`/api/admin/teachers/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load teacher");
      setData(json);
    } catch (err: any) {
      setPageError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacher();
  }, [id]);

  const handleAction = async (action: "suspend" | "activate") => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(false);
    try {
      const res = await fetch(`/api/admin/teachers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");
      setActionSuccess(true);
      await fetchTeacher();
      setTimeout(() => setActionSuccess(false), 3500);
    } catch (err: any) {
      setActionError(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const isActive = data?.status === "active";
  const fmt = (n: number) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;

  // ── Full-page error ───────────────────────────────────────────────────────
  if (!loading && pageError && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-700 mb-1">Failed to load teacher</p>
          <p className="text-xs text-slate-400 mb-5">{pageError}</p>
          <button
            onClick={fetchTeacher}
            className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-5 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Back link */}
        <a
          href="/dashboard/admin/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors font-medium group"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">{icons.back}</span>
          Back to Admin Panel
        </a>

        {loading ? (
          <PageSkeleton />
        ) : data ? (
          <>
            {/* ── Hero profile card ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500" />
              <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <div className="flex items-center gap-4">
                  {/* FIX: real profile picture with fallback */}
                  <TeacherAvatar name={data.name} pictureUrl={data.profilePicture} size="lg" />
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-lg font-bold text-slate-800 leading-none">{data.name}</h1>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                          }`}
                        />
                        {isActive ? "Active" : "Suspended"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 leading-none">{data.email}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Joined{" "}
                      {new Date(data.joined).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {/* Role pill */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200 text-xs font-semibold text-violet-700 self-start sm:self-auto">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                  </svg>
                  Teacher
                </span>
              </div>
            </div>

            {/* ── Mini stat chips ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MiniStatCard label="Total Earnings" value={fmt(data.totalEarnings)} gradient="from-emerald-500 to-teal-600" icon={icons.rupee} />
              <MiniStatCard label="Wallet Balance" value={fmt(data.walletBalance)} gradient="from-violet-500 to-indigo-600" icon={icons.wallet} sub={`${fmt(data.totalWithdrawn)} withdrawn`} />
              <MiniStatCard label="Total Lectures" value={data.totalLectures} gradient="from-amber-500 to-orange-500" icon={icons.book} />
              <MiniStatCard label="Total Students" value={data.totalStudents} gradient="from-blue-500 to-cyan-500" icon={icons.users} />
            </div>

            {/* ── Detail cards grid ── */}
            <div className="grid md:grid-cols-2 gap-6">

              {/* Card 1 — Basic Info */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">Basic Info</h2>
                </div>
                <InfoRow label="Full Name" value={data.name} />
                <InfoRow label="Email Address" value={data.email} />
                <InfoRow label="Account Status" value={isActive ? "Active" : "Suspended"} valueClass={isActive ? "text-emerald-600" : "text-rose-600"} />
                <InfoRow
                  label="Member Since"
                  value={new Date(data.joined).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                />
              </div>

              {/* Card 2 — Earnings */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">Earnings</h2>
                </div>
                <div className="space-y-2.5 mb-4">
                  {[
                    { label: "Gross Earnings", value: fmt(data.totalEarnings), cls: "text-slate-800", bg: "bg-slate-50 border-slate-200" },
                    { label: "Total Withdrawn", value: fmt(data.totalWithdrawn), cls: "text-rose-700", bg: "bg-rose-50 border-rose-100" },
                    { label: "Wallet Balance", value: fmt(data.walletBalance), cls: "text-violet-700 font-bold", bg: "bg-violet-50 border-violet-100" },
                  ].map((row) => (
                    <div key={row.label} className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${row.bg}`}>
                      <span className="text-xs text-slate-500 font-medium">{row.label}</span>
                      <span className={`text-sm ${row.cls}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
                {data.totalEarnings > 0 && (
                  <>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Available balance</span>
                      <span>{Math.round((data.walletBalance / data.totalEarnings) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, Math.max(0, (data.walletBalance / data.totalEarnings) * 100))}%` }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Card 3 — Stats */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">Platform Stats</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Lectures Published", value: data.totalLectures, gradient: "from-amber-400 to-orange-500" },
                    { label: "Unique Students", value: data.totalStudents, gradient: "from-blue-400 to-cyan-500" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-center">
                      <p className={`text-3xl font-black bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`}>
                        {stat.value}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 font-medium">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4 — Admin Control */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                    {icons.shield}
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">Admin Control</h2>
                </div>
                <div className={`rounded-xl px-4 py-3 mb-4 border ${isActive ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-xs font-bold ${isActive ? "text-emerald-700" : "text-rose-700"}`}>
                        Account is {isActive ? "active" : "suspended"}
                      </p>
                      <p className={`text-[11px] mt-0.5 leading-relaxed ${isActive ? "text-emerald-600" : "text-rose-500"}`}>
                        {isActive
                          ? "Teacher can access platform and receive payments"
                          : "Teacher access and payouts are currently blocked"}
                      </p>
                    </div>
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${isActive ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                  </div>
                </div>
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction(isActive ? "suspend" : "activate")}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${
                    isActive
                      ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200"
                  }`}
                >
                  {actionLoading ? <>{icons.spinner} Processing...</> : isActive ? <>{icons.ban} Suspend Teacher</> : <>{icons.check} Activate Teacher</>}
                </button>
                {actionSuccess && (
                  <div className="mt-3 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <svg className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <p className="text-xs font-semibold text-emerald-700">Status updated successfully</p>
                  </div>
                )}
                {actionError && (
                  <div className="mt-3 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-rose-500 flex-shrink-0">{icons.alert}</span>
                    <p className="text-xs font-semibold text-rose-700">{actionError}</p>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 text-center mt-4 leading-relaxed">
                  This action is immediate. The teacher will {isActive ? "lose" : "regain"} platform access upon confirmation.
                </p>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}