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

function GridIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
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

const navItems = [
  { label: "Overview", href: "/admin", icon: GridIcon },
  { label: "Appointments", href: "/admin/appointments", icon: CalendarIcon },
  { label: "Doctors", href: "/admin/doctors", icon: DoctorIcon },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  return (
    <Sidebar
      className="border-r border-[#1d3a28]"
      style={{ "--sidebar": "#0a1f15" } as React.CSSProperties}
    >
      <SidebarHeader className="px-5 py-5">
        <Link href="/" className="font-['Fraunces'] text-xl text-[#e1f5ee]">
          Medi<span className="text-[#1d9e75]">Book</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1d9e75]" />
          <p className="text-xs text-[#5dcaa5]">Admin Panel</p>
        </span>
      </SidebarHeader>

      <SidebarSeparator className="bg-[#1d3a28]" />

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
                          ? "bg-[#1d9e75] text-white"
                          : "text-[#7abfa0] hover:bg-[#0f3d28] hover:text-[#e1f5ee]"
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

      <SidebarSeparator className="bg-[#1d3a28]" />

      <SidebarFooter className="px-4 py-4">
        <div className="flex items-center gap-3 px-3 py-2.5 bg-[#0f3d28] rounded-xl border border-[#1d3a28] mb-2">
          <div className="w-8 h-8 rounded-full bg-[#1d9e75] flex items-center justify-center text-xs font-medium text-white shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#e1f5ee] truncate">{user?.displayName ?? "Admin"}</p>
            <p className="text-xs text-[#5dcaa5] truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-[#5dcaa5] hover:bg-red-900/20 hover:text-red-400 transition-all duration-200"
        >
          <LogoutIcon />
          Sign out
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}