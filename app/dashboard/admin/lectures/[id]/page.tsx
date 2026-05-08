"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  studentEmail: string;
  amount: number;
  teacherEarning: number;
  platformFee: number;
  date: string;
}

interface LectureData {
  id: string;
  title: string;
  description: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  price: number;
  rentPrice: number;
  createdAt: string;
  isHidden: boolean;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  totalStudents: number;
  totalRevenue: number;
  totalTransactions: number;
  recentTransactions: Transaction[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN")}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />;
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Sk className="h-5 w-32" />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-1.5 w-full bg-slate-100" />
        <div className="p-6 flex flex-col sm:flex-row gap-5">
          <Sk className="w-28 h-20 sm:w-36 sm:h-24 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2.5">
            <Sk className="h-6 w-3/4" />
            <Sk className="h-3.5 w-1/2" />
            <Sk className="h-3 w-64" />
            <div className="flex gap-2 pt-1">
              <Sk className="h-6 w-20 rounded-full" />
              <Sk className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Sk key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Sk className="h-48 rounded-2xl" />
        <Sk className="h-48 rounded-2xl" />
      </div>
      <Sk className="h-64 rounded-2xl" />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  gradient,
  icon,
  sub,
}: {
  label: string;
  value: string | number;
  gradient: string;
  icon: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-3.5 hover:shadow-md transition-shadow duration-200">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${gradient} shadow-md`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400 leading-none truncate">{label}</p>
        <p className="text-xl font-bold text-slate-800 mt-1.5 leading-none tracking-tight">{value}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LectureDetails() {
  const router = useRouter();
  const params = useParams();
  const lectureId = params.id as string;

  const [data, setData] = useState<LectureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchLecture = async () => {
    if (!lectureId) return;
    setLoading(true);
    setPageError(null);
    try {
      const res = await fetch(`/api/admin/lectures/${lectureId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load lecture");
      setData(json);
    } catch (err: any) {
      setPageError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lectureId) fetchLecture();
  }, [lectureId]);

  // ── Action ─────────────────────────────────────────────────────────────────
  // FIX: Use PATCH for hide/unhide and DELETE for delete

  const handleAction = async (action: "hide" | "unhide" | "delete") => {
    setActionLoading(action);
    setActionError(null);
    setActionSuccess(null);

    try {
      let res: Response;

      if (action === "delete") {
        // FIX: use DELETE method
        res = await fetch(`/api/admin/lectures/${lectureId}`, {
          method: "DELETE",
        });
      } else {
        // FIX: use PATCH for hide/unhide
        res = await fetch(`/api/admin/lectures/${lectureId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");

      if (action === "delete") {
        router.push("/admin");
        return;
      }

      setActionSuccess(
        action === "hide" ? "Lecture hidden successfully" : "Lecture is now visible"
      );
      await fetchLecture();
      setTimeout(() => setActionSuccess(null), 3500);
      setDeleteModal(false);
    } catch (err: any) {
      setActionError(err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Error page ─────────────────────────────────────────────────────────────

  if (!loading && pageError && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-700 mb-1">Failed to load lecture</p>
          <p className="text-xs text-slate-400 mb-5">{pageError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/admin")}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={fetchLecture}
              className="px-5 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isHidden = data?.isHidden ?? false;
  const isHideLoading = actionLoading === "hide" || actionLoading === "unhide";
  const isDeleteLoading = actionLoading === "delete";

  return (
    <>
      {/* ── Delete Modal ── */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setDeleteModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center mb-1">Delete Lecture</h3>
            <p className="text-sm text-slate-500 text-center mb-1">You are about to permanently delete</p>
            <p className="text-sm font-semibold text-slate-800 text-center mb-4 px-4 line-clamp-2">
              "{data?.title}"
            </p>
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-5">
              <p className="text-xs text-rose-700 font-medium text-center">
                ⚠️ This is permanent. All associated data will be lost and cannot be recovered.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isDeleteLoading}
                onClick={() => handleAction("delete")}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-rose-200"
              >
                {isDeleteLoading ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete Permanently"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page ── */}
      <div className="min-h-screen bg-slate-50 p-5 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Back */}
          <button
            onClick={() => router.push("/dashboard/admin")}
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors font-medium group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back to Admin Panel
          </button>

          {loading ? (
            <PageSkeleton />
          ) : data ? (
            <>
              {/* ── Hero Card ── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div
                  className={`h-1.5 w-full bg-gradient-to-r ${
                    isHidden
                      ? "from-rose-400 via-rose-500 to-rose-400"
                      : "from-amber-400 via-orange-400 to-amber-500"
                  }`}
                />
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row gap-5">
                    {/* FIX: Thumbnail now uses the IPFS URL returned by the API */}
                    <div className="w-full sm:w-40 h-28 rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
                      {data.thumbnailUrl ? (
                        <img
                          src={data.thumbnailUrl}
                          alt={data.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // FIX: hide broken image and show fallback icon
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <svg class="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                </svg>`;
                            }
                          }}
                        />
                      ) : (
                        <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                        </svg>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start gap-2 mb-2">
                        <h1 className="text-lg font-bold text-slate-800 leading-snug flex-1">
                          {data.title}
                        </h1>
                      </div>

                      {/* Teacher */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-black text-white uppercase">
                            {String(data.teacherName)?.[0] ?? "T"}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-700">{data.teacherName}</span>
                          {data.teacherEmail && (
                            <span className="text-xs text-slate-400 ml-1.5">{data.teacherEmail}</span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {data.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                          {data.description}
                        </p>
                      )}

                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            isHidden
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isHidden ? "bg-rose-500" : "bg-emerald-500 animate-pulse"
                            }`}
                          />
                          {isHidden ? "Hidden" : "Visible"}
                        </span>

                        {/* Price */}
                        {data.price > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 border border-slate-200 text-slate-700">
                            Buy {fmt(data.price)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                            Free
                          </span>
                        )}

                        {/* Date */}
                        <span className="text-[11px] text-slate-400 font-medium">
                          Published {fmtDate(data.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Stat Cards ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Total Revenue"
                  value={fmt(data.totalRevenue)}
                  gradient="from-emerald-500 to-teal-600"
                  icon={
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  }
                />
                <StatCard
                  label="Total Students"
                  value={data.totalStudents}
                  gradient="from-blue-500 to-cyan-500"
                  icon={
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                  }
                />
                <StatCard
                  label="Total Transactions"
                  value={data.totalTransactions}
                  gradient="from-violet-500 to-indigo-600"
                  icon={
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                  }
                />
                <StatCard
                  label="Lecture Price"
                  value={data.price > 0 ? fmt(data.price) : "Free"}
                  gradient="from-amber-500 to-orange-500"
                  icon={
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                  }
                />
              </div>

              {/* ── Bottom row: Admin Controls + Teacher Info ── */}
              <div className="grid md:grid-cols-2 gap-6">

                {/* Admin Controls */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-bold text-slate-800">Admin Controls</h2>
                  </div>

                  <div
                    className={`rounded-xl px-4 py-3 mb-5 border ${
                      isHidden ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className={`text-xs font-bold ${isHidden ? "text-rose-700" : "text-emerald-700"}`}>
                          Lecture is currently {isHidden ? "hidden" : "visible"}
                        </p>
                        <p className={`text-[11px] mt-0.5 leading-relaxed ${isHidden ? "text-rose-500" : "text-emerald-600"}`}>
                          {isHidden
                            ? "Students cannot see or purchase this lecture"
                            : "Lecture is live and students can enroll"}
                        </p>
                      </div>
                      <span
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          isHidden ? "bg-rose-400" : "bg-emerald-400 animate-pulse"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      disabled={isHideLoading}
                      onClick={() => handleAction(isHidden ? "unhide" : "hide")}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-sm font-bold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed border ${
                        isHidden
                          ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                      }`}
                    >
                      {isHideLoading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Processing...
                        </>
                      ) : isHidden ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                          Make Lecture Visible
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                          Hide Lecture
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setDeleteModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-md shadow-rose-200"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                      Delete Lecture Permanently
                    </button>
                  </div>

                  {actionSuccess && (
                    <div className="mt-3 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <svg className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <p className="text-xs font-semibold text-emerald-700">{actionSuccess}</p>
                    </div>
                  )}
                  {actionError && (
                    <div className="mt-3 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200">
                      <svg className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                      </svg>
                      <p className="text-xs font-semibold text-rose-700">{actionError}</p>
                    </div>
                  )}
                </div>

                {/* Teacher Info */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-bold text-slate-800">Teacher Info</h2>
                  </div>

                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200 flex-shrink-0">
                      <span className="text-lg font-black text-white uppercase">
                        {String(data.teacherName)?.[0] ?? "T"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{data.teacherName}</p>
                      {data.teacherEmail && (
                        <p className="text-xs text-slate-400 mt-0.5">{data.teacherEmail}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { label: "Teacher ID", value: data.teacherId.slice(0, 16) + "..." },
                      { label: "Lecture Published", value: fmtDate(data.createdAt) },
                      {
                        label: "Total Earned from Lecture",
                        value: fmt(
                          data.recentTransactions.reduce((s, t) => s + t.teacherEarning, 0)
                        ),
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <span className="text-xs text-slate-400 font-medium">{row.label}</span>
                        <span className="text-xs font-semibold text-slate-700">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <a
                    href={`/dashboard/admin/teachers/${data.teacherId}`}
                    className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
                  >
                    View Teacher Profile
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* ── Recent Transactions Table ── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-bold text-slate-800">Recent Transactions</h2>
                  </div>
                  <span className="text-xs text-slate-400 font-medium bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                    Last {data.recentTransactions.length} of {data.totalTransactions}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60">
                        {["Student", "Amount", "Teacher Earning", "Platform Fee", "Date"].map((h) => (
                          <th
                            key={h}
                            className="py-3 px-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.recentTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5}>
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                </svg>
                              </div>
                              <p className="text-sm font-semibold text-slate-600">No transactions yet</p>
                              <p className="text-xs text-slate-400 mt-1">
                                Transactions will appear here when students purchase this lecture
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        data.recentTransactions.map((txn, i) => (
                          <tr key={i} className="hover:bg-violet-50/30 transition-colors duration-100">
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                  <span className="text-[9px] font-black text-white uppercase">
                                    {String(txn.studentEmail)?.[0] ?? "S"}
                                  </span>
                                </div>
                                <span className="text-xs font-medium text-slate-700">{txn.studentEmail}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              <span className="text-sm font-bold text-slate-800">{fmt(txn.amount)}</span>
                            </td>
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100">
                                <span className="text-xs font-bold text-emerald-700">{fmt(txn.teacherEarning)}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-100">
                                <span className="text-xs font-bold text-violet-700">{fmt(txn.platformFee)}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-slate-600">
                                  {fmtDate(txn.date)}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5">
                                  {new Date(txn.date).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {data.recentTransactions.length > 0 && (
                  <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      Showing last{" "}
                      <span className="font-semibold text-slate-600">{data.recentTransactions.length}</span>{" "}
                      transactions
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      <span className="text-xs text-slate-400">
                        Total revenue:{" "}
                        <span className="font-semibold text-slate-600">{fmt(data.totalRevenue)}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}