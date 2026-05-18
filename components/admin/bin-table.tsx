"use client";

import { useState, useTransition } from "react";
import { SingleDeleteControl } from "@/components/admin/bin-delete-controls";
import { BinToolbar } from "@/components/admin/bin-toolbar";
import { bulkPermanentlyDeleteBookings } from "@/app/(private)/bookings/actions";
import { MoreHorizontal, Eye, Trash2 } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Row = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  deletedAt: string | null;
  createdAt: string;
  receiptStatus: string | null;
  summary: string | null;
  checkIn: string;
  checkOut: string;
  numberOfAdults: string;
  numberOfKids: string;
  totalPrice: string;
};

export function BinTable({
  rows,
  filter,
  selectedSize,
}: {
  rows: Row[];
  filter: "all" | "paid" | "unpaid";
  selectedSize: number;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [detailsRow, setDetailsRow] = useState<Row | null>(null);
  const [isPending, startTransition] = useTransition();
  const allSelected = rows.length > 0 && selected.length === rows.length;

  return (
    <>
      <BinToolbar
        filter={filter}
        selectedSize={selectedSize}
        selectedCount={selected.length}
        onBulkDelete={() => setConfirmOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {rows.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          No deleted bookings found for this filter.
        </div>
      ) : viewMode === "table" ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="h-12 px-4 text-left">Select</th>
                <th className="h-12 px-4 text-left">Guest</th>
                <th className="h-12 px-4 text-left">Deleted</th>
                <th className="h-12 px-4 text-left">Receipt</th>
                <th className="h-12 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4">
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked ? rows.map((r) => r.id) : [],
                        )
                      }
                    />
                    Select All
                  </label>
                </td>
                <td className="p-4 text-xs text-muted-foreground" colSpan={4}>
                  Select bookings to bulk delete.
                </td>
              </tr>
              {rows.map((booking) => (
                <tr key={booking.id} className="border-b last:border-b-0">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(booking.id)}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked
                            ? [...new Set([...prev, booking.id])]
                            : prev.filter((x) => x !== booking.id),
                        )
                      }
                    />
                  </td>
                  <td className="p-4">
                    <p className="font-medium">{booking.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.email ?? booking.phone ?? "No contact"}
                    </p>
                  </td>
                  <td className="p-4">
                    {booking.deletedAt ?? booking.createdAt}
                  </td>
                  <td className="p-4">{booking.receiptStatus ?? "missing"}</td>
                  <td className="p-4 text-right">
                    <SingleDeleteControl bookingId={booking.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-3">
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) =>
                  setSelected(e.target.checked ? rows.map((r) => r.id) : [])
                }
              />
              Select All
            </label>
          </div>
          {rows.map((booking) => (
            <div key={booking.id} className="rounded-lg border bg-cream/30 p-4">
              <div className="flex items-start justify-between">
                <label className="inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={selected.includes(booking.id)}
                    onChange={(e) =>
                      setSelected((prev) =>
                        e.target.checked
                          ? [...new Set([...prev, booking.id])]
                          : prev.filter((x) => x !== booking.id),
                      )
                    }
                  />
                  Select
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal />
                      <span className="sr-only">Open actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onSelect={() => setDetailsRow(booking)}>
                      <Eye />
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setDeleteTarget(booking.id)}
                    >
                      <Trash2 />
                      Delete permanently
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="mt-2 font-medium">{booking.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {booking.email ?? booking.phone ?? "No contact"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Receipt: {booking.receiptStatus ?? "missing"}
              </p>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm bulk permanent delete</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all selected bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending || selected.length === 0}
              onClick={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  await bulkPermanentlyDeleteBookings(selected);
                  setConfirmOpen(false);
                  setSelected([]);
                });
              }}
            >
              Confirm Bulk Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(detailsRow)}
        onOpenChange={(open) => !open && setDetailsRow(null)}
      >
        <DialogContent>
          {detailsRow && (
            <>
              <DialogHeader>
                <DialogTitle>Booking #{detailsRow.id}</DialogTitle>
                <DialogDescription>
                  Deleted at {detailsRow.deletedAt ?? detailsRow.createdAt}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Guest:</span> {detailsRow.name}
                </p>
                <p>
                  <span className="font-medium">Contact:</span>{" "}
                  {detailsRow.email ?? detailsRow.phone ?? "No contact"}
                </p>
                <p>
                  <span className="font-medium">Receipt:</span>{" "}
                  {detailsRow.receiptStatus ?? "missing"}
                </p>
                <p>
                  <span className="font-medium">Check in:</span>{" "}
                  {detailsRow.checkIn}
                </p>
                <p>
                  <span className="font-medium">Check out:</span>{" "}
                  {detailsRow.checkOut}
                </p>
                <p>
                  <span className="font-medium">Guests:</span>{" "}
                  {detailsRow.numberOfAdults} adults, {detailsRow.numberOfKids} kids
                </p>
                <p>
                  <span className="font-medium">Total:</span>{" "}
                  {detailsRow.totalPrice}
                </p>
                <p>
                  <span className="font-medium">Summary:</span>{" "}
                  {detailsRow.summary ?? "-"}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending || deleteTarget === null}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget === null) return;
                startTransition(async () => {
                  await bulkPermanentlyDeleteBookings([deleteTarget]);
                  setDeleteTarget(null);
                });
              }}
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
