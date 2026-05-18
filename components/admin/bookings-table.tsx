"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  Eye,
  MoreHorizontal,
  ReceiptText,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import {
  confirmReceipt,
  deleteBooking,
} from "@/app/(private)/bookings/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
};

export function BookingsTable({
  bookings,
  currentPage = 1,
  pageSize = 10,
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
  const [proofToView, setProofToView] = useState<{
    name: string;
    url: string;
    mimeType: string | null;
  } | null>(null);
  const [proofZoom, setProofZoom] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [isRealtimeSubscribed, setIsRealtimeSubscribed] = useState(false);
  const [rows, setRows] = useState<BookingRow[]>(bookings);
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
    const refreshRows = async () => {
      try {
        const response = await fetch(
          `/api/bookings?page=${currentPage}&size=${pageSize}`,
          {
            cache: "no-store",
          },
        );

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
  }, [currentPage, supabase]);

  useEffect(() => {
    const interval = setInterval(
      () => {
        void fetch(`/api/bookings?page=${currentPage}&size=${pageSize}`, {
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
  }, [currentPage, isRealtimeSubscribed, pageSize]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-6">
        <div className="flex gap-2 items-center">
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
        </div>
        <div className="flex gap-2 items-center">
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
        </div>
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
                className="rounded-lg border bg-cream/30 p-4"
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
