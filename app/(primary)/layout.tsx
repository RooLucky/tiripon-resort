import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import MapDirectionsSection from "@/components/layout/MapDirectionsSection";
import { Toaster } from "@/components/ui/sonner";

export default function PrimaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-dvh relative bg-gradient-to-b from-accent via-cream/30 to-cream/70">
      <div className="absolute inset-x-0 top-0 z-50">
        <Header />
      </div>
      {children}
      <div className="pt-[10dvh]">
        <MapDirectionsSection />
      </div>
      <Footer />
      <Toaster position="bottom-right" />
    </section>
  );
}
