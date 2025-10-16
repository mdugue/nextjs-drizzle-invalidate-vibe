import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/app/components/sidebar";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "Pulseboard",
  description:
    "Client-Server demo with Next.js, Drizzle, and cache invalidation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="grid min-h-screen grid-cols-[260px_1fr]">
            <Sidebar />
            <main className="flex flex-col gap-6 p-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
