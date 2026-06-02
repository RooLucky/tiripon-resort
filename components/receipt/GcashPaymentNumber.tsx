"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type GcashPaymentNumberProps = {
  number: string;
};

export function GcashPaymentNumber({ number }: GcashPaymentNumberProps) {
  const [copied, setCopied] = useState(false);

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-3 grid gap-2 rounded-xl bg-cream p-3 font-googlesansflex text-brown md:rounded-none">
      <span className="text-xs font-semibold uppercase tracking-wide text-brown/60">
        GCash number
      </span>
      <p className="text-sm font-semibold leading-5 text-brown">
        GCash only transaction
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="break-all text-lg font-semibold tracking-wide">
          {number}
        </span>
        <Button
          type="button"
          onClick={copyNumber}
          className="h-10 rounded-full bg-brown text-cream hover:bg-brown/90 md:rounded-none"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
