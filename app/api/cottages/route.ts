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

export async function GET() {
  try {
    const cottagesRaw = await prisma.cottages.findMany({
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        capacity: true,
        quantity: true,
        imageUrl: true,
      },
    });

    const supabase = getSupabaseAdminClient();
    const bucket = getCottagesBucketName();
    const cottages = await Promise.all(
      cottagesRaw.map(async (cottage) => {
        const filePath = extractCottagePathFromUrl(cottage.imageUrl);
        if (!filePath) return cottage;
        const { data } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 60 * 60);
        return {
          ...cottage,
          imageUrl: data?.signedUrl ?? cottage.imageUrl,
        };
      }),
    );

    return Response.json({ cottages });
  } catch {
    const cottagesRaw = await prisma.cottages.findMany({
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        capacity: true,
        imageUrl: true,
      },
    });

    const supabase = getSupabaseAdminClient();
    const bucket = getCottagesBucketName();
    const cottages = await Promise.all(
      cottagesRaw.map(async (cottage) => {
        const filePath = extractCottagePathFromUrl(cottage.imageUrl);
        if (!filePath) return { ...cottage, quantity: 1 };
        const { data } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 60 * 60);
        return {
          ...cottage,
          quantity: 1,
          imageUrl: data?.signedUrl ?? cottage.imageUrl,
        };
      }),
    );

    return Response.json({
      cottages,
    });
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";
  const imageUrl =
    typeof payload.imageUrl === "string" && payload.imageUrl.trim().length > 0
      ? payload.imageUrl.trim()
      : null;
  const price =
    typeof payload.price === "number" ? payload.price : Number(payload.price);
  const capacity =
    typeof payload.capacity === "string" ? payload.capacity.trim() : "";
  const quantity =
    typeof payload.quantity === "number"
      ? payload.quantity
      : Number(payload.quantity);

  if (!name || !description || !Number.isFinite(price) || price < 0 || !capacity || !Number.isFinite(quantity) || quantity < 1) {
    return Response.json(
      { error: "Invalid cottage payload." },
      { status: 400 },
    );
  }

  const cottage = await prisma.cottages.create({
    data: {
      name,
      description,
      price,
      capacity,
      quantity: Math.floor(quantity),
      imageUrl,
    },
  });

  return Response.json({ cottage }, { status: 201 });
}
