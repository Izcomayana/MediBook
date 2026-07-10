// scripts/sendReminders.js
// Runs daily via GitHub Actions — fetches appointments for tomorrow
// and sends a reminder email to each patient via EmailJS

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore }        = require("firebase-admin/firestore");

// ── Init Firebase Admin ────────────────────────────────────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

// ── EmailJS send via REST API ──────────────────────────────────────────────
async function sendReminderEmail({ patientName, patientEmail, doctorName, specialty, date, time }) {
  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id:  process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_REMINDER_TEMPLATE_ID,
      user_id:     process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,   // ← required for server-side calls
      template_params: {
        patient_name:  patientName,
        patient_email: patientEmail,
        doctor_name:   doctorName,
        specialty,
        date,
        time,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`EmailJS error for ${patientEmail}: ${text}`);
  }

  console.log(`✓ Reminder sent to ${patientName} (${patientEmail})`);
}

// ── Get tomorrow's date in YYYY-MM-DD format ───────────────────────────────
function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

// ── Format date for email body ─────────────────────────────────────────────
function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const tomorrow = getTomorrowDate();
  console.log(`Running reminders for: ${tomorrow}`);

  const snap = await db
    .collection("appointments")
    .where("date", "==", tomorrow)
    .where("status", "==", "confirmed")
    .get();

  if (snap.empty) {
    console.log("No confirmed appointments for tomorrow. Done.");
    return;
  }

  console.log(`Found ${snap.size} appointment(s) for tomorrow.`);

  const results = await Promise.allSettled(
    snap.docs.map((docSnap) => {
      const appt = docSnap.data();
      return sendReminderEmail({
        patientName:  appt.patientName,
        patientEmail: appt.patientEmail,
        doctorName:   appt.doctorName,
        specialty:    appt.specialty,
        date:         formatDate(appt.date),
        time:         appt.timeSlot,
      });
    })
  );

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`✗ Failed for appointment ${snap.docs[i].id}:`, result.reason);
    }
  });

  console.log("Done.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});





// // scripts/sendReminders.js
// // Runs daily via GitHub Actions — fetches appointments for tomorrow
// // and sends a reminder email to each patient via EmailJS

// const { initializeApp, cert } = require("firebase-admin/app");
// const { getFirestore }        = require("firebase-admin/firestore");

// // ── Init Firebase Admin ────────────────────────────────────────────────────
// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// initializeApp({ credential: cert(serviceAccount) });

// const db = getFirestore();

// // ── EmailJS send via REST API ──────────────────────────────────────────────
// // We use fetch (Node 18+) to call EmailJS directly — no browser needed
// async function sendReminderEmail({ patientName, patientEmail, doctorName, specialty, date, time }) {
//   const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       service_id:  process.env.EMAILJS_SERVICE_ID,
//       template_id: process.env.EMAILJS_REMINDER_TEMPLATE_ID,
//       user_id:     process.env.EMAILJS_PUBLIC_KEY,
//       template_params: {
//         patient_name:  patientName,
//         patient_email: patientEmail,
//         doctor_name:   doctorName,
//         specialty,
//         date,
//         time,
//       },
//     }),
//   });

//   if (!response.ok) {
//     const text = await response.text();
//     throw new Error(`EmailJS error for ${patientEmail}: ${text}`);
//   }

//   console.log(`✓ Reminder sent to ${patientName} (${patientEmail})`);
// }

// // ── Get tomorrow's date in YYYY-MM-DD format ───────────────────────────────
// function getTomorrowDate() {
//   const tomorrow = new Date();
//   tomorrow.setDate(tomorrow.getDate() + 1);
//   return tomorrow.toISOString().split("T")[0]; // e.g. "2026-04-15"
// }

// // ── Format date for email body ─────────────────────────────────────────────
// function formatDate(dateStr) {
//   return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
//     weekday: "long", day: "numeric", month: "long", year: "numeric",
//   });
// }

// // ── Main ───────────────────────────────────────────────────────────────────
// async function main() {
//   const tomorrow = getTomorrowDate();
//   console.log(`Running reminders for: ${tomorrow}`);

//   // Fetch all confirmed appointments for tomorrow
//   const snap = await db
//     .collection("appointments")
//     .where("date", "==", tomorrow)
//     .where("status", "==", "confirmed")
//     .get();

//   if (snap.empty) {
//     console.log("No confirmed appointments for tomorrow. Done.");
//     return;
//   }

//   console.log(`Found ${snap.size} appointment(s) for tomorrow.`);

//   // Send a reminder for each one
//   const results = await Promise.allSettled(
//     snap.docs.map((docSnap) => {
//       const appt = docSnap.data();
//       return sendReminderEmail({
//         patientName:  appt.patientName,
//         patientEmail: appt.patientEmail,
//         doctorName:   appt.doctorName,
//         specialty:    appt.specialty,
//         date:         formatDate(appt.date),
//         time:         appt.timeSlot,
//       });
//     })
//   );

//   // Log any failures without crashing the whole run
//   results.forEach((result, i) => {
//     if (result.status === "rejected") {
//       console.error(`✗ Failed for appointment ${snap.docs[i].id}:`, result.reason);
//     }
//   });

//   console.log("Done.");
// }

// main().catch((err) => {
//   console.error("Fatal error:", err);
//   process.exit(1);
// });