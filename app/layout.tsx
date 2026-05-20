import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Tiripon Resort",
  description:
    "Tiripon Resort is a serene getaway nestled in the heart of nature, offering a perfect blend of tranquility and adventure. With its lush surroundings, comfortable accommodations, and a range of activities, Tiripon Resort is the ideal destination for those seeking relaxation and outdoor fun.",
  icons: "/logo/web.png",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
