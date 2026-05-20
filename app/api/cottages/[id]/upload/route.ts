import { getCottagesBucketName, getSupabaseAdminClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function extractCottagePathFromUrl(value: string | null) {
  if (!value) return null;
  const publicMarker = "/storage/v1/object/public/cottages/";
  const signedMarker = "/storage/v1/object/sign/cottages/";
  const marker = value.includes(publicMarker) ? publicMarker : signedMarker;
  if (!value.includes(marker)) return null;
  const raw = value.split(marker)[1] ?? "";
  const path = raw.split("?")[0] ?? "";
  return path.trim() || null;
}

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  return file.type.split("/").pop() ?? "file";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cottageId = id.trim();
  if (!cottageId) {
    return Response.json({ error: "Invalid cottage id." }, { status: 400 });
  }

  const cottage = await prisma.cottages.findUnique({ where: { id: cottageId } });
  if (!cottage) {
    return Response.json({ error: "Cottage not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const image = formData.get("image");
  if (!(image instanceof File)) {
    return Response.json({ error: "Please upload a cottage image." }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.has(image.type)) {
    return Response.json({ error: "Only JPG, PNG, or WEBP images are allowed." }, { status: 400 });
  }
  if (image.size > MAX_FILE_SIZE) {
    return Response.json({ error: "Image file must be 5MB or smaller." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const bucket = getCottagesBucketName();
  const extension = getFileExtension(image);
  const filePath = `cottage-${cottage.id}/image-${Date.now()}.${extension}`;
  const fileBuffer = Buffer.from(await image.arrayBuffer());

  const existingPath = extractCottagePathFromUrl(cottage.imageUrl);
  if (existingPath) {
    await supabase.storage.from(bucket).remove([existingPath]);
  }

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, { contentType: image.type, upsert: false });
  if (uploadError) {
    return Response.json({ error: `Image upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 7 * 24 * 60 * 60);
  if (signedUrlError) {
    return Response.json({ error: `Image link creation failed: ${signedUrlError.message}` }, { status: 500 });
  }

  const updatedCottage = await prisma.cottages.update({
    where: { id: cottage.id },
    data: { imageUrl: signedUrlData.signedUrl },
  });

  return Response.json({ cottage: updatedCottage, imageUrl: signedUrlData.signedUrl });
}
