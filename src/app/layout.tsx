import { spaceGrotesk, spaceMono } from "@vessel-dsp/ui-theme";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VesselDSP Blog",
  description: "How a guitar circuit becomes code you can play through. Physical modeling for pedal builders, from VesselDSP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="vesseldsp"
      className={`${spaceMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
