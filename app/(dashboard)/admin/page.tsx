"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit, updateDoc, doc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  specialty: string;
  date: string;
  timeSlot: string;
  status: "pending" | "confirmed" | "cancelled";
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const styles = {
    pending:   "bg-amber-900/30 text-amber-400 border-amber-700/50",
    confirmed: "bg-[#1d9e75]/20 text-[#5dcaa5] border-[#1d9e75]/30",
    cancelled: "bg-red-900/20 text-red-400 border-red-800/30",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function AdminOverviewPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [updating, setUpdating]         = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      const q = query(collection(db, "appointments"), orderBy("createdAt", "desc"), limit(10));
      const snap = await getDocs(q);
      setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const updateStatus = async (id: string, status: "confirmed" | "cancelled") => {
    setUpdating(id);
    try {
      // 1. Update Firestore
      await updateDoc(doc(db, "appointments", id), { status });

      const appt = appointments.find((a) => a.id === id);

      // 2. Send confirmation email if confirming
      if (status === "confirmed" && appt) {
        const formattedDate = new Date(appt.date + "T00:00:00").toLocaleDateString("en-GB", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        });

        const res = await fetch("/api/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientName:  appt.patientName,
            patientEmail: appt.patientEmail,
            doctorName:   appt.doctorName,
            specialty:    appt.specialty,
            date:         formattedDate,
            time:         appt.timeSlot,
          }),
        });

        if (!res.ok) {
          // Roll back Firestore to pending
          await updateDoc(doc(db, "appointments", id), { status: "pending" });
          toast.error("Failed to send confirmation email. Appointment reset to pending.");
          return;
        }

        toast.success(`Confirmed! Email sent to ${appt.patientEmail}`);
      } else {
        toast.success("Appointment cancelled.");
      }

      // 3. Update local state only on success
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } catch (err) {
      console.error("updateStatus error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  const total     = appointments.length;
  const pending   = appointments.filter((a) => a.status === "pending").length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;

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
            <header className="sticky top-0 z-10 bg-[#0a1f15]/80 backdrop-blur-md border-b border-[#1d3a28] px-6 py-4 md:flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-[#5dcaa5] hover:text-[#e1f5ee] transition-colors" />
                <div>
                  <h1 className="fraunces text-xl text-[#e1f5ee]">Overview</h1>
                  <p className="text-xs text-[#5dcaa5]">Hospital appointment management</p>
                </div>
              </div>
              <p className="text-xs text-[#5dcaa5]">
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </header>

            <div className="flex-1 px-6 py-6 space-y-6 max-w-6xl mx-auto w-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total bookings", value: total,     accent: "text-[#e1f5ee]", bg: "bg-[#0f3d28] border-[#1d3a28]" },
                  { label: "Pending",         value: pending,   accent: "text-amber-400", bg: "bg-amber-900/20 border-amber-800/30" },
                  { label: "Confirmed",        value: confirmed, accent: "text-[#5dcaa5]", bg: "bg-[#1d9e75]/10 border-[#1d9e75]/20" },
                  { label: "Cancelled",        value: cancelled, accent: "text-red-400",   bg: "bg-red-900/10 border-red-800/20" },
                ].map((s, i) => (
                  <div key={s.label} className={`rounded-2xl border p-5 ${s.bg}`} style={{ animation: `fadeSlideUp 0.4s ease ${i * 80}ms both` }}>
                    <p className="text-xs text-[#5dcaa5] mb-2">{s.label}</p>
                    <p className={`fraunces text-3xl ${s.accent}`}>{loading ? "—" : s.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="fraunces text-xl text-[#e1f5ee]">Recent appointments</h2>
                  <a href="/admin/appointments" className="text-xs text-[#1d9e75] hover:text-[#5dcaa5] transition-colors">View all →</a>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="bg-[#0f3d28] rounded-2xl border border-[#1d3a28] h-16 animate-pulse" />)}
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="bg-[#0f3d28] rounded-2xl border border-[#1d3a28] py-16 text-center">
                    <p className="text-[#5dcaa5] text-sm">No appointments yet.</p>
                  </div>
                ) : (
                  <div className="bg-[#0f3d28] rounded-2xl border border-[#1d3a28] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#1d3a28]">
                          {["Patient", "Doctor", "Date", "Time", "Status", "Action"].map((h) => (
                            <th key={h} className="text-left text-xs uppercase tracking-widest text-[#5dcaa5] px-5 py-3.5 font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1d3a28]">
                        {appointments.map((appt, i) => (
                          <tr key={appt.id} className="hover:bg-[#0f4f3a]/30 transition-colors duration-150" style={{ animation: `fadeSlideUp 0.4s ease ${i * 50}ms both` }}>
                            <td className="px-5 py-4">
                              <p className="font-medium text-[#e1f5ee] text-sm">{appt.patientName}</p>
                              <p className="text-xs text-[#5dcaa5]">{appt.patientEmail}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-[#e1f5ee] text-sm">{appt.doctorName}</p>
                              <p className="text-xs text-[#5dcaa5]">{appt.specialty}</p>
                            </td>
                            <td className="px-5 py-4 text-[#7abfa0] text-sm">
                              {new Date(appt.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </td>
                            <td className="px-5 py-4 text-[#7abfa0] text-sm">{appt.timeSlot}</td>
                            <td className="px-5 py-4"><StatusBadge status={appt.status} /></td>
                            <td className="px-5 py-4">
                              {appt.status === "pending" ? (
                                <div className="flex gap-2">
                                  <button disabled={updating === appt.id} onClick={() => updateStatus(appt.id, "confirmed")}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-[#1d9e75]/20 text-[#5dcaa5] border border-[#1d9e75]/30 hover:bg-[#1d9e75]/40 disabled:opacity-40 transition-all duration-200">
                                    {updating === appt.id ? "…" : "Confirm"}
                                  </button>
                                  <button disabled={updating === appt.id} onClick={() => updateStatus(appt.id, "cancelled")}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-red-900/20 text-red-400 border border-red-800/30 hover:bg-red-900/40 disabled:opacity-40 transition-all duration-200">
                                    Cancel
                                  </button>
                                </div>
                              ) : <span className="text-xs text-[#3d6b54]">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </>
  );
}





// "use client";

// import { useEffect, useState } from "react";
// import { collection, getDocs, query, orderBy, limit, updateDoc, doc } from "firebase/firestore";
// import emailjs from "@emailjs/browser";
// import { db } from "@/lib/firebase";
// import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
// import { AdminSidebar } from "@/components/AdminSidebar";

// interface Appointment {
//   id: string;
//   patientName: string;
//   patientEmail: string;
//   doctorName: string;
//   specialty: string;
//   date: string;
//   timeSlot: string;
//   status: "pending" | "confirmed" | "cancelled";
// }

// function StatusBadge({ status }: { status: Appointment["status"] }) {
//   const styles = {
//     pending: "bg-amber-900/30 text-amber-400 border-amber-700/50",
//     confirmed: "bg-[#1d9e75]/20 text-[#5dcaa5] border-[#1d9e75]/30",
//     cancelled: "bg-red-900/20 text-red-400 border-red-800/30",
//   };
//   return (
//     <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${styles[status]}`}>
//       {status.charAt(0).toUpperCase() + status.slice(1)}
//     </span>
//   );
// }

// export default function AdminOverviewPage() {
//   const [appointments, setAppointments] = useState<Appointment[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [updating, setUpdating] = useState<string | null>(null);

//   const fetchAppointments = async () => {
//     try {
//       const q = query(collection(db, "appointments"), orderBy("createdAt", "desc"), limit(10));
//       const snap = await getDocs(q);
//       setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment)));
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { fetchAppointments(); }, []);

//   const updateStatus = async (id: string, status: "confirmed" | "cancelled") => {
//     setUpdating(id);
//     try {
//       // 1. Update Firestore
//       await updateDoc(doc(db, "appointments", id), { status });

//       // 2. Find the appointment so we have the patient's details
//       const appt = appointments.find((a) => a.id === id);

//       // 3. Send email only when confirming
//       if (status === "confirmed" && appt) {
//         const formattedDate = new Date(appt.date + "T00:00:00").toLocaleDateString("en-GB", {
//           weekday: "long", day: "numeric", month: "long", year: "numeric",
//         });

//         await emailjs.send(
//           process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
//           process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
//           {
//             patient_name: appt.patientName,
//             patient_email: appt.patientEmail,
//             doctor_name: appt.doctorName,
//             specialty: appt.specialty,
//             date: formattedDate,
//             time: appt.timeSlot,
//           },
//           process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
//         );
//       }

//       // 4. Update local state so UI reflects instantly
//       setAppointments((prev) =>
//         prev.map((a) => (a.id === id ? { ...a, status } : a))
//       );
//     } finally {
//       setUpdating(null);
//     }
//   };

//   const total = appointments.length;
//   const pending = appointments.filter((a) => a.status === "pending").length;
//   const confirmed = appointments.filter((a) => a.status === "confirmed").length;
//   const cancelled = appointments.filter((a) => a.status === "cancelled").length;

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,400&family=DM+Sans:wght@400;500&display=swap');
//         body { font-family: 'DM Sans', sans-serif; background: #0a1f15; }
//         .fraunces { font-family: 'Fraunces', serif; }
//         @keyframes fadeSlideUp {
//           from { opacity: 0; transform: translateY(16px); }
//           to   { opacity: 1; transform: translateY(0); }
//         }
//       `}</style>

//       <SidebarProvider>
//         <div className="flex min-h-screen w-full bg-[#0a1f15]">
//           <AdminSidebar />

//           <main className="flex-1 flex flex-col min-w-0">

//             <header className="sticky top-0 z-10 bg-[#0a1f15]/80 backdrop-blur-md border-b border-[#1d3a28] px-6 py-4 md:flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <SidebarTrigger className="text-[#5dcaa5] hover:text-[#e1f5ee] transition-colors" />
//                 <div>
//                   <h1 className="fraunces text-xl text-[#e1f5ee]">Overview</h1>
//                   <p className="text-xs text-[#5dcaa5]">Hospital appointment management</p>
//                 </div>
//               </div>
//               <p className="text-xs text-[#5dcaa5]">
//                 {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
//               </p>
//             </header>

//             <div className="flex-1 px-6 py-6 space-y-6 max-w-6xl mx-auto w-full">

//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                 {[
//                   { label: "Total bookings", value: total, accent: "text-[#e1f5ee]", bg: "bg-[#0f3d28] border-[#1d3a28]" },
//                   { label: "Pending", value: pending, accent: "text-amber-400", bg: "bg-amber-900/20 border-amber-800/30" },
//                   { label: "Confirmed", value: confirmed, accent: "text-[#5dcaa5]", bg: "bg-[#1d9e75]/10 border-[#1d9e75]/20" },
//                   { label: "Cancelled", value: cancelled, accent: "text-red-400", bg: "bg-red-900/10 border-red-800/20" },
//                 ].map((s, i) => (
//                   <div
//                     key={s.label}
//                     className={`rounded-2xl border p-5 ${s.bg}`}
//                     style={{ animation: `fadeSlideUp 0.4s ease ${i * 80}ms both` }}
//                   >
//                     <p className="text-xs text-[#5dcaa5] mb-2">{s.label}</p>
//                     <p className={`fraunces text-3xl ${s.accent}`}>{loading ? "—" : s.value}</p>
//                   </div>
//                 ))}
//               </div>

//               <div>
//                 <div className="flex items-center justify-between mb-4">
//                   <h2 className="fraunces text-xl text-[#e1f5ee]">Recent appointments</h2>
//                   <a href="/admin/appointments" className="text-xs text-[#1d9e75] hover:text-[#5dcaa5] transition-colors">
//                     View all →
//                   </a>
//                 </div>

//                 {loading ? (
//                   <div className="space-y-3">
//                     {[1, 2, 3].map((i) => (
//                       <div key={i} className="bg-[#0f3d28] rounded-2xl border border-[#1d3a28] h-16 animate-pulse" />
//                     ))}
//                   </div>
//                 ) : appointments.length === 0 ? (
//                   <div className="bg-[#0f3d28] rounded-2xl border border-[#1d3a28] py-16 text-center">
//                     <p className="text-[#5dcaa5] text-sm">No appointments yet.</p>
//                   </div>
//                 ) : (
//                   <div className="bg-[#0f3d28] rounded-2xl border border-[#1d3a28] overflow-hidden">
//                     <table className="w-full text-sm">
//                       <thead>
//                         <tr className="border-b border-[#1d3a28]">
//                           {["Patient", "Doctor", "Date", "Time", "Status", "Action"].map((h) => (
//                             <th key={h} className="text-left text-xs uppercase tracking-widest text-[#5dcaa5] px-5 py-3.5 font-medium">
//                               {h}
//                             </th>
//                           ))}
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y divide-[#1d3a28]">
//                         {appointments.map((appt, i) => (
//                           <tr
//                             key={appt.id}
//                             className="hover:bg-[#0f4f3a]/30 transition-colors duration-150"
//                             style={{ animation: `fadeSlideUp 0.4s ease ${i * 50}ms both` }}
//                           >
//                             <td className="px-5 py-4">
//                               <p className="font-medium text-[#e1f5ee] text-sm">{appt.patientName}</p>
//                               <p className="text-xs text-[#5dcaa5]">{appt.patientEmail}</p>
//                             </td>
//                             <td className="px-5 py-4">
//                               <p className="text-[#e1f5ee] text-sm">{appt.doctorName}</p>
//                               <p className="text-xs text-[#5dcaa5]">{appt.specialty}</p>
//                             </td>
//                             <td className="px-5 py-4 text-[#7abfa0] text-sm">
//                               {new Date(appt.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
//                             </td>
//                             <td className="px-5 py-4 text-[#7abfa0] text-sm">{appt.timeSlot}</td>
//                             <td className="px-5 py-4"><StatusBadge status={appt.status} /></td>
//                             <td className="px-5 py-4">
//                               {appt.status === "pending" ? (
//                                 <div className="flex gap-2">
//                                   <button
//                                     disabled={updating === appt.id}
//                                     onClick={() => updateStatus(appt.id, "confirmed")}
//                                     className="text-xs px-3 py-1.5 rounded-lg bg-[#1d9e75]/20 text-[#5dcaa5] border border-[#1d9e75]/30 hover:bg-[#1d9e75]/40 disabled:opacity-40 transition-all duration-200"
//                                   >
//                                     {updating === appt.id ? "…" : "Confirm"}
//                                   </button>
//                                   <button
//                                     disabled={updating === appt.id}
//                                     onClick={() => updateStatus(appt.id, "cancelled")}
//                                     className="text-xs px-3 py-1.5 rounded-lg bg-red-900/20 text-red-400 border border-red-800/30 hover:bg-red-900/40 disabled:opacity-40 transition-all duration-200"
//                                   >
//                                     Cancel
//                                   </button>
//                                 </div>
//                               ) : (
//                                 <span className="text-xs text-[#3d6b54]">—</span>
//                               )}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </main>
//         </div>
//       </SidebarProvider>
//     </>
//   );
// }