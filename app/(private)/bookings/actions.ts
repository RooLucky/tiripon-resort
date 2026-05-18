"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
}

export async function deleteBooking(bookingId: string) {
  await requireAdmin();
  if (typeof bookingId !== "string" || bookingId.trim().length === 0) {
    throw new Error("Invalid booking id.");
  }

  await prisma.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      deleted: true,
      deletedAt: new Date(),
    },
  });

  revalidatePath("/bookings");
  revalidatePath("/bin");
}

export async function permanentlyDeleteBooking(
  bookingId: string,
) {
  await requireAdmin();
  if (typeof bookingId !== "string" || bookingId.trim().length === 0) {
    throw new Error("Invalid booking id.");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { receipt: true },
  });

  if (!booking || booking.deleted !== true) {
    throw new Error("Booking not found in recycle bin.");
  }

  await prisma.booking.delete({
    where: { id: bookingId },
  });

  revalidatePath("/bookings");
  revalidatePath("/bin");
}

export async function bulkPermanentlyDeleteBookings(
  bookingIds: string[],
) {
  await requireAdmin();
  const ids = bookingIds
    .filter((id) => typeof id === "string")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  if (ids.length === 0) return;

  for (const id of ids) {
    try {
      await permanentlyDeleteBooking(id);
    } catch {
      // Skip rows that fail validation.
      continue;
    }
  }

  revalidatePath("/bookings");
  revalidatePath("/bin");
}

export async function bulkSoftDeleteBookings(bookingIds: string[]) {
  await requireAdmin();
  const ids = bookingIds
    .filter((id) => typeof id === "string")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  if (ids.length === 0) return;

  await prisma.booking.updateMany({
    where: {
      id: { in: ids },
    },
    data: {
      deleted: true,
      deletedAt: new Date(),
    },
  });

  revalidatePath("/bookings");
  revalidatePath("/bin");
}

export async function cleanRecycleBin() {
  await requireAdmin();

  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const eligible = await prisma.booking.findMany({
    where: {
      deleted: true,
      deletedAt: { lte: tenDaysAgo },
    },
    include: { receipt: true },
  });

  for (const booking of eligible) {
    await prisma.booking.delete({ where: { id: booking.id } });
  }

  revalidatePath("/bookings");
  revalidatePath("/bin");
}

export async function confirmReceipt(receiptId: string) {
  await requireAdmin();
  if (typeof receiptId !== "string" || receiptId.trim().length === 0) {
    throw new Error("Invalid receipt id.");
  }

  await prisma.receipt.update({
    where: {
      id: receiptId,
    },
    data: {
      receipt_confirmation: true,
    },
  });

  revalidatePath("/bookings");
}

function requireText(value: FormDataEntryValue | null, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }

  return value.trim();
}

export async function createChatNode(formData: FormData) {
  await requireAdmin();

  const question = requireText(formData.get("question"), "Question");
  const answer = requireText(formData.get("answer"), "Answer");

  await prisma.defaultChatNodes.create({
    data: {
      question,
      answer,
    },
  });

  revalidatePath("/chatbot-management");
}

export async function updateChatNode(formData: FormData) {
  await requireAdmin();

  const idValue = formData.get("id");
  const id = typeof idValue === "string" ? idValue.trim() : "";
  if (!id) {
    throw new Error("Invalid chat node id.");
  }

  const question = requireText(formData.get("question"), "Question");
  const answer = requireText(formData.get("answer"), "Answer");

  await prisma.defaultChatNodes.update({
    where: {
      id,
    },
    data: {
      question,
      answer,
    },
  });

  revalidatePath("/chatbot-management");
}

export async function deleteChatNode(chatNodeId: string) {
  await requireAdmin();
  if (typeof chatNodeId !== "string" || chatNodeId.trim().length === 0) {
    throw new Error("Invalid chat node id.");
  }

  await prisma.defaultChatNodes.delete({
    where: {
      id: chatNodeId,
    },
  });

  revalidatePath("/chatbot-management");
}
