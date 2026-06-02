import type { BookingRequestPayload } from "@/lib/booking-types";
import { sendReservationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const CHECKOUT_TIME = "5:30 PM";
const PAGE_SIZE = 10;

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

function formatMonthDay(value: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
  }).format(value);
}

function getBookingDayRange(dateKey: string, timezoneOffset = 0) {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const utcMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const utcNextMidnight = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
  const start = new Date(utcMidnight.getTime() + timezoneOffset * 60 * 1000);
  const end = new Date(utcNextMidnight.getTime() + timezoneOffset * 60 * 1000);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return { start, end };
}

async function getPaidCottageReservationCountsForDay(
  dateKey: string,
  timezoneOffset = 0,
) {
  const range = getBookingDayRange(dateKey, timezoneOffset);

  if (!range) {
    throw new Error("Invalid booking date.");
  }

  const bookings = await prisma.booking.findMany({
    where: {
      checkIn: {
        gte: range.start,
        lt: range.end,
      },
      receipt: {
        is: {
          OR: [
            {
              AND: [{ status: "paid" }, { status: { not: "denied" } }],
            },
            { receipt_confirmation: true },
          ],
        },
      },
    },
    select: { selected_cottage_id: true },
  });
  const selectedIds = bookings
    .map((booking) => booking.selected_cottage_id)
    .filter((id): id is string => Boolean(id));
  const counts: Record<string, number> = {};
  for (const id of selectedIds) counts[id] = (counts[id] ?? 0) + 1;
  return counts;
}

function isBookingPayload(value: unknown): value is BookingRequestPayload {
  if (!value || typeof value !== "object") return false;

  const payload = value as Record<string, unknown>;

  return (
    typeof payload.name === "string" &&
    payload.name.trim().length > 0 &&
    typeof payload.email === "string" &&
    payload.email.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) &&
    (payload.phone === undefined || typeof payload.phone === "string") &&
    typeof payload.selected_cottage_id === "string" &&
    payload.selected_cottage_id.trim().length > 0 &&
    typeof payload.number_of_kids === "string" &&
    /^\d+$/.test(payload.number_of_kids) &&
    typeof payload.number_of_adult === "string" &&
    /^\d+$/.test(payload.number_of_adult) &&
    typeof payload.total_price === "number" &&
    Number.isFinite(payload.total_price) &&
    payload.total_price >= 0 &&
    (payload.checkIn === undefined || typeof payload.checkIn === "string") &&
    (payload.checkOut === undefined || typeof payload.checkOut === "string") &&
    (payload.summary === undefined || typeof payload.summary === "string")
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isBookingPayload(body)) {
    return Response.json(
      { error: "Invalid booking request payload." },
      { status: 400 },
    );
  }

  const numberOfKids = Number(body.number_of_kids);
  const numberOfAdults = Number(body.number_of_adult);
  const expectedEntranceTotal = numberOfKids * 30 + numberOfAdults * 50;
  const selectedCottage = await prisma.cottages.findUnique({
    where: { id: body.selected_cottage_id },
  });
  if (!selectedCottage) {
    return Response.json({ error: "Selected cottage not found." }, { status: 400 });
  }
  const cottageTotal = selectedCottage.price;

  if (body.total_price !== expectedEntranceTotal + cottageTotal) {
    return Response.json(
      { error: "Booking total does not match selected guests and cottages." },
      { status: 400 },
    );
  }

  const checkIn = body.checkIn ? new Date(body.checkIn) : null;

  if (checkIn && Number.isNaN(checkIn.getTime())) {
    return Response.json(
      { error: "Invalid check-in date." },
      { status: 400 },
    );
  }

  const checkOut = body.checkOut ? new Date(body.checkOut) : null;

  if (checkOut && Number.isNaN(checkOut.getTime())) {
    return Response.json({ error: "Invalid checkout date." }, { status: 400 });
  }

  if (checkIn) {
    const dateKey =
      typeof body.selectedDateKey === "string" && body.selectedDateKey
        ? body.selectedDateKey
        : checkIn.toISOString().slice(0, 10);
    const timezoneOffset =
      typeof body.timezoneOffset === "number" ? body.timezoneOffset : 0;
    const reservedByCottageId = await getPaidCottageReservationCountsForDay(
      dateKey,
      timezoneOffset,
    );
    if ((reservedByCottageId[selectedCottage.id] ?? 0) >= (selectedCottage.quantity ?? 1)) {
      return Response.json(
        {
          error: `${selectedCottage.name} is already taken for ${formatMonthDay(checkIn)}.`,
        },
        { status: 409 },
      );
    }
  }

  const downPaymentAmount = body.total_price * 0.5;
  const booking = await prisma.booking.create({
    data: {
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() || null,
      number_of_adult: body.number_of_adult,
      number_of_kids: body.number_of_kids,
      total_price: body.total_price,
      selected_cottage_id: body.selected_cottage_id,
      summary: body.summary?.trim() || null,
      checkIn,
      checkOut,
    },
  });

  const receipt = await prisma.receipt.create({
    data: {
      bookingId: booking.id,
      downPaymentAmount,
    },
  });

  const receiptUrl = new URL(`/receipt/${receipt.id}`, request.url).toString();
  let emailSent = false;

  try {
    await sendReservationEmail({
      to: body.email.trim(),
      name: body.name.trim(),
      receiptUrl,
      totalPrice: body.total_price,
      downPaymentAmount,
      remainingBalance: body.total_price - downPaymentAmount,
      cottageName: selectedCottage.name,
    });
    emailSent = true;
  } catch (error) {
    console.error("Failed to send reservation email", error);
  }

  return Response.json(
    {
      booking: {
        ...booking,
        receipt,
        checkoutTime: CHECKOUT_TIME,
      },
      receiptUrl,
      emailSent,
      message: emailSent
        ? "Booking request created. Reservation email sent."
        : "Booking request created. Reservation email could not be sent.",
    },
    { status: 201 },
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const availabilityDate = searchParams.get("availabilityDate");
  const timezoneOffset = searchParams.get("timezoneOffset"); // in minutes

  if (availabilityDate) {
    const offsetMinutes = timezoneOffset ? parseInt(timezoneOffset, 10) : 0;
    const range = getBookingDayRange(availabilityDate, offsetMinutes);

    if (!range) {
      return Response.json({ error: "Invalid availability date." }, { status: 400 });
    }

    const reservedByCottageId = await getPaidCottageReservationCountsForDay(
      availabilityDate,
      offsetMinutes,
    );

    return Response.json(
      {
        reservedByCottageId,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  }

  const page = Math.max(Number(searchParams.get("page") ?? "1") || 1, 1);
  const size = Math.max(Number(searchParams.get("size") ?? `${PAGE_SIZE}`) || PAGE_SIZE, 1);
  const skip = (page - 1) * size;
  const checkInDate = searchParams.get("checkInDate");
  const listTimezoneOffset = searchParams.get("timezoneOffset");
  const checkInRange =
    checkInDate && /^\d{4}-\d{2}-\d{2}$/.test(checkInDate)
      ? getBookingDayRange(
          checkInDate,
          listTimezoneOffset ? parseInt(listTimezoneOffset, 10) : -480,
        )
      : null;
  const where = {
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

  const bookings = await prisma.booking.findMany({
    orderBy: {
      createdAt: "desc",
    },
    where,
    skip,
    take: size,
    include: {
      receipt: true,
    },
  });

  const cottageIds = bookings
    .map((booking) => booking.selected_cottage_id)
    .filter((id): id is string => Boolean(id));
  const cottages = await prisma.cottages.findMany({
    where: { id: { in: cottageIds } },
  });
  const cottageById = new Map(cottages.map((cottage) => [cottage.id, cottage]));

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
    cottages: booking.selected_cottage_id && cottageById.has(booking.selected_cottage_id)
      ? [(() => {
          const cottage = cottageById.get(booking.selected_cottage_id)!;
          return {
            id: cottage.id,
            name: cottage.name,
            description: cottage.description,
            price: formatCurrency(cottage.price),
          };
        })()]
      : [],
    receipt: booking.receipt
      ? {
        id: booking.receipt.id,
        status: booking.receipt.status,
        fullyPaid: booking.receipt.fullyPaid,
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

  return Response.json({ rows });
}
