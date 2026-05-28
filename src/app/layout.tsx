import type { Metadata } from "next";
import "./globals.css";
import { MainNav } from "@/components/main-nav";

export const metadata: Metadata = {
  title: "CDPastillero · DIFED",
  description: "Calendario de medicación",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen">
          <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
            <div className="container flex h-14 items-center justify-between gap-2">
              <span className="text-lg font-bold tracking-tight sm:text-xl">
                <span className="text-primary">CDP</span>
                <span className="text-amber-500">astillero</span>
              </span>
              <MainNav />
            </div>
          </header>
          <main className="container py-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
