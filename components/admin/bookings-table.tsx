"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import {
  Ban,
  CalendarDays,
  CheckCircle2,
  Eye,
  Filter,
  MoreHorizontal,
  ReceiptText,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import {
  confirmReceipt,
  denyReceipt,
  deleteBooking,
} from "@/app/(private)/bookings/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

type BookingRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  numberOfAdults: string;
  numberOfKids: string;
  totalPrice: string;
  summary: string | null;
  checkIn: string;
  checkOut: string;
  createdAt: string;
  createdAtIso: string;
  cottages: Array<{
    id: string;
    name: string;
    description: string;
    price: string;
  }>;
  receipt: {
    id: string;
    status: string;
    receiptConfirmation: boolean;
    downPaymentAmount: string;
    proofFileName: string | null;
    proofMimeType: string | null;
    proofViewUrl: string | null;
    proofUploadedAt: string;
    paidAt: string;
    createdAt: string;
  } | null;
};

type BookingsTableProps = {
  bookings: BookingRow[];
  currentPage?: number;
  pageSize?: number;
  checkInDate?: string;
};

function dateFromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return undefined;
  }

  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function dateKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index),
  label: new Date(2026, index, 1).toLocaleString("en-PH", {
    month: "short",
  }),
}));

const YEAR_OPTIONS = Array.from({ length: 7 }, (_, index) => 2020 + index);

export function BookingsTable({
  bookings,
  currentPage = 1,
  pageSize = 10,
  checkInDate = "",
}: BookingsTableProps) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "unpaid_overdue">(
    "all",
  );
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(
    null,
  );
  const [bookingToDelete, setBookingToDelete] = useState<BookingRow | null>(
    null,
  );
  const [receiptToConfirm, setReceiptToConfirm] = useState<BookingRow | null>(
    null,
  );
  const [receiptToDeny, setReceiptToDeny] = useState<BookingRow | null>(null);
  const [proofToView, setProofToView] = useState<{
    name: string;
    url: string;
    mimeType: string | null;
  } | null>(null);
  const [proofZoom, setProofZoom] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [draftCheckInDate, setDraftCheckInDate] = useState(checkInDate);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [availabilityDate, setAvailabilityDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [availabilityRows, setAvailabilityRows] = useState<
    Array<{
      id: string;
      name: string;
      capacity: string;
      quantity: number;
      reserved: number;
      remaining: number;
    }>
  >([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [isRealtimeSubscribed, setIsRealtimeSubscribed] = useState(false);
  const [rows, setRows] = useState<BookingRow[]>(bookings);
  const activeDateFilterLabel = useMemo(() => {
    if (!checkInDate) return "";
    const [year, month, day] = checkInDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (Number.isNaN(date.getTime())) return checkInDate;

    return new Intl.DateTimeFormat("en-PH", {
      dateStyle: "medium",
    }).format(date);
  }, [checkInDate]);
  const getBookingsApiUrl = useMemo(() => {
    return () => {
      const timezoneOffset =
        typeof window !== "undefined" ? new Date().getTimezoneOffset() : -480;
      const params = new URLSearchParams({
        page: String(currentPage),
        size: String(pageSize),
        timezoneOffset: String(timezoneOffset),
      });

      if (checkInDate) {
        params.set("checkInDate", checkInDate);
      }

      return `/api/bookings?${params.toString()}`;
    };
  }, [checkInDate, currentPage, pageSize]);
  const filteredRows = useMemo(() => {
    if (paymentFilter === "all") return rows;

    const now = Date.now();
    const thirtyMinutesMs = 30 * 60 * 1000;

    return rows.filter((booking) => {
      const isPaid = booking.receipt?.status === "paid";
      if (isPaid) return false;

      const createdAtMs = new Date(booking.createdAtIso).getTime();
      if (Number.isNaN(createdAtMs)) return false;

      return now - createdAtMs >= thirtyMinutesMs;
    });
  }, [paymentFilter, rows]);
  const allSelected =
    filteredRows.length > 0 && selectedIds.length === filteredRows.length;

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("bookings:view-mode")
        : null;

    if (saved === "table" || saved === "cards") {
      setViewMode(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("bookings:view-mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    setRows(bookings);
  }, [bookings]);

  useEffect(() => {
    setDraftCheckInDate(checkInDate);
  }, [checkInDate]);

  useEffect(() => {
    const refreshRows = async () => {
      try {
        const response = await fetch(getBookingsApiUrl(), {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = (await response.json()) as { rows?: BookingRow[] };

        if (Array.isArray(data.rows)) {
          setRows(data.rows);
        }
      } catch {
        // Keep existing rows if fetch fails.
      }
    };

    const channel = supabase
      .channel("admin-bookings-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        refreshRows,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "receipts" },
        refreshRows,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cottages" },
        refreshRows,
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsRealtimeSubscribed(true);
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setIsRealtimeSubscribed(false);
          console.error("Supabase realtime status:", status);
        }
      });

    return () => {
      setIsRealtimeSubscribed(false);
      void supabase.removeChannel(channel);
    };
  }, [currentPage, getBookingsApiUrl, supabase]);

  useEffect(() => {
    const interval = setInterval(
      () => {
        void fetch(getBookingsApiUrl(), {
          cache: "no-store",
        })
          .then((response) => (response.ok ? response.json() : null))
          .then((data: { rows?: BookingRow[] } | null) => {
            if (data?.rows) setRows(data.rows);
          })
          .catch(() => null);
      },
      isRealtimeSubscribed ? 30000 : 10000,
    );

    return () => clearInterval(interval);
  }, [getBookingsApiUrl, isRealtimeSubscribed]);

  useEffect(() => {
    if (!availabilityOpen) return;
    setIsLoadingAvailability(true);
    const timezoneOffset = new Date().getTimezoneOffset();
    void Promise.all([
      fetch("/api/cottages", { cache: "no-store" }).then((response) =>
        response.ok ? response.json() : null,
      ),
      fetch(
        `/api/bookings?availabilityDate=${availabilityDate}&timezoneOffset=${timezoneOffset}`,
        { cache: "no-store" },
      ).then((response) => (response.ok ? response.json() : null)),
    ])
      .then(([cottageData, availabilityData]) => {
        const cottages = Array.isArray(cottageData?.cottages)
          ? (cottageData.cottages as Array<{
              id: string;
              name: string;
              capacity: string;
              quantity?: number | null;
            }>)
          : [];
        const reservedByCottageId =
          availabilityData?.reservedByCottageId &&
          typeof availabilityData.reservedByCottageId === "object"
            ? (availabilityData.reservedByCottageId as Record<string, number>)
            : {};
        setAvailabilityRows(
          cottages.map((cottage) => {
            const quantity = cottage.quantity ?? 1;
            const reserved = reservedByCottageId[cottage.id] ?? 0;
            return {
              id: cottage.id,
              name: cottage.name,
              capacity: cottage.capacity,
              quantity,
              reserved,
              remaining: Math.max(quantity - reserved, 0),
            };
          }),
        );
      })
      .finally(() => setIsLoadingAvailability(false));
  }, [availabilityDate, availabilityOpen]);

  const applyDateFilter = () => {
    const params = new URLSearchParams({
      page: "1",
      size: String(pageSize),
    });

    if (draftCheckInDate) {
      params.set("checkInDate", draftCheckInDate);
    }

    window.location.assign(`/bookings?${params.toString()}`);
  };

  const clearDateFilter = () => {
    window.location.assign(`/bookings?page=1&size=${pageSize}`);
  };
  const draftDate = dateFromDateKey(draftCheckInDate) ?? new Date();
  const setDraftMonth = (month: number) => {
    const nextDate = new Date(draftDate);
    nextDate.setMonth(month);
    setDraftCheckInDate(dateKeyFromDate(nextDate));
  };
  const setDraftYear = (year: number) => {
    const nextDate = new Date(draftDate);
    nextDate.setFullYear(year);
    setDraftCheckInDate(dateKeyFromDate(nextDate));
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-6">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {checkInDate && (
            <Badge variant="outline" className="gap-1">
              <CalendarDays className="size-3" />
              {activeDateFilterLabel}
            </Badge>
          )}
          {checkInDate && (
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              onClick={clearDateFilter}
            >
              <X />
              <span className="sr-only">Clear check-in date filter</span>
            </Button>
          )}
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) =>
                setSelectedIds(
                  event.target.checked ? filteredRows.map((row) => row.id) : [],
                )
              }
            />
            Select All
          </label>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isPending || selectedIds.length === 0}
            onClick={() => {
              startTransition(() => {
                void Promise.all(
                  selectedIds.map((bookingId) => deleteBooking(bookingId)),
                ).then(() => {
                  setSelectedIds([]);
                  setRows((current) =>
                    current.filter((row) => !selectedIds.includes(row.id)),
                  );
                });
              });
            }}
          >
            Bulk Delete ({selectedIds.length})
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="icon-sm" variant="outline">
                <MoreHorizontal />
                <span className="sr-only">Open booking view options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => setViewMode("table")}>
                Table {viewMode === "table" ? "•" : ""}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setViewMode("cards")}>
                Cards {viewMode === "cards" ? "•" : ""}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setDateFilterOpen(true)}>
                <Filter />
                Check-in date
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAvailabilityOpen(true)}>
                Available Cottages
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setPaymentFilter("all")}>
                All {paymentFilter === "all" ? "•" : ""}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setPaymentFilter("unpaid_overdue")}
              >
                Unpaid 30m+ {paymentFilter === "unpaid_overdue" ? "•" : ""}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* <div className="flex gap-2 items-center">
          <Button
            type="button"
            size="sm"
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
          >
            Table
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === "cards" ? "default" : "outline"}
            onClick={() => setViewMode("cards")}
          >
            Cards
          </Button>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            type="button"
            size="sm"
            variant={paymentFilter === "all" ? "default" : "outline"}
            onClick={() => setPaymentFilter("all")}
          >
            All
          </Button>
          <Button
            type="button"
            size="sm"
            variant={paymentFilter === "unpaid_overdue" ? "default" : "outline"}
            onClick={() => setPaymentFilter("unpaid_overdue")}
          >
            Unpaid 30m+
          </Button>
        </div> */}
      </div>

      {viewMode === "table" ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Select</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Cottages</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-28 text-center text-muted-foreground"
                  >
                    No bookings found for this filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(booking.id)}
                        onChange={(event) =>
                          setSelectedIds((prev) =>
                            event.target.checked
                              ? [...new Set([...prev, booking.id])]
                              : prev.filter((id) => id !== booking.id),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{booking.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {booking.email ?? booking.phone ?? "No contact"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{booking.checkIn}</div>
                      <div className="text-xs text-muted-foreground">
                        to {booking.checkOut}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-64">
                      <div className="truncate">
                        {booking.cottages
                          .map((cottage) => cottage.name)
                          .join(", ")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {booking.cottages.length} selected
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.numberOfAdults} adults, {booking.numberOfKids}{" "}
                      kids
                    </TableCell>
                    <TableCell className="font-medium">
                      {booking.totalPrice}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <Badge
                          variant={
                            booking.receipt?.status === "paid"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {booking.receipt?.status ?? "missing"}
                        </Badge>
                        {booking.receipt && (
                          <Badge
                            variant={
                              booking.receipt.receiptConfirmation
                                ? "outline"
                                : "secondary"
                            }
                          >
                            {booking.receipt.receiptConfirmation
                              ? "confirmed"
                              : "unconfirmed"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal />
                            <span className="sr-only">Open row actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onSelect={() => setSelectedBooking(booking)}
                          >
                            <Eye />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={
                              !booking.receipt ||
                              booking.receipt.status !== "paid" ||
                              booking.receipt.receiptConfirmation
                            }
                            onSelect={() => setReceiptToConfirm(booking)}
                          >
                            <CheckCircle2 />
                            Receipt confirmation
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={
                              !booking.receipt ||
                              booking.receipt.status === "denied"
                            }
                            onSelect={() => setReceiptToDeny(booking)}
                          >
                            <Ban />
                            Deny receipt
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setBookingToDelete(booking)}
                          >
                            <Trash2 />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {filteredRows.length === 0 ? (
            <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
              No bookings found for this filter.
            </div>
          ) : (
            filteredRows.map((booking) => (
              <div
                key={booking.id}
                className="rounded-lg border bg-background p-4"
              >
                <label className="inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(booking.id)}
                    onChange={(event) =>
                      setSelectedIds((prev) =>
                        event.target.checked
                          ? [...new Set([...prev, booking.id])]
                          : prev.filter((id) => id !== booking.id),
                      )
                    }
                  />
                  Select
                </label>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{booking.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.email ?? booking.phone ?? "No contact"}
                    </p>
                  </div>
                  <Badge
                    variant={
                      booking.receipt?.status === "paid"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {booking.receipt?.status ?? "missing"}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-1 text-sm">
                  <p>{booking.checkIn}</p>
                  <p className="text-muted-foreground">to {booking.checkOut}</p>
                  <p>
                    {booking.numberOfAdults} adults, {booking.numberOfKids} kids
                  </p>
                  <p className="font-medium">{booking.totalPrice}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <Eye />
                    View
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={
                      !booking.receipt ||
                      booking.receipt.status !== "paid" ||
                      booking.receipt.receiptConfirmation
                    }
                    onClick={() => setReceiptToConfirm(booking)}
                  >
                    <CheckCircle2 />
                    Confirm
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={
                      !booking.receipt || booking.receipt.status === "denied"
                    }
                    onClick={() => setReceiptToDeny(booking)}
                  >
                    <Trash2 />
                    Deny
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setBookingToDelete(booking)}
                  >
                    <Trash2 />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Dialog
        open={Boolean(selectedBooking)}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      >
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle>Booking #{selectedBooking.id}</DialogTitle>
                <DialogDescription>
                  Created {selectedBooking.createdAt}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-5">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <Detail label="Guest" value={selectedBooking.name} />
                  <Detail
                    label="Contact"
                    value={
                      selectedBooking.email ?? selectedBooking.phone ?? "-"
                    }
                  />
                  <Detail label="Check in" value={selectedBooking.checkIn} />
                  <Detail label="Check out" value={selectedBooking.checkOut} />
                  <Detail
                    label="Guests"
                    value={`${selectedBooking.numberOfAdults} adults, ${selectedBooking.numberOfKids} kids`}
                  />
                  <Detail label="Total" value={selectedBooking.totalPrice} />
                </dl>

                <section>
                  <h3 className="text-sm font-medium">Cottages</h3>
                  <div className="mt-2 divide-y rounded-lg border">
                    {selectedBooking.cottages.map((cottage) => (
                      <div
                        key={cottage.id}
                        className="flex items-start justify-between gap-4 p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">{cottage.name}</p>
                          <p className="mt-1 text-muted-foreground">
                            {cottage.description}
                          </p>
                        </div>
                        <span className="font-medium">{cottage.price}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-medium">Receipt</h3>
                  <div className="mt-2 grid gap-3 rounded-lg border p-3 text-sm sm:grid-cols-2">
                    {selectedBooking.receipt ? (
                      <>
                        <Detail
                          label="Status"
                          value={selectedBooking.receipt.status}
                        />
                        <Detail
                          label="Admin confirmation"
                          value={
                            selectedBooking.receipt.receiptConfirmation
                              ? "Confirmed"
                              : "Unconfirmed"
                          }
                        />
                        <Detail
                          label="Down payment"
                          value={selectedBooking.receipt.downPaymentAmount}
                        />
                        <Detail
                          label="Uploaded"
                          value={selectedBooking.receipt.proofUploadedAt}
                        />
                        <Detail
                          label="Paid at"
                          value={selectedBooking.receipt.paidAt}
                        />
                        <div className="sm:col-span-2">
                          {selectedBooking.receipt.proofViewUrl ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (!selectedBooking.receipt?.proofViewUrl) {
                                  return;
                                }

                                setProofToView({
                                  name:
                                    selectedBooking.receipt.proofFileName ??
                                    `Receipt ${selectedBooking.receipt.id}`,
                                  url: selectedBooking.receipt.proofViewUrl,
                                  mimeType:
                                    selectedBooking.receipt.proofMimeType,
                                });
                              }}
                            >
                              <ReceiptText />
                              Open proof
                            </Button>
                          ) : (
                            <p className="text-muted-foreground">
                              No proof uploaded.
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No receipt found.</p>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filter by check-in date</DialogTitle>
            <DialogDescription>
              Show bookings whose check-in date matches the selected day.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2 text-sm">
              <span>Check-in date</span>
              <div className="flex h-10 items-center rounded-md border bg-background px-3">
                <CalendarDays className="mr-2 size-4" />
                {draftCheckInDate
                  ? format(
                      dateFromDateKey(draftCheckInDate) ?? new Date(),
                      "PPP",
                    )
                  : "Select month, day, and year"}
              </div>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <div className="mb-3 grid grid-cols-2 gap-2">
                <Select
                  value={String(draftDate.getMonth())}
                  onValueChange={(value) => setDraftMonth(Number(value))}
                >
                  <SelectTrigger className="h-10 w-full rounded-md bg-background">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent
                    className="z-[160]"
                    position="popper"
                    viewportClassName="h-44"
                  >
                    {MONTH_OPTIONS.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={String(draftDate.getFullYear())}
                  onValueChange={(value) => setDraftYear(Number(value))}
                >
                  <SelectTrigger className="h-10 w-full rounded-md bg-background">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent
                    className="z-[160]"
                    position="popper"
                    viewportClassName="h-44"
                  >
                    {YEAR_OPTIONS.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Calendar
                mode="single"
                selected={draftDate}
                month={draftDate}
                onMonthChange={(month) => {
                  setDraftCheckInDate(dateKeyFromDate(month));
                }}
                onSelect={(date) => {
                  if (date) {
                    setDraftCheckInDate(dateKeyFromDate(date));
                  }
                }}
                startMonth={new Date(2020, 0)}
                endMonth={new Date(2026, 11)}
                className="mx-auto p-0"
                initialFocus
              />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={clearDateFilter}
                disabled={!checkInDate && !draftCheckInDate}
              >
                Clear
              </Button>
              <Button
                type="button"
                onClick={applyDateFilter}
                disabled={!draftCheckInDate}
              >
                Apply filter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(proofToView)}
        onOpenChange={(open) => {
          if (!open) {
            setProofToView(null);
            setProofZoom(1);
          }
        }}
      >
        <DialogContent className="max-h-[92dvh] overflow-y-auto p-0 sm:max-w-[92vw] lg:max-w-5xl">
          {proofToView && (
            <>
              <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <DialogHeader className="min-w-0">
                  <DialogTitle>Receipt proof</DialogTitle>
                  <DialogDescription className="truncate">
                    {proofToView.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() =>
                      setProofZoom((current) => Math.max(0.5, current - 0.1))
                    }
                  >
                    <ZoomOut />
                    <span className="sr-only">Zoom out</span>
                  </Button>
                  <span className="w-14 text-center text-sm tabular-nums text-muted-foreground">
                    {Math.round(proofZoom * 100)}%
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() =>
                      setProofZoom((current) => Math.min(2.5, current + 0.1))
                    }
                  >
                    <ZoomIn />
                    <span className="sr-only">Zoom in</span>
                  </Button>
                </div>
              </div>
              <div className="h-[68dvh] overflow-auto bg-muted/40 p-3 sm:h-[72dvh] sm:p-4">
                {proofToView.mimeType === "application/pdf" ? (
                  <iframe
                    src={proofToView.url}
                    title={proofToView.name}
                    className="mx-auto h-full min-h-[60dvh] rounded-lg border bg-background"
                    style={{
                      width: `${100 / proofZoom}%`,
                      transform: `scale(${proofZoom})`,
                      transformOrigin: "top center",
                    }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={proofToView.url}
                    alt={proofToView.name}
                    className="mx-auto h-auto max-w-none rounded-lg border bg-background shadow-sm"
                    style={{
                      width: `${proofZoom * 100}%`,
                    }}
                  />
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(receiptToConfirm)}
        onOpenChange={(open) => !open && setReceiptToConfirm(null)}
      >
        <AlertDialogContent className="max-h-[90dvh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              This marks the receipt for {receiptToConfirm?.name} as manually
              confirmed by admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                isPending ||
                !receiptToConfirm?.receipt ||
                receiptToConfirm.receipt.status !== "paid" ||
                receiptToConfirm.receipt.receiptConfirmation
              }
              onClick={(event) => {
                event.preventDefault();
                if (!receiptToConfirm?.receipt) return;

                const receiptId = receiptToConfirm.receipt.id;

                startTransition(() => {
                  void confirmReceipt(receiptId).then(() => {
                    setReceiptToConfirm(null);
                  });
                });
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(receiptToDeny)}
        onOpenChange={(open) => !open && setReceiptToDeny(null)}
      >
        <AlertDialogContent className="max-h-[90dvh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Deny receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              This marks the receipt for {receiptToDeny?.name} as denied and
              will release cottage availability for this booking date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending || !receiptToDeny?.receipt}
              onClick={(event) => {
                event.preventDefault();
                if (!receiptToDeny?.receipt) return;

                const receiptId = receiptToDeny.receipt.id;

                startTransition(() => {
                  void denyReceipt(receiptId).then(() => {
                    setReceiptToDeny(null);
                  });
                });
              }}
            >
              Deny
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(bookingToDelete)}
        onOpenChange={(open) => !open && setBookingToDelete(null)}
      >
        <AlertDialogContent className="max-h-[90dvh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This moves the booking for {bookingToDelete?.name} to Recycle Bin.
              You can permanently delete it later from Bin (paid bookings
              require password and 10 days minimum).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending || !bookingToDelete}
              onClick={(event) => {
                event.preventDefault();
                if (!bookingToDelete) return;

                const bookingId = bookingToDelete.id;

                startTransition(() => {
                  void deleteBooking(bookingId).then(() => {
                    setBookingToDelete(null);
                  });
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={availabilityOpen} onOpenChange={setAvailabilityOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Available Cottages</DialogTitle>
            <DialogDescription>
              Shows cottage availability for the selected date.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <label className="grid gap-1 text-sm">
              Date
              <input
                type="date"
                value={availabilityDate}
                onChange={(event) => setAvailabilityDate(event.target.value)}
                className="h-10 rounded-md border bg-background px-3"
              />
            </label>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cottage</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Available</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAvailability ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-20 text-center text-muted-foreground"
                      >
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : availabilityRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-20 text-center text-muted-foreground"
                      >
                        No cottages found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    availabilityRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          {row.name}
                        </TableCell>
                        <TableCell>{row.capacity}</TableCell>
                        <TableCell>{row.quantity}</TableCell>
                        <TableCell>{row.reserved}</TableCell>
                        <TableCell>{row.remaining}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
