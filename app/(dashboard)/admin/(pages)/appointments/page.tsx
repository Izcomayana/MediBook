"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, updateDoc, doc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";

type Status = "all" | "pending" | "confirmed" | "cancelled";

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  specialty: string;
  date: string;
  timeSlot: string;
  status: "pending" | "confirmed" | "cancelled";
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const styles = {
    pending:   "bg-amber-900/30 text-amber-400 border-amber-700/50",
    confirmed: "bg-[#1d9e75]/20 text-[#5dcaa5] border-[#1d9e75]/30",
    cancelled: "bg-red-900/20 text-red-400 border-red-800/30",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function AppointmentCard({ appt, onUpdate, updating }: {
  appt: Appointment;
  onUpdate: (id: string, s: "confirmed" | "cancelled") => void;
  updating: string | null;
}) {
  return (
    <div className="bg-[#0f3d28] rounded-2xl border border-[#1d3a28] p-5 space-y-3" style={{ animation: "fadeSlideUp 0.4s ease both" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-[#e1f5ee] text-sm">{appt.patientName}</p>
          <p className="text-xs text-[#5dcaa5]">{appt.patientEmail}</p>
        </div>
        <StatusBadge status={appt.status} />
      </div>
      <div className="text-xs text-[#7abfa0] space-y-1">
        <p>{appt.doctorName} · {appt.specialty}</p>
        <p>{new Date(appt.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {appt.timeSlot}</p>
      </div>
      {appt.status === "pending" && (
        <div className="flex gap-2 pt-1">
          <button disabled={updating === appt.id} onClick={() => onUpdate(appt.id, "confirmed")}
            className="flex-1 text-xs py-2 rounded-lg bg-[#1d9e75]/20 text-[#5dcaa5] border border-[#1d9e75]/30 hover:bg-[#1d9e75]/40 disabled:opacity-40 transition-all duration-200">
            {updating === appt.id ? "…" : "Confirm"}
          </button>
          <button disabled={updating === appt.id} onClick={() => onUpdate(appt.id, "cancelled")}
            className="flex-1 text-xs py-2 rounded-lg bg-red-900/20 text-red-400 border border-red-800/30 hover:bg-red-900/40 disabled:opacity-40 transition-all duration-200">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<Status>("all");
  const [search, setSearch]             = useState("");
  const [updating, setUpdating]         = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      const q = query(collection(db, "appointments"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const updateStatus = async (id: string, status: "confirmed" | "cancelled") => {
    setUpdating(id);
    try {
      // 1. Update Firestore
      await updateDoc(doc(db, "appointments", id), { status });

      const appt = appointments.find((a) => a.id === id);

      // 2. Send confirmation email if confirming
      if (status === "confirmed" && appt) {
        const formattedDate = new Date(appt.date + "T00:00:00").toLocaleDateString("en-GB", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        });

        const res = await fetch("/api/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientName:  appt.patientName,
            patientEmail: appt.patientEmail,
            doctorName:   appt.doctorName,
            specialty:    appt.specialty,
            date:         formattedDate,
            time:         appt.timeSlot,
          }),
        });

        if (!res.ok) {
          // Roll back Firestore to pending
          await updateDoc(doc(db, "appointments", id), { status: "pending" });
          toast.error("Failed to send confirmation email. Appointment reset to pending.");
          return;
        }

        toast.success(`Confirmed! Email sent to ${appt.patientEmail}`);
      } else {
        toast.success("Appointment cancelled.");
      }

      // 3. Update local state only on success
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch (err) {
      console.error("updateStatus error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  const tabs: { key: Status; label: string }[] = [
    { key: "all",       label: "All" },
    { key: "pending",   label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const counts: Record<Status, number> = {
    all:       appointments.length,
    pending:   appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  const filtered = appointments
    .filter((a) => activeTab === "all" || a.status === activeTab)
    .filter((a) =>
      a.patientName.toLowerCase().includes(search.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(search.toLowerCase()) ||
      a.specialty.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,400&family=DM+Sans:wght@400;500&display=swap');
        body { font-family: 'DM Sans', sans-serif; background: #0a1f15; }
        .fraunces { font-family: 'Fraunces', serif; }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-[#0a1f15]">
          <AdminSidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <header className="sticky top-0 z-10 bg-[#0a1f15]/80 backdrop-blur-md border-b border-[#1d3a28] px-6 py-4 flex items-center gap-3">
              <SidebarTrigger className="text-[#5dcaa5] hover:text-[#e1f5ee] transition-colors" />
              <div>
                <h1 className="fraunces text-xl text-[#e1f5ee]">All Appointments</h1>
                <p className="text-xs text-[#5dcaa5]">Manage and update appointment statuses</p>
              </div>
            </header>

            <div className="flex-1 px-6 py-6 space-y-5 max-w-6xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative max-w-xs w-full">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3d6b54]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input type="text" placeholder="Search patient or doctor…" value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#0f3d28] border border-[#1d3a28] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#e1f5ee] placeholder-[#3d6b54] outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/10 transition-all duration-200" />
                </div>
                <div className="flex gap-1 bg-[#0f3d28] border border-[#1d3a28] rounded-xl p-1 flex-1">
                  {tabs.map(({ key, label }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${activeTab === key ? "bg-[#1d9e75] text-white" : "text-[#5dcaa5] hover:text-[#e1f5ee]"}`}>
                      {label}
                      {counts[key] > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === key ? "bg-white/20" : "bg-[#1d3a28] text-[#5dcaa5]"}`}>
                          {counts[key]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {!loading && <p className="text-xs text-[#3d6b54]">{filtered.length} appointment{filtered.length !== 1 ? "s" : ""}</p>}

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="bg-[#0f3d28] rounded-2xl border border-[#1d3a28] h-16 animate-pulse" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-[#0f3d28] rounded-2xl border border-[#1d3a28] py-20 text-center">
                  <p className="text-[#5dcaa5] text-sm">No appointments found.</p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block bg-[#0f3d28] rounded-2xl border border-[#1d3a28] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#1d3a28]">
                          {["Patient", "Doctor", "Date & Time", "Status",].map((h) => (
                            <th key={h} className="text-left text-xs uppercase tracking-widest text-[#5dcaa5] px-5 py-3.5 font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1d3a28]">
                        {filtered.map((appt, i) => (
                          <tr key={appt.id} className="hover:bg-[#0f4f3a]/30 transition-colors duration-150" style={{ animation: `fadeSlideUp 0.4s ease ${i * 40}ms both` }}>
                            <td className="px-5 py-4">
                              <p className="font-medium text-[#e1f5ee]">{appt.patientName}</p>
                              <p className="text-xs text-[#5dcaa5]">{appt.patientEmail}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-[#e1f5ee]">{appt.doctorName}</p>
                              <p className="text-xs text-[#5dcaa5]">{appt.specialty}</p>
                            </td>
                            <td className="px-5 py-4 text-[#7abfa0]">
                              <p>{new Date(appt.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                              <p className="text-xs">{appt.timeSlot}</p>
                            </td>
                            <td className="px-5 py-4"><StatusBadge status={appt.status} /></td>
                            {/* <td className="px-5 py-4">
                              {appt.status === "pending" ? (
                                <div className="flex gap-2">
                                  <button disabled={updating === appt.id} onClick={() => updateStatus(appt.id, "confirmed")}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-[#1d9e75]/20 text-[#5dcaa5] border border-[#1d9e75]/30 hover:bg-[#1d9e75]/40 disabled:opacity-40 transition-all duration-200 flex items-center gap-1">
                                    {updating === appt.id ? (
                                      <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                      </svg>
                                    ) : "✓"} Confirm
                                  </button>
                                  <button disabled={updating === appt.id} onClick={() => updateStatus(appt.id, "cancelled")}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-red-900/20 text-red-400 border border-red-800/30 hover:bg-red-900/40 disabled:opacity-40 transition-all duration-200">
                                    Cancel
                                  </button>
                                </div>
                              ) : <span className="text-xs text-[#3d6b54]">No action</span>}
                            </td> */}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="md:hidden space-y-3">
                    {filtered.map((appt) => (
                      <AppointmentCard key={appt.id} appt={appt} onUpdate={updateStatus} updating={updating} />
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