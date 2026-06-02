import path from "node:path";
import nodemailer from "nodemailer";

type ReservationEmailPayload = {
  to: string;
  name: string;
  receiptUrl: string;
  totalPrice: number;
  downPaymentAmount: number;
  remainingBalance: number;
  cottageName: string | null;
};

type AdminPaymentNotificationPayload = {
  name: string;
  email: string | null;
  phone: string | null;
  checkIn: Date | null;
  checkOut: Date | null;
  totalPrice: number;
  downPaymentAmount: number;
  remainingBalance: number;
  fullyPaid: boolean;
  cottageName: string | null;
  proofFileName: string | null;
  proofViewUrl: string | null;
  paidAt: Date | null;
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

function resolveSitePath(pathname: string) {
  const publicSiteUrl = getPublicSiteUrl();
  if (!publicSiteUrl) return pathname;

  return new URL(pathname, publicSiteUrl).toString();
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s/g, "");
  const from = process.env.SMTP_FROM ?? user;
  const fromName = process.env.SMTP_FROM_NAME ?? "Basagan Resort Reservations";

  if (!host || !user || !pass || !from) {
    throw new Error("SMTP is not fully configured.");
  }

  return { host, port, user, pass, from, fromName };
}

function getNotificationRecipient() {
  return process.env.RESERVATION_NOTIFY_TO ?? process.env.SMTP_USER;
}

function createTransporter(smtp: ReturnType<typeof getSmtpConfig>) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });
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

function formatDateTime(value: Date | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(value);
}

function formatOptional(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : "Not provided";
}

function createAdminDetailsRows(rows: Array<[string, string]>) {
  return rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eadfcd; color: #6f5a4f; font-size: 13px; line-height: 1.4;">${escapeHtml(label)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eadfcd; font-weight: 600; font-size: 14px; line-height: 1.4; word-break: break-word;">${escapeHtml(value)}</td>
        </tr>
      `,
    )
    .join("");
}

function createAdminEmailHtml(
  title: string,
  intro: string,
  rows: Array<[string, string]>,
  actionUrl?: string,
  secondaryAction?: { label: string; url: string },
) {
  const actionButtons =
    actionUrl || secondaryAction
    ? `
      <div style="margin: 24px 0 4px; text-align: center;">
        ${
          secondaryAction
            ? `<a href="${escapeHtml(secondaryAction.url)}" style="display: inline-block; margin: 0 4px 10px; background: #4b382f; color: #fffaf0; text-decoration: none; padding: 13px 18px; font-weight: 700; font-size: 14px; line-height: 1.2; border-radius: 0;">
              ${escapeHtml(secondaryAction.label)}
            </a>`
            : ""
        }
        ${
          actionUrl
            ? `<a href="${escapeHtml(actionUrl)}" style="display: inline-block; margin: 0 4px 10px; background: #fffaf0; color: #4b382f; text-decoration: none; padding: 12px 17px; font-weight: 700; font-size: 14px; line-height: 1.2; border: 1px solid #4b382f; border-radius: 0;">
              Open Bookings
            </a>`
            : ""
        }
      </div>
    `
    : "";

  return `
    <div style="margin: 0; padding: 0; background: #f5efe3;">
      <div style="max-width: 640px; margin: 0 auto; padding: 20px 10px; font-family: Arial, sans-serif; color: #4b382f;">
        <div style="background: #ffffff; border: 1px solid #e1d4bd; overflow: hidden;">
          <div style="padding: 22px 18px 16px; background: #4b382f; color: #fffaf0;">
            <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;">Basagan Resort</p>
            <h1 style="margin: 0; font-size: 22px; line-height: 1.25; font-weight: 600;">${escapeHtml(title)}</h1>
          </div>
          <div style="padding: 20px 14px; line-height: 1.55;">
            <p style="margin: 0 0 18px;">${escapeHtml(intro)}</p>
            <table style="width: 100%; border-collapse: collapse; background: #fffaf0; border: 1px solid #eadfcd; table-layout: fixed;">
              <tbody>${createAdminDetailsRows(rows)}</tbody>
            </table>
            ${actionButtons}
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function sendReservationEmail({
  to,
  name,
  receiptUrl,
  totalPrice,
  downPaymentAmount,
  remainingBalance,
  cottageName,
}: ReservationEmailPayload) {
  const smtp = getSmtpConfig();
  const safeName = escapeHtml(name);
  const publicReceiptUrl = resolveReceiptUrl(receiptUrl);
  const safeReceiptUrl = escapeHtml(publicReceiptUrl);
  const formattedTotalPrice = formatCurrency(totalPrice);
  const formattedDownPaymentAmount = formatCurrency(downPaymentAmount);
  const formattedRemainingBalance = formatCurrency(remainingBalance);
  const transporter = createTransporter(smtp);

  const qrPath = path.join(process.cwd(), "public", "images", "qr.jpg");

  await transporter.sendMail({
    from: `"${smtp.fromName}" <${smtp.from}>`,
    to,
    subject: "Basagan Resort Reservation Payment Instructions",
    text: [
      `Dear ${name},`,
      "",
      "Thank you for submitting your reservation request with Basagan Resort.",
      "",
      "To secure your reservation, please pay either the full bill or the 50% down payment within 30 minutes using the GCash QR code included in this email. This is a GCash only transaction.",
      "",
      `Selected cottage: ${formatOptional(cottageName)}`,
      `Booking total: ${formattedTotalPrice}`,
      `50% down payment option: ${formattedDownPaymentAmount}`,
      `Remaining balance if paying 50% now: ${formattedRemainingBalance}`,
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
                To secure your reservation, please pay either the full bill or the
                50% down payment within 30 minutes using the GCash QR code below.
                This is a GCash only transaction.
              </p>

              <div style="margin: 26px auto; max-width: 420px; text-align: center; padding: 26px 22px; border: 1px solid #d8c6ad; background: #f5efe3;">
                <p style="margin: 0 0 8px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;">Selected Cottage</p>
                <p style="margin: 0 0 22px; font-size: 20px; font-weight: 700;">${escapeHtml(formatOptional(cottageName))}</p>
                <p style="margin: 0 0 8px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;">Booking Total</p>
                <p style="margin: 0 0 22px; font-size: 22px; font-weight: 700;">${formattedTotalPrice}</p>
                <p style="margin: 0 0 8px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;">50% Down Payment Option</p>
                <p style="margin: 0 0 18px; font-size: 34px; line-height: 1; font-weight: 700;">${formattedDownPaymentAmount}</p>
                <p style="margin: 0 0 8px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;">Remaining Balance If Paying 50%</p>
                <p style="margin: 0; font-size: 22px; line-height: 1.1; font-weight: 700;">${formattedRemainingBalance}</p>
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

export async function sendAdminPaymentNotification({
  name,
  email,
  phone,
  checkIn,
  checkOut,
  totalPrice,
  downPaymentAmount,
  remainingBalance,
  fullyPaid,
  cottageName,
  proofFileName,
  proofViewUrl,
  paidAt,
}: AdminPaymentNotificationPayload) {
  const smtp = getSmtpConfig();
  const to = getNotificationRecipient();

  if (!to) {
    throw new Error("Payment notification recipient is not configured.");
  }

  const rows: Array<[string, string]> = [
    ["Guest", name],
    ["Email", formatOptional(email)],
    ["Phone", formatOptional(phone)],
    ["Check-in", formatDateTime(checkIn)],
    ["Check-out", formatDateTime(checkOut)],
    ["Cottage", formatOptional(cottageName)],
    ["Payment type", fullyPaid ? "Full payment" : "50% payment"],
    ["Booking total", formatCurrency(totalPrice)],
    ["Amount paid", formatCurrency(downPaymentAmount)],
    ["Remaining balance", formatCurrency(remainingBalance)],
    ["Receipt file", formatOptional(proofFileName)],
    ["Paid/uploaded at", formatDateTime(paidAt)],
  ];
  const textRows: Array<[string, string]> = proofViewUrl
    ? [...rows, ["Receipt proof link", proofViewUrl]]
    : rows;

  await createTransporter(smtp).sendMail({
    from: `"${smtp.fromName}" <${smtp.from}>`,
    to,
    replyTo: email ?? undefined,
    subject: `Payment receipt uploaded: ${name}`,
    text: [
      "Payment receipt uploaded for a reservation.",
      "",
      ...textRows.map(([label, value]) => `${label}: ${value}`),
    ].join("\n"),
    html: createAdminEmailHtml(
      "Payment Receipt Uploaded",
      "A guest uploaded payment proof for a reservation.",
      rows,
      resolveSitePath("/bookings"),
      proofViewUrl
        ? {
            label: "View Receipt Proof",
            url: proofViewUrl,
          }
        : undefined,
    ),
  });
}
