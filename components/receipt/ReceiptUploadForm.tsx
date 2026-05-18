"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ReceiptUploadFormProps = {
  receiptId: string;
  disabled: boolean;
  isPaid: boolean;
};

type UploadConfirmation = {
  status: string;
  proofFileName: string | null;
  proofUploadedAt: string | null;
  paidAt: string | null;
};

function getRedirectUrl() {
  if (typeof window === "undefined") return "https://tiripon-resort.vercel.app";

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  return isLocalhost
    ? "http://localhost:3000"
    : "https://tiripon-resort.vercel.app";
}

function formatDateTime(value: string | null) {
  if (!value) return "Just now";

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ReceiptUploadForm({
  receiptId,
  disabled,
  isPaid,
}: ReceiptUploadFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmation, setConfirmation] = useState<UploadConfirmation | null>(
    null,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsUploading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(`/api/receipts/${receiptId}/upload`, {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        error?: string;
        message?: string;
        receipt?: UploadConfirmation;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Receipt upload failed.");
      }

      setMessage(result.message ?? "Receipt uploaded.");
      setConfirmation(
        result.receipt ?? {
          status: "paid",
          proofFileName: null,
          proofUploadedAt: null,
          paidAt: null,
        },
      );
      form.reset();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Receipt upload failed.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (isPaid) {
    return (
      <p className="mt-6 rounded-xl bg-cream px-4 py-3 font-googlesansflex text-sm font-semibold leading-6 text-brown md:rounded-none">
        Your reservation receipt was submitted successfully and will be reviewed
        by our staff. You will receive an email confirmation once your payment
        has been verified. Thank you for choosing Tiripon Resort!
      </p>
    );
  }

  if (disabled) {
    return (
      <p className="mt-6 rounded-xl bg-cream px-4 py-3 font-googlesansflex text-sm font-semibold leading-6 text-brown md:rounded-none">
        This confirmation link has expired. Please contact the resort for a new
        reservation link.
      </p>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
        <label className="grid gap-2 font-googlesansflex text-sm font-semibold">
          Upload payment receipt
          <input
            type="file"
            name="proof"
            required
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="w-full min-w-0 rounded-xl bg-cream p-3 text-sm text-brown file:mb-2 file:mr-0 file:block file:rounded-full file:border-0 file:bg-brown file:px-4 file:py-2 file:text-cream sm:file:mb-0 sm:file:mr-4 sm:file:inline-flex md:rounded-none"
          />
        </label>
        <Button
          type="submit"
          disabled={isUploading}
          className="h-11 rounded-full bg-brown text-cream hover:bg-brown/90 md:rounded-none"
        >
          <Upload className="size-4" />
          {isUploading ? "Uploading..." : "Upload Receipt"}
        </Button>
        {(message || error) && (
          <p className="rounded-xl bg-cream px-4 py-3 font-googlesansflex text-sm leading-6 text-brown md:rounded-none">
            {message ?? error}
          </p>
        )}
      </form>

      <Dialog open={Boolean(confirmation)} onOpenChange={() => undefined}>
        <DialogContent
          showCloseButton={false}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-cream p-0 text-brown sm:max-w-lg md:rounded-none"
        >
          <div className="bg-tan px-5 py-5 sm:px-6">
            <DialogHeader>
              <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-cream text-brown">
                <CheckCircle2 className="size-7" />
              </div>
              <DialogTitle className="font-heading text-3xl leading-none text-brown sm:text-4xl">
                Payment Receipt Uploaded
              </DialogTitle>
              <DialogDescription className="font-googlesansflex leading-6 text-brown/75">
                Your reservation receipt was submitted successfully and will be
                reviewed by our staff. You will receive an email confirmation
                once your payment has been verified. Thank you for choosing
                Tiripon Resort!
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-4 p-5 font-googlesansflex sm:p-6">
            <div className="grid gap-2 border-b border-brown/15 pb-4">
              <span className="text-xs font-semibold uppercase text-brown/60">
                Status
              </span>
              <span className="text-xl font-semibold capitalize">
                {confirmation?.status ?? "paid"}
              </span>
            </div>
            <div className="grid gap-2 border-b border-brown/15 pb-4">
              <span className="text-xs font-semibold uppercase text-brown/60">
                Uploaded File
              </span>
              <span className="break-words">
                {confirmation?.proofFileName ?? "Payment receipt"}
              </span>
            </div>
            <div className="grid gap-2">
              <span className="text-xs font-semibold uppercase text-brown/60">
                Confirmed At
              </span>
              <span>{formatDateTime(confirmation?.paidAt ?? null)}</span>
            </div>

            <Button
              asChild
              className="mt-4 h-11 rounded-full bg-brown text-cream hover:bg-brown/90 md:rounded-none"
            >
              <a href={getRedirectUrl()}>Return to Tiripon Resort</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
