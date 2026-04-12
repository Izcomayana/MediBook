"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BookingModal, type Doctor } from "@/components/BookingModal";

// ── Types ──────────────────────────────────────────────────────────────────
interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  timeSlot: string;
  status: "pending" | "confirmed" | "cancelled";
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Appointment["status"] }) {
  const styles = {
    pending: "bg-amber-50 text-amber-600 border-amber-200",
    confirmed: "bg-[#e1f5ee] text-[#0f6e56] border-[#9FE1CB]",
    cancelled: "bg-red-50 text-red-500 border-red-200",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Doctor card ────────────────────────────────────────────────────────────
function DoctorCard({ doctor, onBook, index }: { doctor: Doctor; onBook: (d: Doctor) => void; index: number }) {
  return (
    <div
      className="bg-white rounded-2xl border border-[#e8e4dc] p-5 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
      style={{ animation: `fadeSlideUp 0.5s ease ${index * 80}ms both` }}
    >
      {/* Top */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#e1f5ee] flex items-center justify-center text-sm font-medium text-[#0f6e56] shrink-0">
          {doctor.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#1a1a1a] text-sm leading-tight">{doctor.name}</p>
          <p className="text-xs text-[#1d9e75] mt-0.5">{doctor.specialty}</p>
        </div>
        <span className="flex items-center gap-1 text-xs text-[#0f6e56] bg-[#e1f5ee] px-2 py-1 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1d9e75]" />
          Available
        </span>
      </div>

      {/* Bio */}
      <p className="text-xs text-[#777] leading-relaxed">{doctor.bio}</p>

      {/* Days */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#bbb] mb-2">Available days</p>
        <div className="flex flex-wrap gap-1.5">
          {doctor.availableDays.map((day) => (
            <span key={day} className="text-xs bg-[#f8f6f1] border border-[#e8e4dc] text-[#555] px-2 py-0.5 rounded-full">
              {day.slice(0, 3)}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => onBook(doctor)}
        className="w-full py-2.5 rounded-xl bg-[#0f4f3a] text-[#e1f5ee] text-sm font-medium hover:bg-[#0a3829] active:scale-[0.98] transition-all duration-200 mt-auto"
      >
        Book appointment
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function PatientDashboard() {
  const { user } = useAuth();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch available doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const q = query(collection(db, "doctors"), where("available", "==", true));
        const snap = await getDocs(q);
        setDoctors(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Doctor)));
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  // Fetch patient's appointments
  const fetchAppointments = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "appointments"),
        where("patientId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment)));
    } finally {
      setLoadingAppts(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, [user]);

  const handleBookingSuccess = () => {
    setSelectedDoctor(null);
    setShowSuccess(true);
    fetchAppointments();
    setTimeout(() => setShowSuccess(false), 4000);
  };

  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const firstName = user?.displayName?.split(" ")[0] ?? "there";
  const upcomingCount = appointments.filter((a) => a.status !== "cancelled").length;
  const pendingCount = appointments.filter((a) => a.status === "pending").length;

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
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-[#f8f6f1]">
          <AppSidebar />

          <main className="flex-1 flex flex-col min-w-0">

            {/* ── Top bar ── */}
            <header className="sticky top-0 z-10 bg-[#f8f6f1]/80 backdrop-blur-md border-b border-[#e8e4dc] px-6 py-4 md:flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-[#555] hover:text-[#0f4f3a] transition-colors" />
                <div>
                  <h1 className="fraunces text-xl text-[#0f2d20]">Good day, {firstName} 👋</h1>
                  <p className="text-xs text-[#999]">Manage your health appointments</p>
                </div>
              </div>
              <div className="text-xs text-[#999] ">
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
            </header>

            <div className="flex-1 px-6 py-6 space-y-8 max-w-6xl mx-auto w-full">

              {/* ── Success toast ── */}
              {showSuccess && (
                <div
                  className="bg-[#e1f5ee] border border-[#9FE1CB] text-[#0f6e56] text-sm px-5 py-3 rounded-xl flex items-center gap-3"
                  style={{ animation: "slideDown 0.3s ease both" }}
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
                  </svg>
                  Appointment booked successfully! It&apos;s pending admin confirmation.
                </div>
              )}

              {/* ── Stat cards ── */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Available doctors", value: loadingDoctors ? "—" : doctors.length, color: "text-[#0f4f3a]" },
                  { label: "Your appointments", value: loadingAppts ? "—" : upcomingCount, color: "text-[#0f4f3a]" },
                  { label: "Pending approval", value: loadingAppts ? "—" : pendingCount, color: "text-amber-600" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-2xl border border-[#e8e4dc] p-5">
                    <p className="text-xs text-[#999] mb-2">{stat.label}</p>
                    <p className={`fraunces text-3xl ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* ── Doctors section ── */}
              <section>
                <div className="lg:flex items-center justify-between mb-4 gap-4">
                  <h2 className="fraunces text-2xl text-[#0f2d20]">Available doctors</h2>
                  {/* Search */}
                  <div className="relative max-w-xs w-full">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search by name or specialty…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-[#e0e0e0] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#1a1a1a] placeholder-[#bbb] outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/10 transition-all duration-200"
                    />
                  </div>
                </div>

                {loadingDoctors ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white rounded-2xl border border-[#e8e4dc] p-5 h-56 animate-pulse" />
                    ))}
                  </div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="text-center py-16 text-[#999] text-sm">
                    {searchQuery ? `No doctors found for "${searchQuery}"` : "No doctors available right now."}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDoctors.map((doctor, i) => (
                      <DoctorCard key={doctor.id} doctor={doctor} onBook={setSelectedDoctor} index={i} />
                    ))}
                  </div>
                )}
              </section>

              {/* ── Recent appointments ── */}
              <section>
                <h2 className="fraunces text-2xl text-[#0f2d20] mb-4">Your appointments</h2>

                {loadingAppts ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white rounded-xl border border-[#e8e4dc] h-16 animate-pulse" />
                    ))}
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#e8e4dc] py-12 text-center">
                    <p className="text-[#999] text-sm">No appointments yet.</p>
                    <p className="text-[#bbb] text-xs mt-1">Book one from the doctors above.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-[#e8e4dc] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#e8e4dc] bg-[#f8f6f1]">
                          {["Doctor", "Specialty", "Date", "Time", "Status"].map((h) => (
                            <th key={h} className="text-left text-xs uppercase tracking-widest text-[#999] px-5 py-3 font-medium">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0ede8]">
                        {appointments.map((appt, i) => (
                          <tr
                            key={appt.id}
                            className="hover:bg-[#f8f6f1] transition-colors duration-150"
                            style={{ animation: `fadeSlideUp 0.4s ease ${i * 60}ms both` }}
                          >
                            <td className="px-5 py-3.5 font-medium text-[#1a1a1a]">{appt.doctorName}</td>
                            <td className="px-5 py-3.5 text-[#777]">{appt.specialty}</td>
                            <td className="px-5 py-3.5 text-[#777]">
                              {new Date(appt.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </td>
                            <td className="px-5 py-3.5 text-[#777]">{appt.timeSlot}</td>
                            <td className="px-5 py-3.5"><StatusBadge status={appt.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

            </div>
          </main>
        </div>
      </SidebarProvider>

      {/* ── Booking modal ── */}
      {selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </>
  );
}