"use client";

import { FormEvent, useState, useTransition } from "react";
import { EllipsisVertical, Eye, Pencil, Plus, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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

type CottageRow = {
  id: string;
  name: string;
  description: string;
  price: string;
  capacity: string;
  quantity: number | null;
  imageUrl: string | null;
  createdAt: string;
};

export function CottagesTable({ cottages }: { cottages: CottageRow[] }) {
  const [rows, setRows] = useState(cottages);
  const [editing, setEditing] = useState<CottageRow | null>(null);
  const [viewing, setViewing] = useState<CottageRow | null>(null);
  const [zoom, setZoom] = useState(1);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setCapacity("");
    setQuantity("1");
    setImageFile(null);
    setEditing(null);
    setError(null);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };
  const openEdit = (row: CottageRow) => {
    startTransition(() => {
      void fetch(`/api/cottages/${row.id}`, { cache: "no-store" })
        .then(async (response) => {
          const data = (await response.json()) as {
            cottage?: {
              id: string;
              name: string;
              description: string;
              price: number;
              capacity: string;
              quantity: number | null;
              imageUrl: string | null;
            };
            error?: string;
          };
          if (!response.ok || !data.cottage) {
            throw new Error(data.error ?? "Failed to load latest cottage.");
          }
          const latest = data.cottage;
          setEditing({
            id: latest.id,
            name: latest.name,
            description: latest.description,
            price: new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(latest.price),
            capacity: latest.capacity,
            quantity: latest.quantity ?? 1,
            imageUrl: latest.imageUrl,
            createdAt: row.createdAt,
          });
          setName(latest.name);
          setDescription(latest.description);
          setPrice(String(latest.price));
          setCapacity(latest.capacity);
          setQuantity(String(latest.quantity ?? 1));
          setImageFile(null);
          setError(null);
          setOpen(true);
        })
        .catch((e) =>
          setError(e instanceof Error ? e.message : "Failed to load latest cottage."),
        );
    });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(() => {
      const url = editing ? `/api/cottages/${editing.id}` : "/api/cottages";
      const method = editing ? "PATCH" : "POST";
      void fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: Number(price),
          capacity: capacity.trim(),
          quantity: Number(quantity),
          imageUrl: null,
        }),
      })
        .then(async (response) => {
          const data = (await response.json()) as {
            cottage?: any;
            error?: string;
          };
          if (!response.ok || !data.cottage)
            throw new Error(data.error ?? "Save failed.");
          let imageUrl = data.cottage.imageUrl as string | null;
          if (imageFile) {
            const formData = new FormData();
            formData.append("image", imageFile);
            const uploadRes = await fetch(
              `/api/cottages/${data.cottage.id}/upload`,
              { method: "POST", body: formData },
            );
            const uploadData = (await uploadRes.json()) as {
              imageUrl?: string;
              error?: string;
            };
            if (!uploadRes.ok)
              throw new Error(uploadData.error ?? "Image upload failed.");
            imageUrl = uploadData.imageUrl ?? null;
          }
          const mapped: CottageRow = {
            id: data.cottage.id,
            name: data.cottage.name,
            description: data.cottage.description,
            capacity: data.cottage.capacity,
            quantity: data.cottage.quantity ?? 1,
            imageUrl,
            createdAt: new Intl.DateTimeFormat("en-PH", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(data.cottage.createdAt)),
            price: new Intl.NumberFormat("en-PH", {
              style: "currency",
              currency: "PHP",
            }).format(data.cottage.price),
          };
          setRows((curr) =>
            editing
              ? curr.map((r) => (r.id === mapped.id ? mapped : r))
              : [mapped, ...curr],
          );
          setOpen(false);
          resetForm();
        })
        .catch((e) =>
          setError(e instanceof Error ? e.message : "Save failed."),
        );
    });
  };

  const remove = (id: string) => {
    startTransition(() => {
      void fetch(`/api/cottages/${id}`, { method: "DELETE" }).then((r) => {
        if (r.ok) setRows((curr) => curr.filter((x) => x.id !== id));
      });
    });
  };

  return (
    <div className="grid gap-6">
      <div className="flex justify-end">
        <Button type="button" onClick={openCreate}>
          <Plus />
          Create Cottage
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Cottage" : "Create New Cottage"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update cottage details."
                : "Add a new cottage entry for booking selection."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cottage name"
              className="h-10 rounded-md border bg-background px-3 text-sm"
              required
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price (e.g. 500)"
              className="h-10 rounded-md border bg-background px-3 text-sm"
              required
            />
            <input
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Capacity (e.g. 10 - 12)"
              className="h-10 rounded-md border bg-background px-3 text-sm"
              required
            />
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Quantity (e.g. 10)"
              className="h-10 rounded-md border bg-background px-3 text-sm"
              required
            />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm md:col-span-2"
              required
            />
            <div className="md:col-span-2 flex items-center justify-between">
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : (
                <span />
              )}
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Cottage"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(v) => {
          if (!v) {
            setViewing(null);
            setZoom(1);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.name}</DialogTitle>
                <DialogDescription>
                  {viewing.capacity} • Qty {viewing.quantity ?? 1} •{" "}
                  {viewing.price}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    onClick={() =>
                      setZoom((current) => Math.max(0.5, current - 0.1))
                    }
                  >
                    <ZoomOut className="size-4" />
                    <span className="sr-only">Zoom out</span>
                  </Button>
                  <span className="w-14 text-center text-xs text-muted-foreground">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    onClick={() =>
                      setZoom((current) => Math.min(3, current + 0.1))
                    }
                  >
                    <ZoomIn className="size-4" />
                    <span className="sr-only">Zoom in</span>
                  </Button>
                </div>
                {viewing.imageUrl ? (
                  <div className="h-[60dvh] overflow-auto rounded-md border bg-muted p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={viewing.imageUrl}
                      alt={viewing.name}
                      className="mx-auto h-auto rounded-md object-contain"
                      style={{ width: `${zoom * 100}%`, maxWidth: "none" }}
                    />
                  </div>
                ) : (
                  <div className="h-80 w-full rounded-md border bg-muted" />
                )}
                <p className="text-sm text-muted-foreground">
                  {viewing.description}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No cottages found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.capacity}</TableCell>
                  <TableCell>{c.price}</TableCell>
                  <TableCell>{c.quantity ?? 1}</TableCell>
                  <TableCell>{c.createdAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon-sm">
                          <EllipsisVertical className="size-4" />
                          <span className="sr-only">Open actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setViewing(c)}>
                          <Eye className="size-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openEdit(c)}>
                          <Pencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => remove(c.id)}
                          variant="destructive"
                        >
                          <Trash2 className="size-4" />
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
    </div>
  );
}
