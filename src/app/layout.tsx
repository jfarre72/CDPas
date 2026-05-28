import type { Metadata } from "next";
import "./globals.css";
import { MainNav } from "@/components/main-nav";

export const metadata: Metadata = {
  title: "Pastillero · DIFED",
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
            <div className="container flex h-16 items-center justify-between">
              <span className="text-lg font-semibold tracking-tight">
                💊 Pastillero
              </span>
              <MainNav />
            </div>
          </header>
          <main className="container py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
