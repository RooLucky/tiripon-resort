import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { BookingsTable } from "@/components/admin/bookings-table";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const;

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

function getBookingDayRange(dateKey: string, timezoneOffset = -480) {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const utcMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const utcNextMidnight = new Date(
    Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0),
  );
  const start = new Date(utcMidnight.getTime() + timezoneOffset * 60 * 1000);
  const end = new Date(utcNextMidnight.getTime() + timezoneOffset * 60 * 1000);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return { start, end };
}

function getPageHref(page: number, size: number, checkInDate?: string) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (checkInDate) {
    params.set("checkInDate", checkInDate);
  }

  return `/bookings?${params.toString()}`;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string | string[];
    size?: string | string[];
    checkInDate?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const rawSize = Array.isArray(params.size) ? params.size[0] : params.size;
  const rawCheckInDate = Array.isArray(params.checkInDate)
    ? params.checkInDate[0]
    : params.checkInDate;
  const checkInDate =
    rawCheckInDate && /^\d{4}-\d{2}-\d{2}$/.test(rawCheckInDate)
      ? rawCheckInDate
      : "";
  const checkInRange = checkInDate ? getBookingDayRange(checkInDate) : null;
  const bookingWhere = {
    deleted: false,
    ...(checkInRange
      ? {
          checkIn: {
            gte: checkInRange.start,
            lt: checkInRange.end,
          },
        }
      : {}),
  };
  const currentPage = Math.max(Number(rawPage ?? "1") || 1, 1);
  const selectedSize = PAGE_SIZE_OPTIONS.includes(Number(rawSize) as never)
    ? Number(rawSize)
    : 10;
  const skip = (currentPage - 1) * selectedSize;

  const [bookings, totalBookings] = await Promise.all([
    prisma.booking.findMany({
      orderBy: {
        createdAt: "desc",
      },
      where: bookingWhere,
      skip,
      take: selectedSize,
      include: {
        receipt: true,
      },
    }),
    prisma.booking.count({
      where: bookingWhere,
    }),
  ]);
  const cottageIds = bookings
    .map((booking) => booking.selected_cottage_id)
    .filter((id): id is string => Boolean(id));
  const cottages = await prisma.cottages.findMany({
    where: { id: { in: cottageIds } },
  });
  const cottageById = new Map(cottages.map((cottage) => [cottage.id, cottage]));

  const pageCount = Math.max(Math.ceil(totalBookings / selectedSize), 1);
  const rows = bookings.map((booking) => ({
    id: booking.id,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    numberOfAdults: booking.number_of_adult,
    numberOfKids: booking.number_of_kids,
    totalPrice: formatCurrency(booking.total_price),
    summary: booking.summary,
    checkIn: formatDate(booking.checkIn),
    checkOut: formatDate(booking.checkOut),
    createdAt: formatDate(booking.createdAt),
    createdAtIso: booking.createdAt.toISOString(),
    cottages:
      booking.selected_cottage_id &&
      cottageById.has(booking.selected_cottage_id)
        ? [
            (() => {
              const cottage = cottageById.get(booking.selected_cottage_id)!;
              return {
                id: cottage.id,
                name: cottage.name,
                description: cottage.description,
                price: formatCurrency(cottage.price),
              };
            })(),
          ]
        : [],
    receipt: booking.receipt
      ? {
          id: booking.receipt.id,
          status: booking.receipt.status,
          receiptConfirmation: Boolean(booking.receipt.receipt_confirmation),
          downPaymentAmount: formatCurrency(booking.receipt.downPaymentAmount),
          proofFileName: booking.receipt.proofFileName,
          proofMimeType: booking.receipt.proofMimeType,
          proofViewUrl: booking.receipt.proofViewUrl,
          proofUploadedAt: formatDate(booking.receipt.proofUploadedAt),
          paidAt: formatDate(booking.receipt.paidAt),
          createdAt: formatDate(booking.receipt.createdAt),
        }
      : null,
  }));

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-7">
      <div className="rounded-xl md:block hidden border border-border/80 bg-card/80 p-5 shadow-sm">
        <h1 className="text-3xl leading-tight text-brown">Bookings</h1>
        <p className="text-sm text-muted-foreground">
          Manage reservation requests, receipt proof, and connected cottages.
        </p>
      </div>

      <BookingsTable
        bookings={rows}
        currentPage={currentPage}
        pageSize={selectedSize}
        checkInDate={checkInDate}
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing {bookings.length === 0 ? 0 : skip + 1}-
          {Math.min(skip + bookings.length, totalBookings)} of {totalBookings}
        </p>
        <div className="flex items-center gap-2">
          <span>Show</span>
          <div className="flex items-center gap-1">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <PaginationLink
                key={size}
                href={getPageHref(1, size, checkInDate)}
                isActive={size === selectedSize}
              >
                {size}
              </PaginationLink>
            ))}
          </div>
        </div>
        <Pagination className="mx-0 w-auto justify-start sm:justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={getPageHref(
                  Math.max(currentPage - 1, 1),
                  selectedSize,
                  checkInDate,
                )}
                aria-disabled={currentPage <= 1}
                className={
                  currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
            {Array.from({ length: pageCount }, (_, index) => index + 1)
              .filter(
                (page) =>
                  page === 1 ||
                  page === pageCount ||
                  Math.abs(page - currentPage) <= 1,
              )
              .map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href={getPageHref(page, selectedSize, checkInDate)}
                    isActive={page === currentPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
            <PaginationItem>
              <PaginationNext
                href={getPageHref(
                  Math.min(currentPage + 1, pageCount),
                  selectedSize,
                  checkInDate,
                )}
                aria-disabled={currentPage >= pageCount}
                className={
                  currentPage >= pageCount
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </main>
  );
}
