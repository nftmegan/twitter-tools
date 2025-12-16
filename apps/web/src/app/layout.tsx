import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Twitter Tool 2025",
  description: "Advanced Monorepo Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}