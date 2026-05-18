import path from "node:path";
import nodemailer from "nodemailer";

type ReservationEmailPayload = {
  to: string;
  name: string;
  receiptUrl: string;
  totalPrice: number;
  downPaymentAmount: number;
};

function getPublicSiteUrl() {
  const raw =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    "https://www.tiripon-spring-resort.com";

  if (!raw) return null;

  const normalized = raw.startsWith("http") ? raw : `https://${raw}`;

  try {
    return new URL(normalized);
  } catch {
    return null;
  }
}

function resolveReceiptUrl(receiptUrl: string) {
  const publicSiteUrl = getPublicSiteUrl();
  if (!publicSiteUrl) return receiptUrl;

  try {
    const incoming = new URL(receiptUrl);
    const incomingHost = incoming.hostname.toLowerCase();

    if (incomingHost === "localhost" || incomingHost === "127.0.0.1") {
      return new URL(incoming.pathname + incoming.search, publicSiteUrl).toString();
    }

    return receiptUrl;
  } catch {
    return new URL(receiptUrl, publicSiteUrl).toString();
  }
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user;

  if (!host || !user || !pass || !from) {
    throw new Error("SMTP is not fully configured.");
  }

  return { host, port, user, pass, from };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

export async function sendReservationEmail({
  to,
  name,
  receiptUrl,
  totalPrice,
  downPaymentAmount,
}: ReservationEmailPayload) {
  const smtp = getSmtpConfig();
  const safeName = escapeHtml(name);
  const publicReceiptUrl = resolveReceiptUrl(receiptUrl);
  const safeReceiptUrl = escapeHtml(publicReceiptUrl);
  const formattedTotalPrice = formatCurrency(totalPrice);
  const formattedDownPaymentAmount = formatCurrency(downPaymentAmount);
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  const qrPath = path.join(process.cwd(), "public", "images", "qr.jpg");

  await transporter.sendMail({
    from: `"Basagan Resort Reservations" <${smtp.from}>`,
    to,
    subject: "Basagan Resort Reservation Payment Instructions",
    text: [
      `Dear ${name},`,
      "",
      "Thank you for submitting your reservation request with Basagan Resort.",
      "",
      "To secure your reservation, please settle the required 50% down payment within 30 minutes using the QR code included in this email.",
      "",
      `Booking total: ${formattedTotalPrice}`,
      `Required down payment: ${formattedDownPaymentAmount}`,
      "",
      "After completing your payment, upload your receipt using this confirmation link:",
      publicReceiptUrl,
      "",
      "Please note that the confirmation link is valid for 30 minutes from the time your reservation request was created.",
      "",
      "Thank you,",
      "Basagan Resort Reservations",
    ].join("\n"),
    html: `
      <div style="margin: 0; padding: 0; background: #f5efe3;">
        <div style="max-width: 640px; margin: 0 auto; padding: 32px 18px; font-family: Arial, sans-serif; color: #4b382f;">
          <div style="background: #ffffff; border: 1px solid #e1d4bd; overflow: hidden;">
            <div style="padding: 28px 28px 20px; background: #7da2a9; color: #fffaf0;">
              <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;">Reservation Request</p>
              <h1 style="margin: 0; font-size: 28px; line-height: 1.2; font-weight: 600;">Payment Instructions</h1>
            </div>

            <div style="padding: 28px; line-height: 1.65;">
              <p style="margin: 0 0 16px;">Dear ${safeName},</p>
              <p style="margin: 0 0 18px;">
                Thank you for submitting your reservation request with Basagan Resort.
                To secure your reservation, please settle the required 50% down payment
                within 30 minutes using the QR code below.
              </p>

              <div style="margin: 26px auto; max-width: 420px; text-align: center; padding: 26px 22px; border: 1px solid #d8c6ad; background: #f5efe3;">
                <p style="margin: 0 0 8px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;">Booking Total</p>
                <p style="margin: 0 0 22px; font-size: 22px; font-weight: 700;">${formattedTotalPrice}</p>
                <p style="margin: 0 0 8px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;">Required 50% Down Payment</p>
                <p style="margin: 0; font-size: 34px; line-height: 1; font-weight: 700;">${formattedDownPaymentAmount}</p>
              </div>

              <div style="text-align: center; margin: 28px 0;">
                <img src="cid:reservation-qr" alt="Payment QR code" style="display: block; max-width: 260px; width: 100%; height: auto; margin: 0 auto; border: 1px solid #e1d4bd;" />
              </div>

              <p style="margin: 0 0 18px;">
                After completing your payment, please upload your payment receipt through
                the confirmation link below.
              </p>

              <div style="text-align: center; margin: 28px 0;">
                <a href="${safeReceiptUrl}" style="display: inline-block; background: #4b382f; color: #fffaf0; text-decoration: none; padding: 13px 22px; font-weight: 700;">
                  Upload Payment Receipt
                </a>
              </div>

              <p style="margin: 0; font-size: 13px; color: #6f5a4f;">
                This confirmation link is valid for 30 minutes from the time your reservation request was created.
              </p>
            </div>

            <div style="padding: 18px 28px; border-top: 1px solid #e1d4bd; background: #f5efe3; font-size: 13px; color: #6f5a4f;">
              <p style="margin: 0;">Basagan Resort Reservations</p>
            </div>
          </div>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: "qr.jpg",
        path: qrPath,
        cid: "reservation-qr",
      },
    ],
  });
}
