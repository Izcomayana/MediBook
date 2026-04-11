import { useState } from "react";

export function HeroCard() {
  const [activeSlot, setActiveSlot] = useState(1);
  const slots = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"];

  return (
    <div className="bg-white rounded-2xl border border-[#e0e0e0] p-6 shadow-lg animate-[fadeSlideUp_0.9s_ease_0.4s_both]">
      {/* Card header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#e1f5ee] flex items-center justify-center text-sm font-medium text-[#0f6e56]">
          AE
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#1a1a1a]">Book appointment</p>
          <p className="text-xs text-[#888]">Choose a doctor & time</p>
        </div>
        <span className="text-xs bg-[#e1f5ee] text-[#0f6e56] px-3 py-1 rounded-full">Online</span>
      </div>

      <div className="h-px bg-[#eee] mb-4" />

      {/* Doctor */}
      <div className="mb-3">
        <p className="text-[10px] uppercase tracking-widest text-[#999] mb-1">Doctor</p>
        <p className="text-sm font-medium text-[#1a1a1a]">Dr. Adewale Okonkwo — General</p>
      </div>

      {/* Date */}
      <div className="mb-3">
        <p className="text-[10px] uppercase tracking-widest text-[#999] mb-1">Date</p>
        <p className="text-sm font-medium text-[#1a1a1a]">Tuesday, April 15, 2026</p>
      </div>

      {/* Slots */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#999] mb-2">Available slots</p>
        <div className="grid grid-cols-3 gap-1.5">
          {slots.map((slot, i) => (
            <button
              key={slot}
              onClick={() => setActiveSlot(i)}
              className={`py-2 rounded-lg text-xs font-medium transition-all duration-200 ${activeSlot === i
                  ? "bg-[#0f4f3a] text-[#e1f5ee]"
                  : "bg-[#f8f6f1] text-[#555] hover:bg-[#e1f5ee] hover:text-[#0f6e56]"
                }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      <button className="w-full mt-4 bg-[#0f4f3a] text-[#e1f5ee] py-2.5 rounded-full text-sm font-medium hover:bg-[#0a3829] active:scale-95 transition-all duration-200">
        Confirm booking
      </button>
    </div>
  );
}