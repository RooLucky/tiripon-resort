import { CottagesTable } from "@/components/admin/cottages-table";
import { prisma } from "@/lib/prisma";
import { getCottagesBucketName, getSupabaseAdminClient } from "@/lib/supabase-server";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function CottagePage() {
  const cottagesRaw = await prisma.cottages.findMany({
    orderBy: { createdAt: "desc" },
  });
  const supabase = getSupabaseAdminClient();
  const bucket = getCottagesBucketName();
  const cottages = await Promise.all(
    cottagesRaw.map(async (cottage) => {
      if (!cottage.imageUrl) return cottage;
      const path = cottage.imageUrl.split("/cottages/")[1]?.split("?")[0];
      if (!path) return cottage;
      const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
      return { ...cottage, imageUrl: data?.signedUrl ?? cottage.imageUrl };
    }),
  );

  const rows = cottages.map((cottage) => ({
    id: cottage.id,
    name: cottage.name,
    description: cottage.description,
    price: formatCurrency(cottage.price),
    capacity: cottage.capacity,
    quantity: cottage.quantity,
    imageUrl: cottage.imageUrl,
    createdAt: formatDate(cottage.createdAt),
  }));

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Cottages</h1>
        <p className="text-sm text-muted-foreground">
          Manage available cottages and create new inventory items.
        </p>
      </div>

      <CottagesTable cottages={rows} />
    </main>
  );
}
