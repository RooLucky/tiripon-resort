"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";

const testimonials = [
  {
    quote:
      "Our family had a comfortable and memorable day at the resort. The pool was well kept, the cottages gave us space to gather, and the view made the setting feel truly special.",
    guest: "St. John The Baptist Church Family",
    stay: "Family Resort Day",
    image: "/images/review-2.jpg",
  },
  {
    quote:
      "It was an ideal place for fellowship and bonding. We were able to swim, share meals, and spend quality time together in a relaxed environment.",
    guest: "St. John The Baptist Church Family",
    stay: "Group Bonding",
    image: "/images/review-1.jpg",
  },
  {
    quote:
      "A refreshing escape from the usual routine. The peaceful atmosphere and scenic setting made the visit feel calm, worthwhile, and easy to recommend.",
    guest: "Guests from Different Places",
    stay: "Great Escape",
    image: "/images/review-3.jpg",
  },
];

export default function FourthPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleCards = useMemo(
    () =>
      Array.from(
        { length: 3 },
        (_, idx) => testimonials[(activeIndex + idx) % testimonials.length],
      ),
    [activeIndex],
  );

  const prev = () =>
    setActiveIndex((current) =>
      current === 0 ? testimonials.length - 1 : current - 1,
    );
  const next = () =>
    setActiveIndex((current) => (current + 1) % testimonials.length);

  return (
    <section className="relative overflow-hidden bg-transparent px-4 py-16 md:px-[5dvw] md:py-24">
      <div className="relative mx-auto max-w-[92rem] overflow-visible rounded-[2.2rem] border border-cream/20 bg-tan/20 px-4 py-10 text-cream shadow-[0_30px_80px_rgba(42,55,32,0.15)] sm:px-5 sm:py-12 md:overflow-visible md:px-12 md:py-16">
        <Image
          src="/images/leaf.png"
          alt=""
          width={250}
          height={160}
          aria-hidden
          className="pointer-events-none absolute -left-14 -top-7 z-10 w-40 rotate-[-14deg] opacity-25 blur-[1px] sm:w-52 sm:opacity-45"
        />
        <Image
          src="/images/leaf.png"
          alt=""
          width={260}
          height={170}
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-2 z-10 w-44 rotate-[14deg] opacity-35 blur-[0.4px] sm:w-56 sm:opacity-65"
        />
        <Image
          src="/images/leaf.png"
          alt=""
          width={190}
          height={124}
          aria-hidden
          className="pointer-events-none absolute left-[34%] top-[39%] z-10 hidden rotate-[9deg] opacity-65 blur-[0.8px] md:block"
        />
        <Image
          src="/images/leaf.png"
          alt=""
          width={250}
          height={160}
          aria-hidden
          className="pointer-events-none absolute -bottom-10 left-0 z-10 w-44 rotate-[17deg] opacity-35 blur-[0.5px] sm:left-8 sm:w-52 sm:opacity-62"
        />
        <Image
          src="/images/leaf.png"
          alt=""
          width={260}
          height={170}
          aria-hidden
          className="pointer-events-none absolute -bottom-14 right-[-7%] z-10 w-44 rotate-[-28deg] opacity-28 blur-[1px] sm:right-[11%] sm:w-56 sm:opacity-38"
        />
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-20 mx-auto max-w-4xl text-center"
        >
          <p className="font-googlesansflex text-sm font-semibold uppercase tracking-[0.12em] text-cream/85">
            Testimonials
          </p>
          <h2 className="mt-4 font-heading text-4xl leading-[0.95] text-khaki sm:text-5xl md:text-7xl">
            What Our Guests Say
          </h2>
          <p className="mx-auto mt-5 max-w-3xl font-googlesansflex text-sm leading-6 text-khaki sm:text-base sm:leading-7 md:text-lg">
            Real experiences from families and groups who spent their day with
            us. Relaxed atmosphere, clean facilities, and memorable moments.
          </p>
        </motion.div>

        <div className="relative z-20 mt-20 grid gap-5 md:mt-24 md:grid-cols-3">
          {visibleCards.map((item, index) => (
            <motion.article
              key={`${item.guest}-${item.stay}-${item.quote}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className={`relative rounded-[1.6rem] border border-cream/45 bg-till p-5 backdrop-blur-md sm:rounded-[2rem] sm:p-6 ${index > 0 ? "hidden md:block" : ""}`}
            >
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 sm:-top-14">
                <div className="rounded-full border-2 border-khaki bg-cream/20 p-1">
                  <Image
                    src={item.image}
                    alt={item.guest}
                    width={120}
                    height={120}
                    className="size-20 rounded-full object-cover sm:size-28"
                  />
                </div>
              </div>

              <p className="mt-12 text-center font-googlesansflex text-sm leading-7 text-cream/85 sm:mt-10 sm:text-base sm:leading-8">
                {item.quote}
              </p>
              <h3 className="mt-6 text-center font-googlesansflex text-xl font-semibold text-khaki sm:mt-8 sm:text-3xl">
                {item.guest}
              </h3>
              <p className="mt-1 text-center font-googlesansflex text-sm text-cream/75">
                {item.stay}
              </p>
            </motion.article>
          ))}
        </div>

        <div className="relative z-50 mt-8 flex items-center justify-center gap-4 sm:mt-10 sm:gap-6">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={prev}
            className="size-11 rounded-full border-cream/35 bg-khaki text-cream hover:bg-cream/20 sm:size-14"
            aria-label="Previous testimonial"
          >
            <ArrowLeft className="size-5 " />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={next}
            className="size-11 rounded-full border-cream/35 bg-khaki text-cream hover:bg-cream/20 sm:size-14"
            aria-label="Next testimonial"
          >
            <ArrowRight className="size-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
