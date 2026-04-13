import { RoleGuard } from "@/components/RoleGuard";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allow="patient">{children}</RoleGuard>;
}