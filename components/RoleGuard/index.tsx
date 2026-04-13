"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface Props {
  allow: "patient" | "admin";
  children: React.ReactNode;
}

// ── Spinner ────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#f8f6f1] flex flex-col items-center justify-center gap-4">
      <span className="font-['Fraunces'] text-2xl text-[#0f4f3a]">
        Medi<span className="text-[#1d9e75]">Book</span>
      </span>
      <svg className="w-6 h-6 animate-spin text-[#1d9e75]" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ── Access denied ──────────────────────────────────────────────────────────
function AccessDenied({ role }: { role: string | null }) {
  const router = useRouter();
  const correctPath = role === "admin" ? "/admin" : "/patient";
  const correctLabel = role === "admin" ? "Admin Dashboard" : "Patient Dashboard";

  return (
    <div className="min-h-screen bg-[#f8f6f1] flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
        <svg className="w-7 h-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <div>
        <h1 className="font-['Fraunces'] text-2xl text-[#0f2d20] mb-2">Access denied</h1>
        <p className="text-sm text-[#777] max-w-xs">
          You don&apos;t have permission to view this page. This area is restricted to a different role.
        </p>
      </div>
      <button
        onClick={() => router.push(correctPath)}
        className="bg-[#0f4f3a] text-[#e1f5ee] px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#0a3829] active:scale-95 transition-all duration-200"
      >
        Go to {correctLabel}
      </button>
    </div>
  );
}

// ── Guard ──────────────────────────────────────────────────────────────────
export function RoleGuard({ allow, children }: Props) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Not logged in at all — send to sign-in
    if (!loading && !user) {
      router.push("/sign-in");
    }
  }, [loading, user, router]);

  // Still resolving auth state
  if (loading) return <LoadingScreen />;

  // Not logged in
  if (!user) return <LoadingScreen />;

  // Logged in but wrong role
  if (role !== allow) return <AccessDenied role={role} />;

  // Correct role — render the page
  return <>{children}</>;
}