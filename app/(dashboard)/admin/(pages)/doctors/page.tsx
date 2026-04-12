"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  avatar: string;
  available: boolean;
  availableDays: string[];
  timeSlots: string[];
}

function DoctorCard({
  doctor, onToggle, toggling,
}: { doctor: Doctor; onToggle: (id: string, val: boolean) => void; toggling: string | null }) {
  const isToggling = toggling === doctor.id;

  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-300 ${
        doctor.available
          ? "bg-[#0f3d28] border-[#1d3a28]"
          : "bg-[#0a1f15] border-[#1d2e20] opacity-70"
      }`}
      style={{ animation: "fadeSlideUp 0.5s ease both" }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-medium shrink-0 ${
          doctor.available ? "bg-[#1d9e75]/30 text-[#5dcaa5]" : "bg-[#1d3a28] text-[#3d6b54]"
        }`}>
          {doctor.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#e1f5ee] text-sm">{doctor.name}</p>
          <p className={`text-xs mt-0.5 ${doctor.available ? "text-[#1d9e75]" : "text-[#3d6b54]"}`}>
            {doctor.specialty}
          </p>
        </div>
        {/* Availability badge */}
        <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 ${
          doctor.available
            ? "bg-[#1d9e75]/20 text-[#5dcaa5] border-[#1d9e75]/30"
            : "bg-red-900/20 text-red-400 border-red-800/30"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${doctor.available ? "bg-[#1d9e75]" : "bg-red-500"}`} />
          {doctor.available ? "Available" : "Unavailable"}
        </span>
      </div>

      {/* Bio */}
      <p className="text-xs text-[#7abfa0] leading-relaxed">{doctor.bio}</p>

      {/* Days */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#3d6b54] mb-2">Working days</p>
        <div className="flex flex-wrap gap-1.5">
          {doctor.availableDays.map((day) => (
            <span key={day} className="text-xs bg-[#0a1f15] border border-[#1d3a28] text-[#5dcaa5] px-2 py-0.5 rounded-full">
              {day.slice(0, 3)}
            </span>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#3d6b54] mb-2">Time slots</p>
        <div className="flex flex-wrap gap-1.5">
          {doctor.timeSlots.map((slot) => (
            <span key={slot} className="text-xs bg-[#0a1f15] border border-[#1d3a28] text-[#5dcaa5] px-2 py-0.5 rounded-full">
              {slot}
            </span>
          ))}
        </div>
      </div>

      {/* Toggle button */}
      <button
        disabled={isToggling}
        onClick={() => onToggle(doctor.id, !doctor.available)}
        className={`w-full py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
          doctor.available
            ? "bg-red-900/20 text-red-400 border-red-800/30 hover:bg-red-900/40"
            : "bg-[#1d9e75]/20 text-[#5dcaa5] border-[#1d9e75]/30 hover:bg-[#1d9e75]/40"
        }`}
      >
        {isToggling ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            {doctor.available
              ? <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>
              : <><circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" /></>
            }
          </svg>
        )}
        {isToggling ? "Updating…" : doctor.available ? "Set unavailable" : "Set available"}
      </button>
    </div>
  );
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors]   = useState<Doctor[]>([]);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [filter, setFilter]     = useState<"all" | "available" | "unavailable">("all");

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(collection(db, "doctors"));
        setDoctors(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Doctor)));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const toggleAvailability = async (id: string, value: boolean) => {
    setToggling(id);
    try {
      await updateDoc(doc(db, "doctors", id), { available: value });
      setDoctors((prev) => prev.map((d) => (d.id === id ? { ...d, available: value } : d)));
    } finally {
      setToggling(null);
    }
  };

  const filtered = doctors.filter((d) => {
    if (filter === "available")   return d.available;
    if (filter === "unavailable") return !d.available;
    return true;
  });

  const availableCount   = doctors.filter((d) => d.available).length;
  const unavailableCount = doctors.filter((d) => !d.available).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,400&family=DM+Sans:wght@400;500&display=swap');
        body { font-family: 'DM Sans', sans-serif; background: #0a1f15; }
        .fraunces { font-family: 'Fraunces', serif; }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-[#0a1f15]">
          <AdminSidebar />

          <main className="flex-1 flex flex-col min-w-0">

            {/* Top bar */}
            <header className="sticky top-0 z-10 bg-[#0a1f15]/80 backdrop-blur-md border-b border-[#1d3a28] px-6 py-4 flex items-center gap-3">
              <SidebarTrigger className="text-[#5dcaa5] hover:text-[#e1f5ee] transition-colors" />
              <div>
                <h1 className="fraunces text-xl text-[#e1f5ee]">Doctors</h1>
                <p className="text-xs text-[#5dcaa5]">Manage doctor availability</p>
              </div>
            </header>

            <div className="flex-1 px-6 py-6 space-y-6 max-w-6xl mx-auto w-full">

              {/* Stat row */}
              {!loading && (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Total doctors", value: doctors.length,  color: "text-[#e1f5ee]",  bg: "bg-[#0f3d28] border-[#1d3a28]" },
                    { label: "Available",      value: availableCount,  color: "text-[#5dcaa5]",  bg: "bg-[#1d9e75]/10 border-[#1d9e75]/20" },
                    { label: "Unavailable",    value: unavailableCount, color: "text-red-400",   bg: "bg-red-900/10 border-red-800/20" },
                  ].map((s) => (
                    <div key={s.label} className={`rounded-2xl border p-5 ${s.bg}`}>
                      <p className="text-xs text-[#5dcaa5] mb-2">{s.label}</p>
                      <p className={`fraunces text-3xl ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Filter tabs */}
              <div className="flex gap-1 bg-[#0f3d28] border border-[#1d3a28] rounded-xl p-1 max-w-xs">
                {(["all", "available", "unavailable"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all duration-200 ${
                      filter === f ? "bg-[#1d9e75] text-white" : "text-[#5dcaa5] hover:text-[#e1f5ee]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Grid */}
              {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-[#0f3d28] rounded-2xl border border-[#1d3a28] h-72 animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-[#0f3d28] rounded-2xl border border-[#1d3a28] py-20 text-center">
                  <p className="text-[#5dcaa5] text-sm">No doctors in this category.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((doctor) => (
                    <DoctorCard key={doctor.id} doctor={doctor} onToggle={toggleAvailability} toggling={toggling} />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </>
  );
}