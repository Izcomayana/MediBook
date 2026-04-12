"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { HeroCard } from "@/components/HeroCard";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}


function FeatCard({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: string }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: delay }}
      className={`bg-[#0f3d28] border border-[#1d6b4a] rounded-2xl p-6 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
    >
      <div className="w-10 h-10 bg-[#1d9e75] rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-[#e1f5ee] font-medium text-base mb-2">{title}</h3>
      <p className="text-[#7abfa0] text-sm leading-relaxed">{desc}</p>
    </div>
  );
}


function StepCard({ num, title, desc, delay }: { num: string; title: string; desc: string; delay: string }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: delay }}
      className={`flex flex-col gap-3 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
    >
      <div className="w-9 h-9 rounded-full border-2 border-[#1d9e75] flex items-center justify-center text-sm text-[#1d9e75] font-medium">
        {num}
      </div>
      <h3 className="text-[#0f2d20] font-medium text-base">{title}</h3>
      <p className="text-[#666] text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500&display=swap');

        body { font-family: 'DM Sans', sans-serif; background: #f8f6f1; }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .fraunces { font-family: 'Fraunces', serif; }

        /* Grain overlay on hero */
        .grain::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }
      `}</style>

      <Navbar />

      {/* ── Hero ── */}
      <section className="relative grain min-h-screen bg-[#f8f6f1] flex items-center pt-20">
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div
              className="inline-flex items-center gap-2 bg-[#e1f5ee] text-[#0f6e56] text-xs px-3 py-1.5 rounded-full mb-6 animate-[fadeSlideUp_0.6s_ease_both]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#1d9e75]" />
              Hospital appointment system
            </div>

            <h1
              className="fraunces text-5xl md:text-6xl font-semibold text-[#0f2d20] leading-[1.12] mb-6 animate-[fadeSlideUp_0.7s_ease_0.1s_both]"
            >
              Book your next visit,{" "}
              <em className="text-[#1d9e75] not-italic">effortlessly</em>
            </h1>

            <p
              className="text-[#555] text-base leading-relaxed mb-8 max-w-md animate-[fadeSlideUp_0.7s_ease_0.2s_both]"
            >
              MediBook lets patients schedule hospital appointments online — no
              queues, no calls, no paperwork. Doctors and admins manage
              everything from one dashboard.
            </p>

            <div className="flex gap-3 flex-wrap animate-[fadeSlideUp_0.7s_ease_0.3s_both]">
              <Link
                href="/#CTA"
                className="bg-[#0f4f3a] text-[#e1f5ee] px-6 py-3 rounded-full text-sm font-medium hover:bg-[#0a3829] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 shadow-md shadow-[#0f4f3a]/20"
              >
                Book an appointment
              </Link>
              <Link
                href="/sign-in"
                className="border border-[#0f4f3a] text-[#0f4f3a] px-6 py-3 rounded-full text-sm font-medium hover:bg-[#e1f5ee] hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Right — interactive booking card */}
          <HeroCard />
        </div>

        {/* Decorative circle */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#1d9e75]/5 blur-3xl pointer-events-none" />
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-[#0f2d20] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs text-[#5dcaa5] uppercase tracking-widest mb-3">What we offer</p>
          <h2 className="fraunces text-4xl text-[#e1f5ee] mb-12 max-w-lg leading-snug">
            Everything a hospital booking system needs
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            <FeatCard
              delay="0ms"
              title="Online booking"
              desc="Patients pick a doctor, choose a date and time slot, and confirm — all from their phone or browser."
              icon={
                <svg className="w-5 h-5 stroke-[#e1f5ee] fill-none stroke-2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              }
            />
            <FeatCard
              delay="100ms"
              title="Doctor scheduling"
              desc="Doctors view their daily appointments and manage their availability without scheduling conflicts."
              icon={
                <svg className="w-5 h-5 stroke-[#e1f5ee] fill-none stroke-2" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
            <FeatCard
              delay="200ms"
              title="Admin oversight"
              desc="Administrators see all appointments across the hospital and can approve, cancel or reschedule them."
              icon={
                <svg className="w-5 h-5 stroke-[#e1f5ee] fill-none stroke-2" viewBox="0 0 24 24">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-24 px-6 bg-[#f8f6f1]">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs text-[#1d9e75] uppercase tracking-widest mb-3">How it works</p>
          <h2 className="fraunces text-4xl text-[#0f2d20] mb-12">Three steps to your appointment</h2>

          <div className="grid md:grid-cols-3 gap-10">
            <StepCard delay="0ms" num="1" title="Create your account" desc="Sign up as a patient in seconds. Your details are saved securely for future bookings." />
            <StepCard delay="120ms" num="2" title="Pick a doctor & time" desc="Browse available doctors, see open time slots, and choose what works best for you." />
            <StepCard delay="240ms" num="3" title="Show up & get care" desc="Your appointment is confirmed instantly. Just arrive on time — no paperwork needed." />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#1d9e75] py-24 px-6 text-center" id="CTA">
        <div className="max-w-2xl mx-auto">
          <h2 className="fraunces text-5xl text-[#0f2d20] mb-4 leading-tight">
            Ready to skip the queue?
          </h2>
          <p className="text-[#0f4f3a] text-base mb-8">
            Join patients already booking smarter with MediBook.
          </p>
          <Link
            href="/sign-up"
            className="inline-block bg-[#0f2d20] text-[#e1f5ee] px-8 py-4 rounded-full text-base font-medium hover:bg-[#0a1f15] hover:-translate-y-1 active:scale-95 transition-all duration-200 shadow-xl shadow-[#0f2d20]/30"
          >
            Book your first appointment
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0f2d20] py-6 px-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <span className="fraunces text-lg text-[#e1f5ee]">
          Medi<span className="text-[#1d9e75]">Book</span>
        </span>
        <p className="text-xs text-[#7abfa0]">
          Final year project — Computer Engineering, 2025/2026
        </p>
      </footer>
    </>
  );
}