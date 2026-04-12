"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// ── Helpers ────────────────────────────────────────────────────────────────
function getErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    default:
      return "Something went wrong. Please try again.";
  }
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// Strength indicator
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#1d9e75"];

  if (!password) return null;

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= strength ? colors[strength] : "#e5e7eb" }}
          />
        ))}
      </div>
      <span className="text-xs transition-all duration-200" style={{ color: colors[strength] }}>
        {labels[strength]}
      </span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create Firebase Auth user
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Set display name
      await updateProfile(user, { displayName: fullName });

      // 3. Write user doc to Firestore with role = "patient"
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName,
        email,
        role: "patient",          // default role — change to "admin" manually in Firestore for admin accounts
        createdAt: serverTimestamp(),
      });

      // AuthContext onAuthStateChanged will handle redirect
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(getErrorMessage(code));
      setLoading(false);
    }
  };

  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,400&family=DM+Sans:wght@400;500&display=swap');
        body { font-family: 'DM Sans', sans-serif; background: #f8f6f1; margin: 0; }
        .fraunces { font-family: 'Fraunces', serif; }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
        .shake { animation: shake 0.4s ease; }

        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 50px #fff inset;
          -webkit-text-fill-color: #1a1a1a;
        }
      `}</style>

      <div className="min-h-screen bg-[#f8f6f1] flex">

        {/* ── Left decorative panel ── */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#0f2d20] flex-col justify-between p-12 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#1d9e75]/10" />
          <div className="absolute -bottom-32 -left-16 w-[500px] h-[500px] rounded-full bg-[#1d9e75]/5" />

          {/* Logo */}
          <Link href="/" className="fraunces text-2xl text-[#e1f5ee] relative z-10">
            Medi<span className="text-[#1d9e75]">Book</span>
          </Link>

          {/* Steps preview */}
          <div className="relative z-10 space-y-5">
            <p className="text-xs text-[#5dcaa5] uppercase tracking-widest mb-6">How it works</p>
            {[
              { num: "1", title: "Create your account", desc: "Sign up in seconds — just your name, email and password." },
              { num: "2", title: "Pick a doctor & time", desc: "Browse available doctors and choose a convenient slot." },
              { num: "3", title: "Show up & get care", desc: "Arrive on time — your appointment is confirmed instantly." },
            ].map((step) => (
              <div key={step.num} className="flex gap-4">
                <div className="w-7 h-7 rounded-full border border-[#1d9e75] flex items-center justify-center text-xs text-[#1d9e75] shrink-0 mt-0.5">
                  {step.num}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#e1f5ee] mb-0.5">{step.title}</p>
                  <p className="text-xs text-[#7abfa0] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <p className="text-xs text-[#7abfa0] relative z-10">
            Final year project — Computer Engineering, 2025/2026
          </p>
        </div>

        {/* ── Right form panel ── */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-md py-10 animate-[fadeSlideUp_0.6s_ease_both]">

            {/* Mobile logo */}
            <Link href="/" className="fraunces text-xl text-[#0f4f3a] lg:hidden block mb-10">
              Medi<span className="text-[#1d9e75]">Book</span>
            </Link>

            <h1 className="fraunces text-4xl text-[#0f2d20] mb-2">Create account</h1>
            <p className="text-sm text-[#777] mb-8">Book your first appointment in minutes.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Full name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-[#999]">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Adebowale Emmanuel"
                  required
                  className="w-full bg-white border border-[#e0e0e0] rounded-xl px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#bbb] outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/10 transition-all duration-200"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-[#999]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-white border border-[#e0e0e0] rounded-xl px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#bbb] outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/10 transition-all duration-200"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-[#999]">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white border border-[#e0e0e0] rounded-xl px-4 py-3 pr-11 text-sm text-[#1a1a1a] placeholder-[#bbb] outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/10 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555] transition-colors duration-200"
                  >
                    <EyeIcon open={showPw} />
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-[#999]">Confirm password</label>
                <div className="relative">
                  <input
                    type={showCf ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full bg-white border rounded-xl px-4 py-3 pr-11 text-sm text-[#1a1a1a] placeholder-[#bbb] outline-none focus:ring-2 transition-all duration-200 ${passwordsMismatch
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : passwordsMatch
                          ? "border-[#1d9e75] focus:border-[#1d9e75] focus:ring-[#1d9e75]/10"
                          : "border-[#e0e0e0] focus:border-[#1d9e75] focus:ring-[#1d9e75]/10"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCf(!showCf)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555] transition-colors duration-200"
                  >
                    <EyeIcon open={showCf} />
                  </button>
                  {/* Match tick */}
                  {passwordsMatch && (
                    <svg className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1d9e75]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                {passwordsMismatch && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="shake bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0f4f3a] text-[#e1f5ee] py-3 rounded-xl text-sm font-medium hover:bg-[#0a3829] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#e1f5ee" strokeWidth="3" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="#e1f5ee" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Creating account…
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-[#eee]" />
              <span className="text-xs text-[#bbb]">or</span>
              <div className="flex-1 h-px bg-[#eee]" />
            </div>

            <p className="text-sm text-center text-[#777]">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-[#1d9e75] font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}