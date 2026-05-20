"use client";

import { FormEvent, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useSubscribe } from "@/hooks/use-subscribe";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialog,
  AlertDialogFooter,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

const policyContent = {
  privacy: {
    title: "Privacy Policy",
    description:
      "We only collect booking details needed to process reservations and guest support. Contact details are used for confirmation and updates, and are not sold to third parties.",
  },
  terms: {
    title: "Terms and Conditions",
    description:
      "Bookings are confirmed after required guest details are submitted and 50% down payment is acknowledged. Guests are expected to follow resort safety rules, respect facilities, and avoid disruptive behavior during their stay.",
  },
  refund: {
    title: "Refund Policy",
    description:
      "Refunds are available for cancellations made at least 2 to 3 days before the scheduled check-in date. Late cancellations and no-shows may be non-refundable depending on booking status.",
  },
  support: {
    title: "Support",
    description:
      "For booking updates, schedule changes, or general concerns, contact resort support through the official Facebook page or front desk contact channels during operating hours.",
  },
} as const;

type PolicyKey = keyof typeof policyContent;

export default function Footer() {
  const shouldReduceMotion = useReducedMotion();
  const [activePolicy, setActivePolicy] = useState<PolicyKey | null>(null);
  const [isAntiBotModalOpen, setIsAntiBotModalOpen] = useState(false);
  const [antiBotTitle, setAntiBotTitle] = useState("Request Blocked");
  const [antiBotMessage, setAntiBotMessage] = useState("");
  const [pendingSubscribe, setPendingSubscribe] = useState<{
    email: string;
    website: string;
    formStartedAt: number;
  } | null>(null);
  const [isConfirmMode, setIsConfirmMode] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [formStartedAt] = useState(() => Date.now());
  const { subscribe, isLoading } = useSubscribe();
  const activePolicyData = activePolicy ? policyContent[activePolicy] : null;
  const sectionAnimation = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.55, ease: "easeOut" as const },
      };

  const handleSubscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const elapsed = Date.now() - formStartedAt;

    if (website.trim().length > 0) {
      setAntiBotTitle("Request Blocked");
      setAntiBotMessage("Bot-like submission detected. Request was blocked.");
      setIsAntiBotModalOpen(true);
      return;
    }

    if (elapsed < 1500) {
      setAntiBotTitle("Request Blocked");
      setAntiBotMessage(
        "Submission was too fast. Please wait a moment and try again.",
      );
      setIsAntiBotModalOpen(true);
      return;
    }

    setPendingSubscribe({
      email: subscriberEmail,
      website,
      formStartedAt,
    });
    setIsConfirmMode(true);
    setAntiBotTitle("Verify Submission");
    setAntiBotMessage(
      "Anti-bot checks passed. Continue and submit this email to the database?",
    );
    setIsAntiBotModalOpen(true);
  };

  const continueSubscribe = async () => {
    if (!pendingSubscribe) return;

    try {
      const message = await subscribe(pendingSubscribe);
      setAntiBotTitle("Anti-bot Verified");
      setAntiBotMessage(
        "Request passed anti-bot checks and your subscription was accepted.",
      );
      setIsConfirmMode(false);
      setSubscriberEmail("");
      setWebsite("");
      setPendingSubscribe(null);
      toast.success("Subscribed", { description: message });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Please try again later.";

      if (
        /request rejected|too many requests|too many attempts/i.test(message)
      ) {
        setAntiBotTitle("Request Blocked");
        setAntiBotMessage(message);
        setIsAntiBotModalOpen(true);
      }
      setPendingSubscribe(null);
      setIsConfirmMode(false);

      toast.error("Subscription failed", {
        description: message,
      });
    }
  };

  const copyPhoneNumber = async () => {
    try {
      await navigator.clipboard.writeText("+63 928 803 6865");
      toast.success("Phone number copied");
    } catch {
      toast.error("Unable to copy phone number");
    }
  };

  const linkUrl = (url = "https://www.facebook.com/profile.php?id=61589851403999") => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <footer className="relative w-full overflow-hidden border-t border-brown/20 bg-gradient-to-b from-cream via-cream to-amber-50/70 text-brown">
        <div className="mx-auto flex w-full md:max-w-[90dvw] max-w-[98dvw] flex-col px-5 pb-8 pt-16 sm:px-8 md:pt-20">
          <motion.div
            {...sectionAnimation}
            className="mb-10 flex items-center justify-center gap-4 md:mb-14"
          >
            <Separator className="hidden border border-brown/35 md:block md:w-24" />
            <img
              src={"logo/logo.png"}
              alt="Logo"
              className="h-20 w-auto sm:h-24 md:h-28"
            />
            <Separator className="hidden border border-brown/35 md:block md:w-24" />
          </motion.div>

          <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-14 md:gap-10">
            <motion.div
              {...sectionAnimation}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="md:col-span-4"
            >
              <div className="rounded-xl border border-brown/15 bg-white/45 p-6 shadow-sm backdrop-blur-[1px]">
                <h3 className="font-googlesansflex text-2xl font-semibold tracking-tight">
                  About Us
                </h3>
                <p className="cormorant-garamond mt-3 max-w-prose text-[1.05rem] leading-7 text-brown/85">
                  Our resort is located at Zone 8 Basagan, Tabaco City, And we
                  welcomed families and friends with relaxing day stays, scenic
                  views, and warm local hospitality.
                </p>
                <div className="mt-5 flex items-center gap-3">
                  {["facebook"].map((social) => (
                    <motion.img
                      key={social}
                      whileHover={
                        shouldReduceMotion ? {} : { y: -2, scale: 1.04 }
                      }
                      onClick={() => linkUrl()}
                      transition={{ duration: 0.2 }}
                      className="h-10 w-10 cursor-pointer rounded-sm border border-brown/10 bg-white/60 p-1.5"
                      src={`svg/${social}.svg`}
                      alt={social[0].toUpperCase() + social.slice(1)}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={copyPhoneNumber}
                    className="rounded-md border border-brown/20 bg-white/70 px-3 py-2 text-sm font-medium text-brown transition-colors hover:bg-brown/5"
                    aria-label="Copy phone number"
                  >
                    +63 928 803 6865
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div
              {...sectionAnimation}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="md:col-span-6"
            >
              <div className="rounded-xl border border-brown/15 bg-white/45 p-6 shadow-sm backdrop-blur-[1px]">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="min-w-0 flex flex-col gap-3">
                    <h3 className="font-googlesansflex text-xl font-semibold tracking-tight">
                      Hours
                    </h3>
                    <div className="space-y-2 text-brown/85">
                      <span className="flex min-w-0 items-start gap-2 text-sm sm:text-base">
                        <span className="mt-3 h-px w-4 shrink-0 bg-brown/30" />
                        <span className="min-w-0 flex-1 leading-7">
                          Monday - Friday: 7am - 6pm
                        </span>
                      </span>
                      <span className="flex min-w-0 items-start gap-2 text-sm sm:text-base">
                        <span className="mt-3 h-px w-4 shrink-0 bg-brown/30" />
                        <span className="min-w-0 flex-1 leading-7">
                          Saturday - Sunday: 8am - 6pm
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex flex-col gap-3">
                    <h3 className="font-googlesansflex text-xl font-semibold tracking-tight">
                      Terms
                    </h3>
                    <div className="space-y-1.5">
                      {(Object.keys(policyContent) as PolicyKey[]).map(
                        (key) => (
                          <motion.button
                            key={key}
                            type="button"
                            onClick={() => setActivePolicy(key)}
                            whileHover={shouldReduceMotion ? {} : { x: 3 }}
                            className="flex min-w-0 w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm text-brown/90 transition-colors hover:bg-brown/5 sm:text-base"
                          >
                            <span className="mt-3 h-px w-4 shrink-0 bg-brown/30" />
                            <span className="min-w-0 flex-1 leading-7">
                              {policyContent[key].title}
                            </span>
                          </motion.button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              {...sectionAnimation}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="md:col-span-4"
            >
              <div className="rounded-xl border border-brown/15 bg-white/45 p-6 shadow-sm backdrop-blur-[1px]">
                <h3 className="font-googlesansflex text-xl font-semibold capitalize tracking-tight">
                  Subscribe to our newsletter
                </h3>
                <p className="mt-2 text-sm text-brown/80">
                  Get updates on promos, schedules, and resort news.
                </p>
                <form
                  className="relative mt-4 w-full"
                  onSubmit={handleSubscribe}
                >
                  <Input
                    type="email"
                    value={subscriberEmail}
                    onChange={(event) => setSubscriberEmail(event.target.value)}
                    required
                    className="h-12 rounded-md border-2 border-brown/55 bg-cream/80 pr-14"
                    placeholder="Enter your email"
                  />
                  <input
                    type="text"
                    name="website"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    className="sr-only"
                    aria-hidden="true"
                  />
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={shouldReduceMotion ? {} : { scale: 1.06 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    aria-label="Subscribe"
                  >
                    <ArrowRight className="h-8 w-8 cursor-pointer rounded-md bg-till p-1.5 text-accent-foreground shadow-sm" />
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>

          <Separator className="my-7 border-brown/20" />
          <motion.div
            {...sectionAnimation}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="flex min-h-[60px] w-full flex-col items-center justify-between gap-2 text-center text-sm text-brown/80 md:flex-row md:text-left"
          >
            <p>Hotel and Resort created by Alro John Mercado</p>
            <p>
              Copyright &copy; {new Date().getFullYear()} All rights reserved.
            </p>
          </motion.div>
        </div>
      </footer>

      <AlertDialog
        open={isAntiBotModalOpen}
        onOpenChange={setIsAntiBotModalOpen}
      >
        <AlertDialogContent className="rounded-none bg-cream text-brown sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-3xl">
              {antiBotTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-googlesansflex text-brown/80">
              {antiBotMessage ||
                "Your request was blocked by our anti-bot checks. Please try again in a moment."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {isConfirmMode ? (
              <>
                <AlertDialogCancel
                  className="rounded-none"
                  onClick={() => {
                    setPendingSubscribe(null);
                    setIsConfirmMode(false);
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-none bg-brown text-cream hover:bg-brown/90"
                  onClick={continueSubscribe}
                >
                  Continue
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction className="rounded-none bg-brown text-cream hover:bg-brown/90">
                Close
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={activePolicy !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setActivePolicy(null);
        }}
      >
        <AlertDialogContent className="rounded-none bg-cream text-brown sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-3xl">
              {activePolicyData?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-googlesansflex text-brown/80">
              {activePolicyData?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="rounded-none bg-brown text-cream hover:bg-brown/90">
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
