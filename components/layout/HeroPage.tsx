"use client";

import { ArrowRightFromLine } from "lucide-react";
import { animate, motion } from "framer-motion";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { redirect } from "next/navigation";

export default function HeroPage() {
  const scrollToBooking = () => {
    const bookingSection = document.getElementById("booking");

    if (!bookingSection) return;

    const targetY = bookingSection.getBoundingClientRect().top + window.scrollY;

    animate(window.scrollY, targetY, {
      duration: 1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => window.scrollTo(0, latest),
    });
  };

  const redirectToBooking = () => {
    redirect("/reservation");
  };

  return (
    <motion.div
      className="relative h-dvh w-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
    >
      {/* Background Image */}
      <motion.img
        src="/images/mayones.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover bg-no-repeat"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      {/* <div className="absolute inset-0 bg-white/10" /> */}
      {/* Overlay */}
      <div className="absolute inset-0 z-10 ">
        <div className="z-10 w-full h-full  flex flex-row justify-between items-center">
          <div className="relative h-full w-full">
            {/* Blur/fade overlay only */}
            {/* <div className="absolute inset-0 bg-black/30 md:backdrop-blur-sm md:[mask-image:linear-gradient(to_right,black_55%,transparent)] md:[-webkit-mask-image:linear-gradient(to_right,black_90%,transparent)]" /> */}

            {/* Content stays fully visible */}
            <div className="relative flex h-full w-full items-center justify-start">
              <motion.div
                className="my-auto z-10 flex h-full max-h-[40dvh]  flex-col justify-around gap-4 px-[5dvw]"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      delayChildren: 0.25,
                      staggerChildren: 0.16,
                    },
                  },
                }}
              >
                <motion.h1
                  className="text-cream w-full md:text-9xl text-5xl font-heading capitalize"
                  style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
                  variants={{
                    hidden: { opacity: 0, y: 38 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.8, ease: "easeOut" },
                    },
                  }}
                >
                  Unlock your{" "}
                  <span className="flex items-center gap-4">
                    <Separator className="md:max-w-16 max-w-10 border border-cream" />
                    <span>best stays</span>
                  </span>
                </motion.h1>

                <motion.p
                  className="text-cream w-full md:max-w-[35dvw] rounded p-4 md:text-xl text-lg font-googlesansflex"
                  style={{ textShadow: "0 2px 8px rgba(0,0,0,1)" }}
                  variants={{
                    hidden: { opacity: 0, y: 26 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.7, ease: "easeOut" },
                    },
                  }}
                >
                  Escape to Tiripon Spring Resort and enjoy a refreshing
                  day-stay with scenic views, peaceful cabanas, and a relaxing
                  atmosphere for families and friends. Plan your visit in
                  minutes and reserve your preferred cottage with ease.
                </motion.p>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.6, ease: "easeOut" },
                    },
                  }}
                >
                  <Button
                    type="button"
                    onClick={scrollToBooking}
                    className="md:flex hidden h-12 w-48 cursor-pointer gap-4 rounded-full p-2 text-xl"
                  >
                    Book Now
                    <span className="flex items-center justify-center rounded-full bg-muted p-2">
                      <ArrowRightFromLine className="text-accent-foreground" />
                    </span>
                  </Button>

                  <Button
                    type="button"
                    onClick={redirectToBooking}
                    className="flex md:hidden h-12 w-48 cursor-pointer gap-4 rounded-full p-2 text-xl"
                  >
                    Book Now
                    <span className="flex items-center justify-center rounded-full bg-muted p-2">
                      <ArrowRightFromLine className="text-accent-foreground" />
                    </span>
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
          <div className="h-full w-full md:relative md:block hidden">
            {/* <motion.div
              className="p-4 md:absolute rounded md:bottom-30 md:left-24 z-50 flex md:h-[25dvh] md:max-w-[25dvw] w-full items-center justify-center bg-white/10 shadow-lg backdrop-blur-sm"
              initial={{ opacity: 0, x: 36 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.65, duration: 0.75, ease: "easeOut" }}
            >
              <div className="w-full h-full flex flex-row items-center capitalize gap-4 p-4">
                <h3 className="text-xl font-googlesansflex text-accent max-w-72">
                  Watch a video about us
                </h3>
                <div className="w-full h-full rounded overflow-hidden">
                  <video
                    src="/examples/vid-1.mp4"
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </motion.div> */}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
