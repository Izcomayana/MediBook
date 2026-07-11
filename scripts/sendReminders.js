// scripts/sendReminders.js
// Runs daily via GitHub Actions — fetches appointments for tomorrow
// and sends a reminder email to each patient via Nodemailer + Gmail

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const nodemailer = require("nodemailer");

// ── Init Firebase Admin ────────────────────────────────────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Init Nodemailer transporter ────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ── Send reminder email ────────────────────────────────────────────────────
async function sendReminderEmail({ patientName, patientEmail, doctorName, specialty, date, time }) {
  await transporter.sendMail({
    from: `"MediBook" <${process.env.GMAIL_USER}>`,
    to: patientEmail,
    subject: "Reminder: Your MediBook appointment is tomorrow ⏰",
    replyTo: process.env.GMAIL_USER,
    headers: {
      "X-Priority": "1",
      "X-Mailer": "MediBook",
    },
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8f6f1; border-radius: 16px; overflow: hidden;">
        <div style="background: #0f2d20; padding: 32px 40px;">
          <h1 style="font-family: Georgia, serif; color: #e1f5ee; font-size: 24px; margin: 0;">
            Medi<span style="color: #1d9e75;">Book</span>
          </h1>
        </div>
        <div style="padding: 40px;">
          <h2 style="color: #0f2d20; font-size: 20px; margin: 0 0 8px;">Your appointment is tomorrow ⏰</h2>
          <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 32px;">
            Hi ${patientName}, this is a friendly reminder that you have a confirmed appointment tomorrow.
          </p>
          <div style="background: white; border-radius: 12px; border: 1px solid #e0e0e0; padding: 24px; margin-bottom: 32px;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0ede8;">
              <span style="font-size: 12px; color: #999; text-transform: uppercase;">Doctor</span>
              <span style="font-size: 13px; font-weight: 500; color: #1a1a1a;">${doctorName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0ede8;">
              <span style="font-size: 12px; color: #999; text-transform: uppercase;">Specialty</span>
              <span style="font-size: 13px; font-weight: 500; color: #1a1a1a;">${specialty}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0ede8;">
              <span style="font-size: 12px; color: #999; text-transform: uppercase;">Date</span>
              <span style="font-size: 13px; font-weight: 500; color: #1a1a1a;">${date}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0;">
              <span style="font-size: 12px; color: #999; text-transform: uppercase;">Time</span>
              <span style="font-size: 13px; font-weight: 500; color: #1a1a1a;">${time}</span>
            </div>
          </div>
          <p style="color: #777; font-size: 13px; line-height: 1.6; margin: 0;">
            Please arrive on time. If you need to reschedule, contact the hospital directly.
          </p>
        </div>
        <div style="background: #0f2d20; padding: 20px 40px;">
          <p style="color: #7abfa0; font-size: 12px; margin: 0;">MediBook — Hospital Appointment System</p>
        </div>
      </div>
    `,
  });
  console.log(`✓ Reminder sent to ${patientName} (${patientEmail})`);
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

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
        patientName: appt.patientName,
        patientEmail: appt.patientEmail,
        doctorName: appt.doctorName,
        specialty: appt.specialty,
        date: formatDate(appt.date),
        time: appt.timeSlot,
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