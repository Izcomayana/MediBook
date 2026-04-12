"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BookingModal, type Doctor } from "@/components/BookingModal";

// ── Specialty filter pill ──────────────────────────────────────────────────
function FilterPill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${active
          ? "bg-[#0f4f3a] text-[#e1f5ee] border-[#0f4f3a]"
          : "bg-white text-[#555] border-[#e0e0e0] hover:border-[#1d9e75] hover:text-[#0f4f3a]"
        }`}
    >
      {label}
    </button>
  );
}

// ── Doctor card ────────────────────────────────────────────────────────────
function DoctorCard({
  doctor, onBook, index,
}: { doctor: Doctor; onBook: (d: Doctor) => void; index: number }) {
  return (
    <div
      className="bg-white rounded-2xl border border-[#e8e4dc] p-5 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
      style={{ animation: `fadeSlideUp 0.5s ease ${index * 70}ms both` }}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#e1f5ee] flex items-center justify-center text-sm font-medium text-[#0f6e56] shrink-0">
          {doctor.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#1a1a1a] text-sm">{doctor.name}</p>
          <p className="text-xs text-[#1d9e75] mt-0.5">{doctor.specialty}</p>
        </div>
        <span className="flex items-center gap-1 text-xs text-[#0f6e56] bg-[#e1f5ee] px-2 py-1 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1d9e75]" />
          Available
        </span>
      </div>

      <p className="text-xs text-[#777] leading-relaxed">{doctor.bio}</p>

      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#bbb] mb-2">Available days</p>
        <div className="flex flex-wrap gap-1.5">
          {doctor.availableDays.map((day) => (
            <span
              key={day}
              className="text-xs bg-[#f8f6f1] border border-[#e8e4dc] text-[#555] px-2 py-0.5 rounded-full"
            >
              {day.slice(0, 3)}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#bbb] mb-2">Time slots</p>
        <div className="flex flex-wrap gap-1.5">
          {doctor.timeSlots.map((slot) => (
            <span
              key={slot}
              className="text-xs bg-[#f8f6f1] border border-[#e8e4dc] text-[#555] px-2 py-0.5 rounded-full"
            >
              {slot}
            </span>
          ))}
        </div>
      </div>

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
export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, "doctors"), where("available", "==", true));
        const snap = await getDocs(q);
        setDoctors(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Doctor)));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const specialties = ["All", ...Array.from(new Set(doctors.map((d) => d.specialty)))];

  const filtered = doctors.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = activeFilter === "All" || d.specialty === activeFilter;
    return matchSearch && matchFilter;
  });

  const handleSuccess = () => {
    setSelectedDoctor(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  };

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
          from { opacity: 0; transform: translateY(-10px); }
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
                <h1 className="fraunces text-xl text-[#0f2d20]">Our Doctors</h1>
                <p className="text-xs text-[#999]">Browse available doctors and book an appointment</p>
              </div>
            </header>

            <div className="flex-1 px-6 py-6 space-y-6 max-w-6xl mx-auto w-full">

              {/* Success toast */}
              {showSuccess && (
                <div
                  className="bg-[#e1f5ee] border border-[#9FE1CB] text-[#0f6e56] text-sm px-5 py-3 rounded-xl flex items-center gap-3"
                  style={{ animation: "slideDown 0.3s ease both" }}
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
                  </svg>
                  Appointment booked! Pending admin confirmation.
                </div>
              )}

              {/* Search + filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name or specialty…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-[#e0e0e0] rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder-[#bbb] text-[#1a1a1a] outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/10 transition-all duration-200"
                  />
                </div>

                {/* Specialty pills */}
                <div className="flex flex-wrap gap-2">
                  {specialties.map((s) => (
                    <FilterPill
                      key={s}
                      label={s}
                      active={activeFilter === s}
                      onClick={() => setActiveFilter(s)}
                    />
                  ))}
                </div>
              </div>

              {/* Count */}
              {!loading && (
                <p className="text-xs text-[#999]">
                  {filtered.length} doctor{filtered.length !== 1 ? "s" : ""} available
                </p>
              )}

              {/* Grid */}
              {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-[#e8e4dc] h-72 animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-[#999] text-sm">No doctors found.</p>
                  <p className="text-[#bbb] text-xs mt-1">Try adjusting your search or filter.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((doctor, i) => (
                    <DoctorCard key={doctor.id} doctor={doctor} onBook={setSelectedDoctor} index={i} />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </SidebarProvider>

      {selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}