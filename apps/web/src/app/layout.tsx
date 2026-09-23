import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Komas - Enterprise Golang & Next.js Monorepo",
  description: "Production ready full-stack enterprise monorepo platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
