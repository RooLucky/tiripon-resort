"use client";

import Image from "next/image";
import { Check, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useBookingRequest } from "@/hooks/use-booking-request";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import type { CottageOption } from "@/lib/booking-types";
import { DatePicker } from "./DatePicker";
import { Button } from "../ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const checkInTimes = [
  "6:00 AM",
  "6:30 AM",
  "7:00 AM",
  "7:30 AM",
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
];

function GuestStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex h-11 items-center justify-between bg-stone/45 px-3 text-brown">
      <span className="text-sm">{value}</span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-9 rounded-none text-brown hover:bg-tan/30"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-9 rounded-none text-brown hover:bg-tan/30"
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${label}`}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export default function SecondPage() {
  const { createBooking, error, isLoading, reset } = useBookingRequest();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [cottages, setCottages] = useState<CottageOption[]>([]);
  const [selectedCottageId, setSelectedCottageId] = useState<string | null>(
    null,
  );
  const [date, setDate] = useState<Date>();
  const [checkInTime, setCheckInTime] = useState("6:00 AM");
  const [children, setChildren] = useState(0);
  const [olderGuests, setOlderGuests] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [reservedByCottageId, setReservedByCottageId] = useState<
    Record<string, number>
  >({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const cottagesRef = useRef<CottageOption[]>([]);

  const selectedDateKey = useMemo(() => {
    if (!date) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, [date]);

  const total = useMemo(
    () => children * 30 + olderGuests * 50,
    [children, olderGuests],
  );

  const selectedCottage = useMemo(
    () => cottages.find((cottage) => cottage.id === selectedCottageId) ?? null,
    [cottages, selectedCottageId],
  );

  const cottageTotal = useMemo(
    () => (selectedCottage ? selectedCottage.price : 0),
    [selectedCottage],
  );

  const bookingTotal = total + cottageTotal;
  const isCottageFullyBooked = useCallback(
    (cottage: CottageOption) =>
      (reservedByCottageId[cottage.id] ?? 0) >= (cottage.quantity ?? 1),
    [reservedByCottageId],
  );

  const refreshAvailability = useCallback(
    async (dateKey: string, showLoading = false) => {
      if (showLoading) {
        setIsCheckingAvailability(true);
      }

      try {
        // Get timezone offset in minutes
        const timezoneOffset = new Date().getTimezoneOffset();
        const response = await fetch(
          `/api/bookings?availabilityDate=${dateKey}&timezoneOffset=${timezoneOffset}`,
          {
            cache: "no-store",
          },
        );
        const contentType = response.headers.get("content-type") ?? "";
        const data =
          response.ok && contentType.includes("application/json")
            ? ((await response.json()) as {
                reservedByCottageId?: Record<string, number>;
              })
            : null;
        const reservedCounts =
          data?.reservedByCottageId &&
          typeof data.reservedByCottageId === "object"
            ? data.reservedByCottageId
            : {};

        setReservedByCottageId(reservedCounts);
        setSelectedCottageId((current) => {
          if (!current) return null;
          const cottage = cottagesRef.current.find(
            (item) => item.id === current,
          );
          if (!cottage) return null;
          const isFullyBooked =
            (reservedCounts[cottage.id] ?? 0) >= (cottage.quantity ?? 1);
          return isFullyBooked ? null : current;
        });
      } catch {
        setReservedByCottageId({});
      } finally {
        if (showLoading) {
          setIsCheckingAvailability(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    cottagesRef.current = cottages;
  }, [cottages]);

  useEffect(() => {
    if (!selectedDateKey) {
      setReservedByCottageId({});
      return;
    }

    void refreshAvailability(selectedDateKey, true);
  }, [refreshAvailability, selectedDateKey]);

  useEffect(() => {
    void fetch("/api/cottages", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { cottages?: CottageOption[] } | null) => {
        if (Array.isArray(data?.cottages)) {
          setCottages(data.cottages);
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!selectedDateKey) return;

    const refreshSelectedDate = () => {
      void refreshAvailability(selectedDateKey);
    };

    const channel = supabase
      .channel(`booking-availability-${selectedDateKey}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        refreshSelectedDate,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "receipts" },
        refreshSelectedDate,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cottages" },
        refreshSelectedDate,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refreshAvailability, selectedDateKey, supabase]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();

    if (!date) {
      setFormError("Please select your check-in date.");
      return;
    }

    if (children + olderGuests < 1) {
      setFormError("Please add at least one guest.");
      return;
    }

    setFormError(null);
    setIsBookingModalOpen(true);
  };

  const toggleCottage = (cottageId: string) => {
    const cottage = cottages.find((item) => item.id === cottageId);

    if (cottage && isCottageFullyBooked(cottage)) {
      return;
    }

    setSelectedCottageId((current) =>
      current === cottageId ? null : cottageId,
    );
  };

  const handleBookingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!date || !selectedDateKey) {
      setFormError("Please select your check-in date.");
      setIsBookingModalOpen(false);
      return;
    }

    if (!selectedCottage) {
      setFormError("Please select at least one cottage.");
      return;
    }

    if (isCottageFullyBooked(selectedCottage)) {
      setFormError(
        `${selectedCottage.name} is already reserved for this date.`,
      );
      return;
    }

    setFormError(null);

    try {
      // Create checkIn and checkOut dates in local timezone, then convert to UTC
      const [year, month, day] = selectedDateKey.split("-").map(Number);

      // Parse check-in time (e.g., "6:00 AM")
      const timeMatch = checkInTime.match(/(\d+):(\d+)\s*(AM|PM)/);
      if (!timeMatch) {
        setFormError("Invalid check-in time format.");
        return;
      }

      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const period = timeMatch[3];

      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      // Create date in local timezone
      const localCheckIn = new Date(year, month - 1, day, hours, minutes, 0, 0);
      const localCheckOut = new Date(year, month - 1, day, 17, 30, 0, 0); // 5:30 PM

      const result = await createBooking({
        name,
        email,
        phone,
        selected_cottage_id: selectedCottage.id,
        number_of_adult: String(olderGuests),
        number_of_kids: String(children),
        total_price: bookingTotal,
        summary: `${children} kids, ${olderGuests} adults, 1 cottage selected.`,
        checkIn: localCheckIn.toISOString(),
        checkOut: localCheckOut.toISOString(),
        selectedDateKey,
        timezoneOffset: new Date().getTimezoneOffset(),
      });
      setIsBookingModalOpen(false);
      toast.success("Booking request created", {
        description: result.message,
        duration: 3500,
      });
    } catch {
      // The hook owns the request error state rendered below.
    }
  };

  return (
    <section
      id="booking"
      className="relative min-h-dvh scroll-mt-[10dvh] overflow-hidden px-4 py-14 text-brown md:px-[4.5dvw] md:py-20"
    >
      <div className="pointer-events-none absolute inset-0 opacity-35">
        <div className="mx-auto grid h-full max-w-[90dvw] grid-cols-4 border-x border-brown/15 md:grid-cols-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="border-r border-brown/15 last:border-r-0"
            />
          ))}
        </div>
      </div>

      <motion.div
        className="relative mx-auto max-w-[90dvw]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.14,
            },
          },
        }}
      >
        <motion.div
          className="grid min-h-[68dvh] bg-[#86a8b5] md:grid-cols-[0.9fr_1.1fr]"
          variants={{
            hidden: { opacity: 0, y: 46 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.75, ease: "easeOut" },
            },
          }}
        >
          <motion.div
            className="flex flex-col justify-center px-6 py-16 text-cream md:px-16"
            variants={{
              hidden: { opacity: 0, x: -28 },
              visible: {
                opacity: 1,
                x: 0,
                transition: { duration: 0.7, ease: "easeOut" },
              },
            }}
          >
            <p className="font-googlesansflex text-sm font-semibold uppercase">
              The luxury resort
            </p>
            <div className="mt-2 h-px w-24 bg-tan" />
            <h2 className="mt-5 max-w-xl font-heading text-5xl leading-[0.95] capitalize md:text-7xl">
              Enjoy a resort experience
            </h2>
            <p className="mt-7 max-w-lg font-googlesansflex text-sm leading-6 text-cream/85 md:text-base">
              Reserve your visit with a clear check-in window, fixed checkout,
              and simple guest pricing for families and groups.
            </p>
            {/* <Button
              type="button"
              className="mt-8 h-11 w-fit rounded-full bg-tan px-6 font-googlesansflex text-brown hover:bg-khaki"
            >
              Book Now
              <ArrowRight className="size-4" />
            </Button> */}
          </motion.div>

          <motion.div
            className="relative min-h-[28dvh] md:min-h-full"
            variants={{
              hidden: { opacity: 0, x: 34 },
              visible: {
                opacity: 1,
                x: 0,
                transition: { duration: 0.75, ease: "easeOut" },
              },
            }}
          >
            <div className="absolute inset-x-0 bottom-[-8dvh] top-0 overflow-hidden rounded-none md:inset-x-0 md:bottom-[-15dvh] md:right-15 md:top-16 md:rounded-2xl">
              <Image
                src="/images/6.png"
                alt="Resort villa and pool"
                fill
                className="object-cover md:object-[center_40%]"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            </div>
          </motion.div>
        </motion.div>

        <motion.form
          onSubmit={handleSearch}
          className="relative z-10 mx-auto mt-10 grid gap-3 p-4 shadow-2xl backdrop-blur-md md:-mt-12 md:w-[92%] md:grid-cols-[1fr_1fr_1fr_1fr_1.2fr] md:p-5"
          variants={{
            hidden: { opacity: 0, y: 34 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.7, ease: "easeOut" },
            },
          }}
        >
          <label className="bg-white p-4">
            <span className="font-googlesansflex text-sm font-semibold uppercase text-brown">
              Check in
            </span>
            <DatePicker
              date={date}
              onDateChange={setDate}
              placeholder="Arrival date"
              minDate={new Date()}
              className="mt-3 h-11 rounded-none border-none bg-stone/45 text-brown shadow-none"
            />
          </label>

          <label className="bg-white p-4">
            <span className="font-googlesansflex text-sm font-semibold uppercase text-brown">
              Arrival time
            </span>

            <Select value={checkInTime} onValueChange={setCheckInTime}>
              <SelectTrigger className="mt-3 w-full rounded-none border-none bg-stone/45 p-5.5 text-brown shadow-none">
                <SelectValue placeholder="Time" />
              </SelectTrigger>

              <SelectContent
                position="popper"
                sideOffset={4}
                className="h-46 overflow-y-auto rounded-none border-none bg-white text-brown shadow-md"
              >
                {checkInTimes.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="bg-white p-4">
            <span className="font-googlesansflex text-sm font-semibold uppercase text-brown">
              Ages 4-10
            </span>
            <div className="mt-3">
              <GuestStepper
                label="Ages 4-10"
                value={children}
                onChange={setChildren}
              />
            </div>
          </label>

          <label className="bg-white p-4">
            <span className="font-googlesansflex text-sm font-semibold uppercase text-brown">
              Ages 11+
            </span>
            <div className="mt-3">
              <GuestStepper
                label="Ages 11 and above"
                value={olderGuests}
                onChange={setOlderGuests}
              />
            </div>
          </label>

          <div className="md:grid flex flex-col overflow-hidden bg-tan text-brown md:grid-cols-1">
            <div className="flex flex-col justify-center px-5 py-4">
              <span className="font-googlesansflex text-sm font-semibold uppercase">
                Total Entrance Fee
              </span>
              <span className="mt-1 text-3xl font-semibold">₱{total}</span>
              <span className="mt-1 text-base text-brown">
                Checkout: 5:30 PM
              </span>
            </div>
            <Button
              type="submit"
              className="h-16 rounded-none bg-green/30 px-5 text-brown shadow-none hover:bg-khaki md:h-auto md:min-h-16"
            >
              Search and Select Cottages
            </Button>
          </div>

          {(formError || error) && (
            <p className="bg-white px-4 py-3 font-googlesansflex text-sm text-brown md:col-span-full">
              {formError ?? error}
            </p>
          )}
        </motion.form>

        <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
          <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-none bg-cream p-0 text-brown sm:max-w-[92dvw] lg:max-w-5xl">
            <form onSubmit={handleBookingSubmit}>
              <div className="grid gap-0 md:grid-cols-[1.35fr_0.85fr]">
                <div className="min-w-0 bg-white p-5 md:p-7">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-4xl text-brown md:text-5xl">
                      Select cottages
                    </DialogTitle>
                    <DialogDescription className="font-googlesansflex text-brown/65">
                      Review the cabana image, rate, and capacity before
                      selecting one or more cottages for your booking.
                      {isCheckingAvailability
                        ? " Checking paid reservations for this date..."
                        : ""}
                    </DialogDescription>
                  </DialogHeader>

                  <Carousel
                    opts={{ align: "start", loop: true }}
                    className="mt-6"
                  >
                    <CarouselContent>
                      {cottages.map((cottage) => {
                        const isSelected = selectedCottageId === cottage.id;
                        const isUnavailable = isCottageFullyBooked(cottage);
                        const reservedCount =
                          reservedByCottageId[cottage.id] ?? 0;
                        const totalQuantity = cottage.quantity ?? 1;

                        return (
                          <CarouselItem
                            key={cottage.id}
                            className="md:basis-1/2"
                          >
                            <motion.button
                              type="button"
                              onClick={() => toggleCottage(cottage.id)}
                              disabled={isUnavailable}
                              whileHover={isUnavailable ? undefined : { y: -3 }}
                              whileTap={
                                isUnavailable ? undefined : { scale: 0.985 }
                              }
                              transition={{
                                type: "spring",
                                stiffness: 360,
                                damping: 28,
                              }}
                              className={`block w-full overflow-hidden border bg-cream text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                isUnavailable
                                  ? "border-brown/10 grayscale"
                                  : isSelected
                                    ? "border-brown shadow-xl shadow-brown/15"
                                    : "border-brown/15 shadow-sm hover:border-brown/45 hover:shadow-lg hover:shadow-brown/10"
                              }`}
                            >
                              <div className="relative aspect-[4/3] w-full overflow-hidden">
                                {cottage.imageUrl ? (
                                  <Image
                                    src={cottage.imageUrl}
                                    alt={cottage.name}
                                    fill
                                    className="object-cover"
                                    sizes="(min-width: 1024px) 36vw, 82vw"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-stone/40">
                                    <svg
                                      viewBox="0 0 64 64"
                                      className="size-18 text-brown/60"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                      aria-hidden="true"
                                    >
                                      <path
                                        d="M8 30L32 12L56 30"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M14 28V52H50V28"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M26 52V38H38V52"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <rect
                                        x="40"
                                        y="16"
                                        width="7"
                                        height="11"
                                        rx="1"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                      />
                                    </svg>
                                  </div>
                                )}
                                <motion.span
                                  className="absolute right-3 top-3 flex size-9 items-center justify-center bg-white text-brown shadow"
                                  animate={{
                                    scale: isSelected ? 1 : 0.92,
                                    opacity: isUnavailable
                                      ? 0.7
                                      : isSelected
                                        ? 1
                                        : 0.86,
                                  }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 420,
                                    damping: 24,
                                  }}
                                >
                                  {isSelected ? (
                                    <motion.span
                                      initial={{ scale: 0, rotate: -20 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 22,
                                      }}
                                    >
                                      <Check className="size-5" />
                                    </motion.span>
                                  ) : (
                                    <span className="size-4 border border-brown/45" />
                                  )}
                                </motion.span>
                                {isUnavailable && (
                                  <span className="absolute inset-x-3 bottom-3 bg-brown px-3 py-2 text-center font-googlesansflex text-xs font-semibold uppercase tracking-wide text-cream shadow">
                                    Fully booked ({reservedCount}/
                                    {totalQuantity})
                                  </span>
                                )}
                              </div>
                              <div className="grid gap-3 p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <h3 className="font-heading text-xl">
                                    {cottage.name}
                                  </h3>
                                  <span className="font-googlesansflex text-lg font-semibold">
                                    ₱{cottage.price.toLocaleString()}
                                  </span>
                                </div>
                                <p className="font-googlesansflex text-sm leading-6 text-brown/70">
                                  {cottage.description}
                                </p>
                                <p className="font-googlesansflex text-sm font-semibold uppercase text-brown">
                                  Capacity: {cottage.capacity}
                                </p>
                                <p className="font-googlesansflex text-xs uppercase text-brown/70">
                                  Remaining:{" "}
                                  {Math.max(totalQuantity - reservedCount, 0)} /{" "}
                                  {totalQuantity}
                                </p>
                              </div>
                            </motion.button>
                          </CarouselItem>
                        );
                      })}
                    </CarouselContent>
                    <CarouselPrevious
                      type="button"
                      size="icon-lg"
                      variant="outline"
                      aria-label="Previous cottage"
                      className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white text-brown shadow-lg shadow-brown/15"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                    >
                      <ChevronLeft />
                    </CarouselPrevious>
                    <CarouselNext
                      type="button"
                      size="icon-lg"
                      variant="outline"
                      aria-label="Next cottage"
                      className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white text-brown shadow-lg shadow-brown/15"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                    >
                      <ChevronRight />
                    </CarouselNext>
                  </Carousel>
                </div>

                <div className="flex flex-col bg-tan p-5 md:p-7">
                  <div className="grid gap-3">
                    <label>
                      <span className="font-googlesansflex text-sm font-semibold uppercase">
                        Name
                      </span>
                      <input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                        placeholder="Guest name"
                        className="mt-2 h-11 w-full rounded-none border-none bg-white px-3 text-brown outline-none"
                      />
                    </label>

                    <label>
                      <span className="font-googlesansflex text-sm font-semibold uppercase">
                        Email
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        placeholder="Email address"
                        className="mt-2 h-11 w-full rounded-none border-none bg-white px-3 text-brown outline-none"
                      />
                    </label>

                    <label>
                      <span className="font-googlesansflex text-sm font-semibold uppercase">
                        Phone number
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="Phone number"
                        className="mt-2 h-11 w-full rounded-none border-none bg-white px-3 text-brown outline-none"
                      />
                    </label>

                    <div className="mt-1 border-t border-brown/20 pt-4 font-googlesansflex">
                      <div className="flex justify-between gap-4 text-sm">
                        <span>Entrance fee</span>
                        <span>₱{total.toLocaleString()}</span>
                      </div>
                      <div className="mt-2 flex justify-between gap-4 text-sm">
                        <span>Cottage rate</span>
                        <span>₱{cottageTotal.toLocaleString()}</span>
                      </div>
                      <div className="mt-4 flex justify-between gap-4 text-xl font-semibold">
                        <span>Total</span>
                        <span>₱{bookingTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    {(formError || error) && (
                      <p className="bg-white px-3 py-2 font-googlesansflex text-sm text-brown">
                        {formError ?? error}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="mt-5 h-11 w-full rounded-none bg-brown px-7 text-cream hover:bg-brown/90 md:mt-auto"
                  >
                    {isLoading ? "Creating Booking..." : "Confirm Booking"}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <motion.div
          className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-googlesansflex text-sm text-brown/70 md:ml-[4%]"
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.55, ease: "easeOut" },
            },
          }}
        >
          <span>Ages 4-10: ₱30 each</span>
          <span>Ages 11 and above: ₱50 each</span>
          <span>Check-in window: 6:00 AM-12:00 PM</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
