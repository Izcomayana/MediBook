"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// ── Helpers ────────────────────────────────────────────────────────────────
function getErrorMessage(code: string): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    default:
      return "Something went wrong. Please try again.";
  }
}

// ── Eye icon ───────────────────────────────────────────────────────────────
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

// ── Page ───────────────────────────────────────────────────────────────────
export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Sign in with Firebase Auth
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      // 2. Fetch role from Firestore
      const snap = await getDoc(doc(db, "users", user.uid));
      const role = snap.data()?.role ?? "patient";

      // 3. Redirect based on role
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/patient");
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(getErrorMessage(code));
      setLoading(false);
    }
  };

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

        {/* ── Left panel (decorative) ── */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#0f2d20] flex-col justify-between p-12 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#1d9e75]/10" />
          <div className="absolute -bottom-32 -right-16 w-[500px] h-[500px] rounded-full bg-[#1d9e75]/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#1d9e75]/5" />

          {/* Logo */}
          <div className="relative z-10">
            <Link href="/" className="fraunces text-2xl text-[#e1f5ee]">
              Medi<span className="text-[#1d9e75]">Book</span>
            </Link>
          </div>

          {/* Quote */}
          <div className="relative z-10">
            <p className="fraunces text-3xl italic text-[#e1f5ee] leading-snug mb-6 max-w-sm">
              "Healthcare access, simplified for everyone."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1d9e75] flex items-center justify-center text-xs text-white font-medium">
                MB
              </div>
              <div>
                <p className="text-xs text-[#e1f5ee] font-medium">MediBook</p>
                <p className="text-xs text-[#7abfa0]">Hospital Appointment System</p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="relative z-10 grid grid-cols-3 gap-4">
            {[
              { val: "100%", label: "Online booking" },
              { val: "0", label: "Queues" },
              { val: "24/7", label: "Available" },
            ].map((s) => (
              <div key={s.label} className="bg-[#0f3d28] rounded-xl p-4 border border-[#1d6b4a]">
                <p className="fraunces text-2xl text-[#1d9e75] mb-1">{s.val}</p>
                <p className="text-xs text-[#7abfa0]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel (form) ── */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div
            className="w-full max-w-md animate-[fadeSlideUp_0.6s_ease_both]"
          >
            {/* Mobile logo */}
            <Link href="/" className="fraunces text-xl text-[#0f4f3a] lg:hidden block mb-10">
              Medi<span className="text-[#1d9e75]">Book</span>
            </Link>

            <h1 className="fraunces text-4xl text-[#0f2d20] mb-2">Welcome back</h1>
            <p className="text-sm text-[#777] mb-8">Sign in to manage your appointments.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

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
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-[#eee]" />
              <span className="text-xs text-[#bbb]">or</span>
              <div className="flex-1 h-px bg-[#eee]" />
            </div>

            <p className="text-sm text-center text-[#777]">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="text-[#1d9e75] font-medium hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}