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

          <div className="mt-6 grid gap-2 rounded-xl bg-cream/55 p-4 font-googlesansflex text-sm md:rounded-none md:bg-transparent md:p-0">
            <p className="break-words">
              Status:{" "}
              <span className="font-semibold capitalize">{receipt.status}</span>
            </p>
            <p className="break-words">
              Booking total: {formatCurrency(receipt.booking.total_price)}
            </p>
            {isPaid && (
              <p className="break-words">
                Payment type: {receipt.fullyPaid ? "Full payment" : "50% payment"}
              </p>
            )}
            <p className="break-words">
              50% payment option: {formatCurrency(halfPaymentAmount)}
            </p>
            <p className="break-words">
              Full payment option: {formatCurrency(fullPaymentAmount)}
            </p>
            <p className="break-words">
              Remaining balance: {formatCurrency(remainingBalance)}
            </p>
            <p className="break-words">Upload link expires: {formatDate(expiresAt)}</p>
            {receipt.proofFileName && (
              <p className="break-words">Uploaded file: {receipt.proofFileName}</p>
            )}
          </div>

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
