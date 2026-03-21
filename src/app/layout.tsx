import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Centro de Impresiones y Papelería",
  description: "Sistema de gestión para centro de impresiones y papelería",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
