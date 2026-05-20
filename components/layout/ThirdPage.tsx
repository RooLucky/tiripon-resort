"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";

const resortSlides = [
  {
    name: "Quiet Place",
    description: "A calm corner for slow mornings and restful afternoons.",
    image: "/images/2.png",
    price: "₱1,200 / DAY USE",
  },
  {
    name: "Golden Hours",
    description: "Soft afternoon light and relaxed open-air comfort.",
    image: "/images/3.png",
    price: "₱1,500 / DAY USE",
  },
  {
    name: "Breathe and Gather",
    description: "Wide airy spaces made for shared moments.",
    image: "/images/4.png",
    price: "₱1,800 / DAY USE",
  },
  {
    name: "Private Retreat",
    description: "Peaceful privacy surrounded by greenery.",
    image: "/images/5.png",
    price: "₱2,000 / DAY USE",
  },
];

const CARDS_VISIBLE_DESKTOP = 4;

export default function ThirdPage() {
  const [startIndex, setStartIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(1);
  const [mobileTransition, setMobileTransition] = useState(true);
  const total = resortSlides.length;
  const pages = Math.max(total - CARDS_VISIBLE_DESKTOP + 1, 1);
  const mobileSlides = useMemo(
    () => [resortSlides[total - 1], ...resortSlides, resortSlides[0]],
    [total],
  );

  const visibleSlides = useMemo(() => {
    return Array.from(
      { length: Math.min(CARDS_VISIBLE_DESKTOP, total) },
      (_, idx) => {
      return resortSlides[(startIndex + idx) % total];
      },
    );
  }, [startIndex, total]);

  const prev = () => {
    setStartIndex((current) => (current - 1 + total) % total);
    setMobileTransition(true);
    setMobileIndex((current) => current - 1);
  };
  const next = () => {
    setStartIndex((current) => (current + 1) % total);
    setMobileTransition(true);
    setMobileIndex((current) => current + 1);
  };

  useEffect(() => {
    if (mobileIndex === 0 || mobileIndex === total + 1) {
      const timer = setTimeout(() => {
        setMobileTransition(false);
        setMobileIndex(mobileIndex === 0 ? total : 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mobileIndex, total]);

  useEffect(() => {
    if (!mobileTransition) {
      const frame = requestAnimationFrame(() => setMobileTransition(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [mobileTransition]);

  return (
    <section className="relative overflow-hidden bg-cream px-4 py-16 text-brown md:px-[5dvw] md:py-24">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="mx-auto grid h-full max-w-[92rem] grid-cols-4 border-x border-brown/10 md:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border-r border-brown/10 last:border-r-0" />
          ))}
        </div>
      </div>

      <motion.div
        className="relative mx-auto max-w-[92rem]"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="text-center">
          <p className="font-googlesansflex text-sm font-semibold uppercase tracking-[0.12em] text-brown/75">
            Accomodation & Comfort
          </p>
          <div className="mx-auto mt-2 h-px w-24 bg-tan" />
          <h2 className="mt-5 font-heading text-5xl md:text-7xl">Rooms & Suites</h2>
        </div>

        <div className="mt-10 overflow-hidden md:hidden">
          <div
            className="flex ease-out"
            style={{
              transform: `translateX(-${mobileIndex * 100}%)`,
              transition: mobileTransition ? "transform 500ms" : "none",
            }}
          >
            {mobileSlides.map((slide, idx) => (
              <article
                key={`mobile-${slide.name}-${slide.image}-${idx}`}
                className="group relative w-full shrink-0 overflow-hidden rounded-2xl border border-brown/15 bg-stone/25"
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={slide.image}
                    alt={slide.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="92vw"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-till/95 p-5 text-cream">
                  <h3 className="font-heading text-4xl leading-none">{slide.name}</h3>
                  <p className="mt-4 font-googlesansflex text-xs uppercase tracking-[0.12em] text-cream/70">
                    Stay from
                  </p>
                  <p className="mt-1 font-googlesansflex text-lg font-semibold text-khaki">
                    {slide.price}
                  </p>
                  <p className="mt-2 font-googlesansflex text-sm text-cream/80">
                    {slide.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10 hidden gap-4 md:grid md:grid-cols-4">
          {visibleSlides.map((slide) => (
            <article
              key={`${slide.name}-${slide.image}`}
              className="group relative overflow-hidden rounded-2xl border border-brown/15 bg-stone/25"
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={slide.image}
                  alt={slide.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(min-width: 768px) 22vw, 88vw"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-till/95 p-5 text-cream">
                <h3 className="font-heading text-4xl leading-none">{slide.name}</h3>
                <p className="mt-4 font-googlesansflex text-xs uppercase tracking-[0.12em] text-cream/70">
                  Stay from
                </p>
                <p className="mt-1 font-googlesansflex text-lg font-semibold text-khaki">
                  {slide.price}
                </p>
                <p className="mt-2 font-googlesansflex text-sm text-cream/80">
                  {slide.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-6">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={prev}
            className="rounded-full border-brown/30 bg-cream text-brown hover:bg-khaki/50"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-2">
            {Array.from({ length: total }).map((_, idx) => (
              <button
                key={`mobile-dot-${idx}`}
                type="button"
                onClick={() => setStartIndex(idx)}
                className={`h-2.5 rounded-full transition-all md:hidden ${
                  idx === startIndex ? "w-7 bg-olive" : "w-2.5 bg-brown/25"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
            {Array.from({ length: pages }).map((_, idx) => (
              <button
                key={`desktop-dot-${idx}`}
                type="button"
                onClick={() => setStartIndex(idx)}
                className={`hidden h-2.5 rounded-full transition-all md:block ${
                  idx === startIndex ? "w-7 bg-olive" : "w-2.5 bg-brown/25"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={next}
            className="rounded-full border-brown/30 bg-cream text-brown hover:bg-khaki/50"
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
