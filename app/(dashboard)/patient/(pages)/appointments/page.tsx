"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

// ── Types ──────────────────────────────────────────────────────────────────
type Status = "all" | "pending" | "confirmed" | "cancelled";

interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  timeSlot: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt?: { seconds: number };
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Appointment["status"] }) {
  const styles = {
    pending: "bg-amber-50 text-amber-600 border-amber-200",
    confirmed: "bg-[#e1f5ee] text-[#0f6e56] border-[#9FE1CB]",
    cancelled: "bg-red-50 text-red-500 border-red-200",
  };
  const icons = {
    pending: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v5l3 3",
    confirmed: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
    cancelled: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM15 9l-6 6M9 9l6 6",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${styles[status]}`}>
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
        <path d={icons[status]} />
      </svg>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────
function EmptyState({ filter }: { filter: Status }) {
  const messages: Record<Status, { title: string; sub: string }> = {
    all: { title: "No appointments yet", sub: "Head over to Doctors to book your first appointment." },
    pending: { title: "No pending appointments", sub: "Appointments you book will appear here until confirmed." },
    confirmed: { title: "No confirmed appointments", sub: "Confirmed appointments from the admin will show here." },
    cancelled: { title: "No cancelled appointments", sub: "You have no cancelled appointments." },
  };
  const { title, sub } = messages[filter];
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-14 h-14 rounded-full bg-[#e8e4dc] flex items-center justify-center">
        <svg className="w-6 h-6 text-[#bbb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
      <p className="text-sm font-medium text-[#555]">{title}</p>
      <p className="text-xs text-[#999] text-center max-w-xs">{sub}</p>
    </div>
  );
}

// ── Appointment card (mobile) ──────────────────────────────────────────────
function AppointmentCard({ appt, index }: { appt: Appointment; index: number }) {
  const dateStr = new Date(appt.date + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div
      className="bg-white rounded-2xl border border-[#e8e4dc] p-5 flex flex-col gap-3"
      style={{ animation: `fadeSlideUp 0.4s ease ${index * 60}ms both` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-[#1a1a1a] text-sm">{appt.doctorName}</p>
          <p className="text-xs text-[#1d9e75]">{appt.specialty}</p>
        </div>
        <StatusBadge status={appt.status} />
      </div>
      <div className="flex items-center gap-4 text-xs text-[#777]">
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {dateStr}
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          {appt.timeSlot}
        </span>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Status>("all");

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
const q = query(
  collection(db, "appointments"),
  where("patientId", "==", user.uid)
);
        const snap = await getDocs(q);
        setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment)));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const tabs: { key: Status; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const counts: Record<Status, number> = {
    all: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  const filtered =
    activeTab === "all" ? appointments : appointments.filter((a) => a.status === activeTab);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,400&family=DM+Sans:wght@400;500&display=swap');
        body { font-family: 'DM Sans', sans-serif; background: #f8f6f1; }
        .fraunces { font-family: 'Fraunces', serif; }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-[#f8f6f1]">
          <AppSidebar />

          <main className="flex-1 flex flex-col min-w-0">

            {/* Top bar */}
            <header className="sticky top-0 z-10 bg-[#f8f6f1]/80 backdrop-blur-md border-b border-[#e8e4dc] px-6 py-4 flex items-center gap-3">
              <SidebarTrigger className="text-[#555] hover:text-[#0f4f3a] transition-colors" />
              <div>
                <h1 className="fraunces text-xl text-[#0f2d20]">My Appointments</h1>
                <p className="text-xs text-[#999]">Track all your bookings in one place</p>
              </div>
            </header>

            <div className="flex-1 px-6 py-6 max-w-5xl mx-auto w-full space-y-6">

              {/* Stat row */}
              {!loading && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total", value: counts.all, color: "text-[#0f4f3a]" },
                    { label: "Confirmed", value: counts.confirmed, color: "text-[#0f6e56]" },
                    { label: "Pending", value: counts.pending, color: "text-amber-600" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-[#e8e4dc] p-4 text-center">
                      <p className={`fraunces text-3xl ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-[#999] mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 bg-white border border-[#e8e4dc] rounded-xl p-1">
                {tabs.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${activeTab === key
                        ? "bg-[#0f4f3a] text-[#e1f5ee]"
                        : "text-[#777] hover:text-[#0f4f3a]"
                      }`}
                  >
                    {label}
                    {counts[key] > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${activeTab === key
                            ? "bg-white/20 text-[#e1f5ee]"
                            : "bg-[#f0ede8] text-[#777]"
                          }`}
                      >
                        {counts[key]}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-[#e8e4dc] h-24 animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState filter={activeTab} />
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block bg-white rounded-2xl border border-[#e8e4dc] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#e8e4dc] bg-[#f8f6f1]">
                          {["Doctor", "Specialty", "Date", "Time", "Status"].map((h) => (
                            <th key={h} className="text-left text-xs uppercase tracking-widest text-[#999] px-5 py-3.5 font-medium">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0ede8]">
                        {filtered.map((appt, i) => (
                          <tr
                            key={appt.id}
                            className="hover:bg-[#f8f6f1] transition-colors duration-150"
                            style={{ animation: `fadeSlideUp 0.4s ease ${i * 50}ms both` }}
                          >
                            <td className="px-5 py-4 font-medium text-[#1a1a1a]">{appt.doctorName}</td>
                            <td className="px-5 py-4 text-[#777]">{appt.specialty}</td>
                            <td className="px-5 py-4 text-[#777]">
                              {new Date(appt.date + "T00:00:00").toLocaleDateString("en-GB", {
                                day: "numeric", month: "short", year: "numeric",
                              })}
                            </td>
                            <td className="px-5 py-4 text-[#777]">{appt.timeSlot}</td>
                            <td className="px-5 py-4"><StatusBadge status={appt.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {filtered.map((appt, i) => (
                      <AppointmentCard key={appt.id} appt={appt} index={i} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </>
  );
}