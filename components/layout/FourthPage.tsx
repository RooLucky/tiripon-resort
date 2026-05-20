"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

const testimonials = [
  {
    quote:
      "Our family had a comfortable and memorable day at the resort. The pool was well kept, the cottages gave us space to gather, and the view of Mayon Volcano made the setting feel truly special.",
    guest: "St. John The Baptist Church Family",
    stay: "Family Resort Day",
    rating: 5,
    image: "/images/review-2.jpg",
  },
  {
    quote:
      "It was an ideal place for fellowship and bonding. We were able to swim, share meals, and spend quality time together in a relaxed environment, with Mayon Volcano visible from the resort grounds.",
    guest: "St. John The Baptist Church Family",
    stay: "Group Bonding",
    rating: 5,
    image: "/images/review-1.jpg",
  },
  {
    quote:
      "A refreshing escape from the usual routine. The peaceful atmosphere, clean pool area, and scenic view of Mayon Volcano made the visit feel calm, worthwhile, and easy to recommend.",
    guest: "Guests from Different Places",
    stay: "Great Escape",
    rating: 5,
    image: "/images/review-3.jpg",
  },
];

export default function FourthPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTestimonial = testimonials[activeIndex] ?? testimonials[0];

  const showPreviousTestimonial = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1,
    );
  };

  const showNextTestimonial = () => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % testimonials.length);
  };

  return (
    <section className="relative min-h-dvh overflow-hidden text-cream">
      <motion.div
        className="relative min-h-[68dvh] overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.85, ease: "easeOut" }}
      >
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={activeTestimonial.image}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{
              opacity: { duration: 0.65, ease: "easeInOut" },
              scale: { duration: 1, ease: "easeOut" },
            }}
          >
            <Image
              src={activeTestimonial.image}
              alt={`${activeTestimonial.stay} resort view`}
              fill
              className="object-cover"
              sizes="100vw"
              priority={activeIndex === 0}
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-brown/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-brown/10 via-brown/15 to-till/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-brown/10 via-transparent to-brown/20" />

        <div className="pointer-events-none absolute inset-x-[5dvw] inset-y-0 grid grid-cols-4 border-x border-cream/15 md:grid-cols-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="border-r border-cream/15 last:border-r-0"
            />
          ))}
        </div>

        <motion.div
          className="relative z-10 flex min-h-[68dvh] items-center px-[5dvw] pb-32 pt-24 md:pb-40"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.14,
              },
            },
          }}
        >
          <div>
            <motion.p
              className="font-googlesansflex text-sm font-semibold uppercase"
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.55, ease: "easeOut" },
                },
              }}
            >
              Testimonial
            </motion.p>
            <motion.div
              className="mt-3 h-px w-24 bg-tan"
              variants={{
                hidden: { opacity: 0, scaleX: 0 },
                visible: {
                  opacity: 1,
                  scaleX: 1,
                  transition: { duration: 0.6, ease: "easeOut" },
                },
              }}
            />
            <motion.h2
              className="mt-6 max-w-3xl font-heading text-5xl leading-[0.95] md:text-7xl"
              variants={{
                hidden: { opacity: 0, y: 32 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.75, ease: "easeOut" },
                },
              }}
            >
              Guest Said About
              <span className="mt-2 flex items-center gap-5 md:gap-7">
                <Separator className="max-w-10 border border-tan md:max-w-24" />
                <span>Our Resort</span>
              </span>
            </motion.h2>
          </div>
        </motion.div>
      </motion.div>

      <div className="relative min-h-[32dvh] md:px-[5dvw] md:pb-16">
        <div className="pointer-events-none absolute inset-x-[5dvw] inset-y-0 grid grid-cols-4 border-x border-cream/15 md:grid-cols-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="border-r border-cream/15 last:border-r-0"
            />
          ))}
        </div>

        <motion.article
          className="relative z-10 ml-auto -mt-28 grid w-full gap-9 border border-cream/35 bg-till p-6 shadow-2xl shadow-brown/15 md:-mt-40 md:max-w-[48rem] md:p-10"
          initial={{ opacity: 0, y: 42 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between gap-4">
            <div
              className="flex gap-2 text-tan"
              aria-label={`${activeTestimonial.rating} star rating`}
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`size-6 md:size-7 ${
                    index < activeTestimonial.rating
                      ? "fill-current"
                      : "fill-transparent opacity-60"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2 md:hidden">
              <Button
                type="button"
                size="icon"
                onClick={showPreviousTestimonial}
                className="size-9 rounded-full bg-cream text-brown hover:bg-stone"
                aria-label="Previous testimonial"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                onClick={showNextTestimonial}
                className="size-9 rounded-full bg-tan text-brown hover:bg-khaki"
                aria-label="Next testimonial"
              >
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={activeTestimonial.quote}
              className="font-googlesansflex text-xl font-medium italic leading-8 text-cream/90 md:text-2xl md:leading-10"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {activeTestimonial.quote}
            </motion.p>
          </AnimatePresence>

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial.guest}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <h3 className="font-googlesansflex text-xl font-semibold text-cream">
                  {activeTestimonial.guest}
                </h3>
                <p className="mt-2 font-googlesansflex text-sm font-semibold text-tan">
                  {activeTestimonial.stay}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="hidden gap-3 md:flex">
              <Button
                type="button"
                size="icon"
                onClick={showPreviousTestimonial}
                className="rounded-full bg-cream text-brown hover:bg-stone"
                aria-label="Previous testimonial"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                onClick={showNextTestimonial}
                className="rounded-full bg-tan text-brown hover:bg-khaki"
                aria-label="Next testimonial"
              >
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </motion.article>
      </div>
    </section>
  );
}
