"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

// ── Types ──────────────────────────────────────────────────────────────────
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  avatar: string;
  availableDays: string[];
  timeSlots: string[];
}

interface Props {
  doctor: Doctor;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getNext14Days(availableDays: string[]) {
  const dates: { label: string; value: string; day: string }[] = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayName = DAYS[d.getDay()];
    if (availableDays.includes(dayName)) {
      dates.push({
        label: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
        value: d.toISOString().split("T")[0],
        day: dayName,
      });
    }
  }
  return dates;
}

// ── Component ──────────────────────────────────────────────────────────────
export function BookingModal({ doctor, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const availableDates = getNext14Days(doctor.availableDays);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch already-booked slots for selected date
  const handleDateSelect = async (dateValue: string) => {
    setSelectedDate(dateValue);
    setSelectedSlot("");
    try {
      const q = query(
        collection(db, "appointments"),
        where("doctorId", "==", doctor.id),
        where("date", "==", dateValue),
        where("status", "in", ["pending", "confirmed"])
      );
      const snap = await getDocs(q);
      setBookedSlots(snap.docs.map((d) => d.data().timeSlot as string));
    } catch {
      setBookedSlots([]);
    }
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot || !user) return;
    setLoading(true);
    setError("");
    try {
      await addDoc(collection(db, "appointments"), {
        patientId: user.uid,
        patientName: user.displayName ?? "Patient",
        patientEmail: user.email,
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        date: selectedDate,
        timeSlot: selectedSlot,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      onSuccess();
    } catch {
      setError("Failed to book appointment. Please try again.");
      setLoading(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,29,20,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-[#f8f6f1] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        style={{ animation: "modalIn 0.25s ease both" }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.96) translateY(10px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div className="bg-[#0f2d20] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1d9e75] flex items-center justify-center text-sm font-medium text-white">
              {doctor.avatar}
            </div>
            <div>
              <p className="text-sm font-medium text-[#e1f5ee]">{doctor.name}</p>
              <p className="text-xs text-[#7abfa0]">{doctor.specialty}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#7abfa0] hover:text-[#e1f5ee] transition-colors duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Step 1 — Pick date */}
          <div>
            <p className="text-xs uppercase tracking-widest text-[#999] mb-3">Select a date</p>
            {availableDates.length === 0 ? (
              <p className="text-sm text-[#999]">No available dates in the next 14 days.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableDates.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => handleDateSelect(d.value)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium text-left transition-all duration-200 border ${selectedDate === d.value
                        ? "bg-[#0f4f3a] text-[#e1f5ee] border-[#0f4f3a]"
                        : "bg-white text-[#555] border-[#e0e0e0] hover:border-[#1d9e75] hover:text-[#0f4f3a]"
                      }`}
                  >
                    <span className="block font-semibold">{d.label.split(" ")[0]}</span>
                    <span className="block text-[11px] opacity-80">{d.label.split(" ").slice(1).join(" ")}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2 — Pick time */}
          {selectedDate && (
            <div style={{ animation: "modalIn 0.2s ease both" }}>
              <p className="text-xs uppercase tracking-widest text-[#999] mb-3">Select a time</p>
              <div className="grid grid-cols-3 gap-2">
                {doctor.timeSlots.map((slot) => {
                  const booked = bookedSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      disabled={booked}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border ${booked
                          ? "bg-[#f0ede8] text-[#ccc] border-[#e8e4dc] cursor-not-allowed line-through"
                          : selectedSlot === slot
                            ? "bg-[#0f4f3a] text-[#e1f5ee] border-[#0f4f3a]"
                            : "bg-white text-[#555] border-[#e0e0e0] hover:border-[#1d9e75] hover:text-[#0f4f3a]"
                        }`}
                    >
                      {booked ? "Taken" : slot}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedDate && selectedSlot && (
            <div className="bg-[#e1f5ee] border border-[#9FE1CB] rounded-xl px-4 py-3" style={{ animation: "modalIn 0.2s ease both" }}>
              <p className="text-xs text-[#0f6e56] font-medium mb-1">Booking summary</p>
              <p className="text-sm text-[#0f4f3a]">
                {doctor.name} · {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · {selectedSlot}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e8e4dc] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm border border-[#e0e0e0] text-[#555] hover:bg-[#eee8df] transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleBook}
            disabled={!selectedDate || !selectedSlot || loading}
            className="flex-1 py-2.5 rounded-xl text-sm bg-[#0f4f3a] text-[#e1f5ee] font-medium hover:bg-[#0a3829] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#e1f5ee" strokeWidth="3" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#e1f5ee" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Booking…
              </>
            ) : (
              "Confirm booking"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}