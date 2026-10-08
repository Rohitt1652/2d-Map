import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Interactive 2D Dotted World Map | Global Supply Network",
  description: "A fluid, premium interactive 2D dotted world map with organic particle motion, glowing connection corridors, animated location markers, and responsive fluid dynamics.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="w-screen h-screen overflow-hidden bg-white text-[#111317]">
        {children}
      </body>
    </html>
  );
}
