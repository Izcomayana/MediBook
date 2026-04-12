"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

// ── Icons ──────────────────────────────────────────────────────────────────
function HomeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function DoctorIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ── Nav items ──────────────────────────────────────────────────────────────
const navItems = [
  { label: "Overview", href: "/patient", icon: HomeIcon },
  { label: "Doctors", href: "/patient/doctors", icon: DoctorIcon },
  { label: "Appointments", href: "/patient/appointments", icon: CalendarIcon },
];

// ── Component ──────────────────────────────────────────────────────────────
export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "MB";

  return (
    <Sidebar className="border-r border-[#e8e4dc] bg-[#f8f6f1]">

      {/* ── Header / Logo ── */}
      <SidebarHeader className="px-5 py-5">
        <Link href="/" className="font-['Fraunces'] text-xl text-[#0f4f3a]">
          Medi<span className="text-[#1d9e75]">Book</span>
        </Link>
        <p className="text-xs text-[#999] mt-0.5">Patient Portal</p>
      </SidebarHeader>

      <SidebarSeparator className="bg-[#e8e4dc]" />

      {/* ── Nav ── */}
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map(({ label, href, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active
                            ? "bg-[#0f4f3a] text-[#e1f5ee]"
                            : "text-[#555] hover:bg-[#eee8df] hover:text-[#0f4f3a]"
                          }`}
                      >
                        <Icon />
                        {label}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="bg-[#e8e4dc]" />

      {/* ── Footer / User ── */}
      <SidebarFooter className="px-4 py-4">
        {/* User pill */}
        <div className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-[#e8e4dc] mb-2">
          <div className="w-8 h-8 rounded-full bg-[#e1f5ee] flex items-center justify-center text-xs font-medium text-[#0f6e56] shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1a1a1a] truncate">
              {user?.displayName ?? "Patient"}
            </p>
            <p className="text-xs text-[#999] truncate">{user?.email}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-[#999] hover:bg-red-50 hover:text-red-500 transition-all duration-200"
        >
          <LogoutIcon />
          Sign out
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}