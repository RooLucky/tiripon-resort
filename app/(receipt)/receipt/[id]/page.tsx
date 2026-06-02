import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GcashPaymentNumber } from "@/components/receipt/GcashPaymentNumber";
import { ReceiptUploadForm } from "@/components/receipt/ReceiptUploadForm";

const RECEIPT_LINK_TTL_MS = 30 * 60 * 1000;
const GCASH_PAYMENT_NUMBER = "09298810578";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

function formatDate(value: Date | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const receiptId = id.trim();

  if (!receiptId) {
    notFound();
  }

  const receipt = await prisma.receipt.findUnique({
    where: {
      id: receiptId,
    },
    include: {
      booking: true,
    },
  });

  if (!receipt) {
    notFound();
  }

  const [databaseTime] = await prisma.$queryRaw<Array<{ now: Date }>>`
    SELECT NOW() as now
  `;
  const expiresAt = new Date(receipt.createdAt.getTime() + RECEIPT_LINK_TTL_MS);
  const isExpired = databaseTime.now.getTime() > expiresAt.getTime();

  if (isExpired && receipt.status !== "paid") {
    notFound();
  }

  const isPaid = receipt.status === "paid";
  const fullPaymentAmount = receipt.booking.total_price;
  const halfPaymentAmount = receipt.booking.total_price * 0.5;
  const remainingBalance = Math.max(
    receipt.fullyPaid ? 0 : receipt.booking.total_price - receipt.downPaymentAmount,
    0,
  );
  const selectedCottage = receipt.booking.selected_cottage_id
    ? await prisma.cottages.findUnique({
        where: { id: receipt.booking.selected_cottage_id },
      })
    : null;

  return (
    <main className="min-h-dvh bg-cream px-3 py-4 text-brown sm:px-4 sm:py-8 md:px-[5dvw] md:py-16">
      <section className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-brown/10 md:grid-cols-[1fr_0.8fr] md:rounded-none">
        <div className="p-5 sm:p-6 md:p-10">
          <p className="font-googlesansflex text-xs font-semibold uppercase tracking-wide text-brown/65 sm:text-sm">
            Reservation Receipt
          </p>
          <h1 className="mt-3 max-w-[11ch] font-heading text-4xl leading-[0.95] sm:text-5xl md:max-w-none md:text-7xl">
            Payment Confirmation
          </h1>
          <p className="mt-4 inline-flex rounded-full bg-tan px-4 py-2 font-googlesansflex text-sm font-semibold text-brown md:rounded-none">
            GCash transaction only
          </p>

          <div className="mt-7 grid gap-5 font-googlesansflex text-sm sm:mt-8 md:text-base">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-brown/60">
                Guest
              </span>
              <p className="mt-1 break-words text-lg font-semibold sm:text-xl">
                {receipt.booking.name}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-brown/60">
                Check in
              </span>
              <p className="mt-1">{formatDate(receipt.booking.checkIn)}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-brown/60">
                Cottages
              </span>
              <ul className="mt-2 grid gap-2">
                {selectedCottage ? (
                  <li className="grid gap-1 border-b border-brown/10 pb-2 sm:grid-cols-[1fr_auto] sm:gap-4">
                    <span className="break-words">{selectedCottage.name}</span>
                    <span className="font-semibold">
                      {formatCurrency(selectedCottage.price)}
                    </span>
                  </li>
                ) : (
                  <li className="text-brown/70">No cottage selected.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-brown/10 bg-cream/70 p-4 font-googlesansflex shadow-sm md:rounded-none md:p-5">
            <div className="flex flex-col gap-2 border-b border-brown/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brown/60">
                  Payment Summary
                </p>
                <p className="mt-1 text-sm leading-6 text-brown/70">
                  Review the reservation amount and submitted payment details.
                </p>
              </div>
              <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brown shadow-sm md:rounded-none">
                {receipt.status}
              </span>
            </div>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-white p-3 md:rounded-none">
                <dt className="text-xs font-semibold uppercase tracking-wide text-brown/55">
                  Booking total
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {formatCurrency(receipt.booking.total_price)}
                </dd>
              </div>
              <div className="rounded-xl bg-white p-3 md:rounded-none">
                <dt className="text-xs font-semibold uppercase tracking-wide text-brown/55">
                  Payment type
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {isPaid
                    ? receipt.fullyPaid
                      ? "Full payment"
                      : "50% payment"
                    : "Pending"}
                </dd>
              </div>
              <div className="rounded-xl bg-white p-3 md:rounded-none">
                <dt className="text-xs font-semibold uppercase tracking-wide text-brown/55">
                  50% payment option
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {formatCurrency(halfPaymentAmount)}
                </dd>
              </div>
              <div className="rounded-xl bg-white p-3 md:rounded-none">
                <dt className="text-xs font-semibold uppercase tracking-wide text-brown/55">
                  Full payment option
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {formatCurrency(fullPaymentAmount)}
                </dd>
              </div>
              <div className="rounded-xl bg-white p-3 md:rounded-none">
                <dt className="text-xs font-semibold uppercase tracking-wide text-brown/55">
                  Remaining balance
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {formatCurrency(remainingBalance)}
                </dd>
              </div>
              <div className="rounded-xl bg-white p-3 md:rounded-none">
                <dt className="text-xs font-semibold uppercase tracking-wide text-brown/55">
                  Upload link expires
                </dt>
                <dd className="mt-1 break-words font-semibold">
                  {formatDate(expiresAt)}
                </dd>
              </div>
              {receipt.proofFileName && (
                <div className="rounded-xl bg-white p-3 sm:col-span-2 md:rounded-none">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-brown/55">
                    Uploaded file
                  </dt>
                  <dd className="mt-1 break-words font-semibold">
                    {receipt.proofFileName}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-full bg-brown px-6 font-googlesansflex text-sm font-semibold text-cream sm:w-auto"
          >
            Back to resort
          </Link>
        </div>

        <aside className="flex flex-col justify-between bg-tan p-5 text-brown sm:p-6 md:p-10">
          <div>
            <p className="font-googlesansflex text-xs font-semibold uppercase tracking-wide sm:text-sm">
              Payment starts at
            </p>
            <p className="mt-3 break-words font-heading text-4xl leading-none sm:text-5xl">
              {formatCurrency(halfPaymentAmount)}
            </p>
            <p className="mt-3 font-googlesansflex text-sm leading-6">
              You can pay the 50% down payment or the full reservation total.
              This is a GCash only transaction. Please send payment using the
              QR code below, then upload your receipt.
            </p>
          </div>

          <div className="mx-auto mt-6 w-full max-w-80 rounded-xl bg-cream p-3 sm:mt-8 sm:p-4 md:max-w-none md:rounded-none">
            <Image
              src="/images/qr.jpg"
              alt="Payment QR code"
              width={640}
              height={640}
              className="h-auto w-full rounded-lg md:rounded-none"
            />
          </div>
          <GcashPaymentNumber number={GCASH_PAYMENT_NUMBER} />

          <ReceiptUploadForm
            receiptId={receipt.id}
            disabled={isExpired}
            isPaid={isPaid}
            downPaymentAmount={halfPaymentAmount}
            fullPaymentAmount={fullPaymentAmount}
            remainingBalance={Math.max(fullPaymentAmount - halfPaymentAmount, 0)}
          />
        </aside>
      </section>
    </main>
  );
}
