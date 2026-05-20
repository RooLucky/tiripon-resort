import { prisma } from "@/lib/prisma";
import {} from "../bookings/actions";
import { Prisma } from "@/lib/generated/prisma/client";
import { BinTable } from "@/components/admin/bin-table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

function getPageHref(
  page: number,
  size: number,
  filter: "all" | "paid" | "unpaid",
) {
  return `/bin?page=${page}&size=${size}&filter=${filter}`;
}

export default async function RecycleBin({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string | string[];
    page?: string | string[];
    size?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const rawSize = Array.isArray(params.size) ? params.size[0] : params.size;
  const rawFilter = Array.isArray(params.filter)
    ? params.filter[0]
    : params.filter;
  const currentPage = Math.max(Number(rawPage ?? "1") || 1, 1);
  const selectedSize = PAGE_SIZE_OPTIONS.includes(Number(rawSize) as never)
    ? Number(rawSize)
    : 10;
  const filterParam =
    rawFilter === "paid" || rawFilter === "unpaid" ? rawFilter : "all";
  const where: Prisma.BookingWhereInput = {
    deleted: true,
    ...(filterParam === "paid"
      ? { receipt: { is: { status: "paid" } } }
      : filterParam === "unpaid"
        ? {
            OR: [
              { receipt: { is: null } },
              { receipt: { is: { status: { not: "paid" } } } },
            ],
          }
        : {}),
  };
  const skip = (currentPage - 1) * selectedSize;
  const [deletedBookings, totalBookings] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: selectedSize,
      include: { receipt: true },
    }),
    prisma.booking.count({ where }),
  ]);
  const pageCount = Math.max(Math.ceil(totalBookings / selectedSize), 1);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-7">
      <div className="rounded-xl border border-border/80 bg-card/80 p-5 shadow-sm">
        <h1 className="text-3xl leading-tight text-brown">Recycle Bin</h1>
        <p className="text-sm text-muted-foreground">
          Soft-deleted bookings. Permanent deletion is allowed after 10 days.
        </p>
      </div>

      <BinTable
        filter={filterParam}
        selectedSize={selectedSize}
        rows={deletedBookings.map((booking) => ({
          id: booking.id,
          name: booking.name,
          email: booking.email,
          phone: booking.phone,
          deletedAt: booking.deletedAt ? booking.deletedAt.toISOString() : null,
          createdAt: booking.createdAt.toISOString(),
          receiptStatus: booking.receipt?.status ?? null,
          summary: booking.summary ?? null,
          checkIn: formatDate(booking.checkIn),
          checkOut: formatDate(booking.checkOut),
          numberOfAdults: booking.number_of_adult,
          numberOfKids: booking.number_of_kids,
          totalPrice: formatCurrency(booking.total_price),
        }))}
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing {deletedBookings.length === 0 ? 0 : skip + 1}-
          {Math.min(skip + deletedBookings.length, totalBookings)} of{" "}
          {totalBookings}
        </p>
        <div className="flex items-center gap-2">
          <span>Show</span>
          <div className="flex items-center gap-1">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <PaginationLink
                key={size}
                href={getPageHref(1, size, filterParam)}
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
                  filterParam,
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
                    href={getPageHref(page, selectedSize, filterParam)}
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
                  filterParam,
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

// Rendered by BinViewsClient.
