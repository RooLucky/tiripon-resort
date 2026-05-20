import { prisma } from "@/lib/prisma";
import { getCottagesBucketName, getSupabaseAdminClient } from "@/lib/supabase-server";

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

export async function GET(
  _request: Request,
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
  return Response.json({ cottage });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cottageId = id.trim();
  if (!cottageId) {
    return Response.json({ error: "Invalid cottage id." }, { status: 400 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const capacity = typeof body.capacity === "string" ? body.capacity.trim() : "";
  const price = typeof body.price === "number" ? body.price : Number(body.price);
  const quantity =
    typeof body.quantity === "number" ? body.quantity : Number(body.quantity);

  if (!name || !description || !capacity || !Number.isFinite(price) || price < 0 || !Number.isFinite(quantity) || quantity < 1) {
    return Response.json({ error: "Invalid cottage payload." }, { status: 400 });
  }

  const cottage = await prisma.cottages.update({
    where: { id: cottageId },
    data: { name, description, capacity, price, quantity: Math.floor(quantity) },
  });
  return Response.json({ cottage });
}

export async function DELETE(
  _request: Request,
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

  const filePath = extractCottagePathFromUrl(cottage.imageUrl);
  if (filePath) {
    const supabase = getSupabaseAdminClient();
    const bucket = getCottagesBucketName();
    await supabase.storage.from(bucket).remove([filePath]);
  }

  await prisma.cottages.delete({ where: { id: cottageId } });
  return Response.json({ success: true });
}
