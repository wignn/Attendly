import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import { AuthRoleProvider } from "@/context/auth-role-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Attendly - SMPN 1 Tirtajaya",
  description: "Sistem Absensi Murid & Guru SMPN 1 Tirtajaya",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen flex flex-col">
        <QueryProvider>
          <AuthRoleProvider>{children}</AuthRoleProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

