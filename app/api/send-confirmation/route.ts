import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// ── Transporter ────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ── POST /api/send-confirmation ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { patientName, patientEmail, doctorName, specialty, date, time } =
      await req.json();

    await transporter.sendMail({
      from: `"MediBook" <${process.env.GMAIL_USER}>`,
      to: patientEmail,
      subject: "Your MediBook appointment has been confirmed ✓",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8f6f1; border-radius: 16px; overflow: hidden;">
          <div style="background: #0f2d20; padding: 32px 40px;">
            <h1 style="font-family: Georgia, serif; color: #e1f5ee; font-size: 24px; margin: 0;">
              Medi<span style="color: #1d9e75;">Book</span>
            </h1>
          </div>
          <div style="padding: 40px;">
            <h2 style="color: #0f2d20; font-size: 20px; margin: 0 0 8px;">Appointment confirmed ✓</h2>
            <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 32px;">
              Hi ${patientName}, your appointment has been confirmed. Here are your details:
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Confirmation email error:", error);
    return NextResponse.json(
      { error: "Failed to send confirmation email", detail: String(error) },
      { status: 500 }
    );
  }
}