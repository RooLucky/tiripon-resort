import { sendAdminPaymentNotification } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getReceiptsBucketName, getSupabaseAdminClient } from "@/lib/supabase-server";

const RECEIPT_LINK_TTL_MS = 30 * 60 * 1000;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();

  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  return file.type.split("/").pop() ?? "file";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const receiptId = id.trim();

  if (!receiptId) {
    return Response.json({ error: "Invalid receipt id." }, { status: 400 });
  }

  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: { booking: true },
  });

  if (!receipt) {
    return Response.json({ error: "Receipt not found." }, { status: 404 });
  }

  if (receipt.status === "paid") {
    return Response.json(
      { error: "This receipt has already been confirmed." },
      { status: 409 },
    );
  }

  const expiresAt = receipt.createdAt.getTime() + RECEIPT_LINK_TTL_MS;

  if (Date.now() > expiresAt) {
    return Response.json(
      { error: "This receipt confirmation link has expired." },
      { status: 410 },
    );
  }

  const formData = await request.formData();
  const proof = formData.get("proof");

  if (!(proof instanceof File)) {
    return Response.json({ error: "Please upload a receipt file." }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(proof.type)) {
    return Response.json(
      { error: "Only JPG, PNG, WEBP, or PDF receipt files are allowed." },
      { status: 400 },
    );
  }

  if (proof.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: "Receipt file must be 5MB or smaller." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdminClient();
  const bucket = getReceiptsBucketName();
  const extension = getFileExtension(proof);
  const filePath = `receipt-${receipt.id}/proof-${Date.now()}.${extension}`;
  const fileBuffer = Buffer.from(await proof.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: proof.type,
      upsert: false,
    });

  if (uploadError) {
    return Response.json(
      { error: `Receipt upload failed: ${uploadError.message}` },
      { status: 500 },
    );
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 7 * 24 * 60 * 60);

  if (signedUrlError) {
    return Response.json(
      { error: `Receipt link creation failed: ${signedUrlError.message}` },
      { status: 500 },
    );
  }

  const now = new Date();
  const updatedReceipt = await prisma.receipt.update({
    where: { id: receipt.id },
    data: {
      status: "paid",
      proofFilePath: filePath,
      proofFileName: proof.name,
      proofMimeType: proof.type,
      proofViewUrl: signedUrlData.signedUrl,
      proofUploadedAt: now,
      paidAt: now,
    },
  });

  try {
    await sendAdminPaymentNotification({
      name: receipt.booking.name,
      email: receipt.booking.email,
      phone: receipt.booking.phone,
      checkIn: receipt.booking.checkIn,
      checkOut: receipt.booking.checkOut,
      totalPrice: receipt.booking.total_price,
      downPaymentAmount: receipt.downPaymentAmount,
      proofFileName: updatedReceipt.proofFileName,
      proofViewUrl: updatedReceipt.proofViewUrl,
      paidAt: updatedReceipt.paidAt,
    });
  } catch (error) {
    console.error("Failed to send admin payment notification", error);
  }

  return Response.json({
    receipt: updatedReceipt,
    proofUrl: signedUrlData.signedUrl,
    message: "Receipt uploaded and reservation payment recorded.",
  });
}
