"use client";

import Image from "next/image";
import { ArrowRight, MoveLeft, MoveRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";

const resortSlides = [
  {
    name: "Quiet Place",
    description:
      "A calm corner for slow mornings and restful afternoons, with open skies and a peaceful Mt. Mayon view in the distance.",
    image: "/images/2.png",
  },
  {
    name: "Golden Hours",
    description:
      "Settle into soft afternoon light and quiet conversations while the landscape opens toward the Mt. Mayon horizon.",
    image: "/images/3.png",
  },
  {
    name: "Breathe and Gather",
    description:
      "Wide, airy spaces made for shared moments, where breezy interiors and the distant Mt. Mayon view shape a relaxed day.",
    image: "/images/4.png",
  },
  {
    name: "Private Retreat",
    description:
      "Surrounded by greenery and gentle breeze, this peaceful retreat offers quiet privacy with glimpses of Mt. Mayon beyond.",
    image: "/images/5.png",
  },
];

export default function ThirdPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoplay = () => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
    }

    autoplayRef.current = setInterval(() => {
      setActiveIndex(
        (currentIndex) => (currentIndex + 1) % resortSlides.length,
      );
    }, 10000);
  };

  useEffect(() => {
    startAutoplay();

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, []);

  const handleSlideSelect = (index: number) => {
    setActiveIndex(index);
    startAutoplay();
  };

  const handlePreviousSlide = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? resortSlides.length - 1 : currentIndex - 1,
    );
    startAutoplay();
  };

  const handleNextSlide = () => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % resortSlides.length);
    startAutoplay();
  };

  const activeSlide = resortSlides[activeIndex] ?? resortSlides[0];

  return (
    <section className="min-h-dvh w-full px-2 py-10 sm:px-5 md:px-[5dvw] md:py-20">
      <motion.div
        className="mx-auto grid w-full max-w-[92rem] gap-10 md:grid-cols-[0.9fr_1.9fr]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.16,
            },
          },
        }}
      >
        <motion.aside
          className="relative z-30 flex flex-col gap-6 rounded-2xl border border-brown/10 bg-cream/45 p-5 shadow-sm md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none"
          variants={{
            hidden: { opacity: 0, x: -34 },
            visible: {
              opacity: 1,
              x: 0,
              transition: { duration: 0.75, ease: "easeOut" },
            },
          }}
        >
          <div>
            <p className="font-googlesansflex text-sm font-semibold uppercase text-brown">
              Tiripon Spring Resort
            </p>
            <div className="mt-2 h-px w-24 bg-tan" />
            <h2 className="mt-5 max-w-sm font-heading text-[1.85rem] leading-[0.95] text-brown sm:text-4xl md:mt-6 md:text-5xl">
              A Day At Spring Resort
            </h2>
          </div>

          <div className="relative z-30 flex flex-col items-start gap-2">
            {resortSlides.map((slide, index) => (
              <Button
                key={slide.name}
                type="button"
                variant="ghost"
                onClick={() => handleSlideSelect(index)}
                aria-pressed={index === activeIndex}
                className={`mb-2 h-auto justify-start rounded-none bg-transparent p-0 text-left font-googlesansflex text-[1.7rem] leading-none shadow-none hover:bg-transparent focus-visible:ring-brown/30 sm:text-4xl ${
                  index === activeIndex
                    ? "text-brown"
                    : "text-brown/55 hover:text-brown/80"
                }`}
              >
                {slide.name}
              </Button>
            ))}
            <p className="mt-4 max-w-md font-googlesansflex text-[0.98rem] leading-7 text-brown/75 sm:text-lg sm:leading-8">
              {activeSlide.description}
            </p>
          </div>
        </motion.aside>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 38 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.75, ease: "easeOut" },
            },
          }}
        >
          <motion.div
            className="mb-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between"
            variants={{
              hidden: { opacity: 0, y: 22 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.65, ease: "easeOut" },
              },
            }}
          >
            <p className="max-w-2xl font-googlesansflex text-base leading-7 text-brown/65 md:text-lg md:leading-8">
              Tiripon Spring Resort is designed for refreshing day escapes, with
              open-air cottages, poolside lounging, and natural spring water
              experiences that keep every visit calm, cool, and easy.
            </p>
          </motion.div>

          <motion.div
            className="group/carousel relative"
            variants={{
              hidden: { opacity: 0, scale: 0.97 },
              visible: {
                opacity: 1,
                scale: 1,
                transition: { duration: 0.75, ease: "easeOut" },
              },
            }}
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-tan sm:aspect-[16/10]">
              <AnimatePresence initial={false} mode="sync">
                <motion.div
                  key={activeSlide.name}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1.025 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.985 }}
                  transition={{
                    opacity: { duration: 0.65, ease: "easeInOut" },
                    scale: { duration: 0.9, ease: "easeOut" },
                  }}
                >
                  <Image
                    src={activeSlide.image}
                    alt={activeSlide.name}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 66vw, 90vw"
                    priority={activeIndex === 0}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <Button
              type="button"
              size="icon-lg"
              onClick={handlePreviousSlide}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 z-40 hidden size-11 -translate-y-1/2 rounded-full border border-cream bg-tan/95 text-brown opacity-0 shadow-md transition-opacity duration-200 hover:bg-khaki group-hover/carousel:opacity-100 md:flex md:size-12"
            >
              <MoveLeft className="size-5 sm:size-6 md:size-8" />
            </Button>
            <Button
              type="button"
              size="icon-lg"
              onClick={handleNextSlide}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 z-40 hidden size-11 -translate-y-1/2 rounded-full border border-cream bg-tan/95 text-brown opacity-0 shadow-md transition-opacity duration-200 hover:bg-khaki group-hover/carousel:opacity-100 md:flex md:size-12"
            >
              <MoveRight className="size-5 sm:size-6 md:size-8" />
            </Button>
            <div className="mt-4 flex items-center justify-center gap-2 md:hidden">
              <Button
                type="button"
                onClick={handlePreviousSlide}
                variant="outline"
                size="icon-sm"
                className="h-8 w-8 rounded-full border-brown/30 bg-transparent text-brown hover:bg-khaki/40"
                aria-label="Previous slide"
              >
                <MoveLeft className="size-4" />
              </Button>
              <div
                className="flex items-center justify-center gap-2"
                aria-label="Select resort image"
              >
                {resortSlides.map((slide, index) => (
                  <button
                    key={slide.name}
                    type="button"
                    onClick={() => handleSlideSelect(index)}
                    aria-label={`Show ${slide.name}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                    className={`h-2.5 rounded-full transition-all ${
                      index === activeIndex
                        ? "w-8 bg-brown"
                        : "w-2.5 bg-brown/30"
                    }`}
                  />
                ))}
              </div>
              <Button
                type="button"
                onClick={handleNextSlide}
                variant="outline"
                size="icon-sm"
                className="h-8 w-8 rounded-full border-brown/30 bg-transparent text-brown hover:bg-khaki/40"
                aria-label="Next slide"
              >
                <MoveRight className="size-4" />
              </Button>
            </div>
            <div
              className="mt-4 hidden items-center justify-center gap-2 md:flex"
              aria-label="Select resort image"
            >
              {resortSlides.map((slide, index) => (
                <button
                  key={slide.name}
                  type="button"
                  onClick={() => handleSlideSelect(index)}
                  aria-label={`Show ${slide.name}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeIndex ? "w-8 bg-brown" : "w-2.5 bg-brown/30"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
