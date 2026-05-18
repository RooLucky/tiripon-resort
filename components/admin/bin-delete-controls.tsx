"use client";

import { useState, useTransition } from "react";
import {
  bulkPermanentlyDeleteBookings,
  permanentlyDeleteBooking,
} from "@/app/(private)/bookings/actions";
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
import { Trash } from "lucide-react";
import { Button } from "../ui/button";

export function SingleDeleteControl({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center justify-center text-destructive bg-destructive/20 rounded-md px-3 text-sm font-medium text-destructive-foreground"
      >
        <Trash className="h-4 w-4 text-destructive cursor-pointer" />
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm permanent delete</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  await permanentlyDeleteBooking(bookingId);
                  setOpen(false);
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

export function BulkDeleteControl({ bookingIds }: { bookingIds: string[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {bookingIds.map((id) => (
        <label
          key={id}
          className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs"
        >
          <input
            type="checkbox"
            checked={selected.includes(id)}
            onChange={(e) =>
              setSelected((prev) =>
                e.target.checked ? [...prev, id] : prev.filter((x) => x !== id),
              )
            }
          />
          #{id}
        </label>
      ))}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center rounded-md bg-destructive px-3 text-sm font-medium text-destructive-foreground"
      >
        Bulk Delete Selected
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
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
                  setOpen(false);
                  setSelected([]);
                });
              }}
            >
              Confirm Bulk Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
