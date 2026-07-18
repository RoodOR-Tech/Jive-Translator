import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jive Translator",
  description: "Translate standard English into smooth 1970s Jive talk"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
