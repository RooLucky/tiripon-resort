import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

const adminEmail = "admin@tiriponresort.com";
const adminName = "Administrator";
const defaultPassword = "tiriponresort2026**";
const cottagesBucket = process.env.SUPABASE_COTTAGES_BUCKET ?? "cottages";

const defaultCottages = [
  {
    name: "Classic Cabana",
    description:
      "A straightforward day-use cabana setup with open-air comfort for quick family breaks.",
    price: 500,
    capacity: "10 - 12",
    imageFile: "cabana-1-500.png",
  },
  {
    name: "Poolside Cabana",
    description:
      "Steps from the water with shaded seating, ideal for guests who want easy pool access all day.",
    price: 400,
    capacity: "10 - 12",
    imageFile: "cabana-2-400.png",
  },
  {
    name: "Garden Cabana",
    description:
      "Set beside lush greenery with a quieter atmosphere, designed for laid-back gatherings and privacy.",
    price: 400,
    capacity: "6 - 8",
    imageFile: "cabana-3-400.png",
  },
  {
    name: "5ft Cottage",
    description:
      "Compact 5ft cottage option for small groups seeking a simple shaded stay near resort amenities.",
    price: 400,
    capacity: "6 - 8",
    imageFile: null,
  },
  {
    name: "Family Cabana",
    description:
      "A wider cabana layout with extra seating space, suited for bigger groups and all-day stays.",
    price: 300,
    capacity: "5",
    imageFile: "cabana-6-300.png",
  },
  {
    name: "Small Umbrella",
    description:
      "Compact shaded umbrella setup for light day-use stays and quick poolside breaks.",
    price: 200,
    capacity: "2 - 4",
    imageFile: "small-umbrella-200.png",
  },
  {
    name: "Standard Umbrella",
    description:
      "Standard umbrella space with comfortable shade, suited for small groups and casual stays.",
    price: 250,
    capacity: "4 - 6",
    imageFile: "standard-umbrella-250.png",
  },
] as const;

function loadEnvFile() {
  const envPath = join(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    process.env[key] ??= value;
  }
}

async function main() {
  loadEnvFile();

  const password = await bcrypt.hash(defaultPassword, 10);



  const user = await prisma.user.upsert({
    where: {
      email: adminEmail,
    },
    update: {
      name: adminName,
      password,
    },
    create: {
      email: adminEmail,
      name: adminName,
      password,
    },
  });

  console.log(`Seeded user: ${user.email}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials for cottage image seed.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const cottage of defaultCottages) {
    const existing = await prisma.cottages.findFirst({
      where: { name: cottage.name },
      select: { id: true },
    });

    const uploaded = existing
      ? await prisma.cottages.update({
        where: { id: existing.id },
        data: {
          description: cottage.description,
          price: cottage.price,
          capacity: cottage.capacity,
          imageUrl: cottage.imageFile ? undefined : null,
        },
      })
      : await prisma.cottages.create({
        data: {
          name: cottage.name,
          description: cottage.description,
          price: cottage.price,
          capacity: cottage.capacity,
          imageUrl: null,
        },
      });

    if (!cottage.imageFile) {
      console.log(`Seeded cottage: ${uploaded.name} (no image)`);
      continue;
    }

    const imageAbsolutePath = join(
      process.cwd(),
      "public",
      "images",
      "cottages",
      cottage.imageFile,
    );

    if (!existsSync(imageAbsolutePath)) {
      throw new Error(`Missing cottage image file: ${imageAbsolutePath}`);
    }

    const extension = cottage.imageFile.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `cottage-${uploaded.id}/seed-${Date.now()}.${extension}`;
    const fileBuffer = readFileSync(imageAbsolutePath);

    const { error: uploadError } = await supabase.storage
      .from(cottagesBucket)
      .upload(filePath, fileBuffer, {
        upsert: true,
        contentType:
          extension === "png"
            ? "image/png"
            : extension === "webp"
              ? "image/webp"
              : "image/jpeg",
      });

    if (uploadError) {
      throw new Error(
        `Failed to upload ${cottage.imageFile}: ${uploadError.message}`,
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(cottagesBucket)
      .getPublicUrl(filePath);

    await prisma.cottages.update({
      where: { id: uploaded.id },
      data: {
        imageUrl: publicUrlData.publicUrl,
      },
    });

    console.log(`Seeded cottage: ${uploaded.name}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
