import Navbar from "../app/components/Navbar";
import {CartProvider} from "../app/components/CartContext"; 
import "./globals.css";
import type { Metadata } from "next";
import { Outfit as OutfitFont, Ovo as OvoFont, Epilogue as EpilogueFont } from "next/font/google";

const outfit = OutfitFont({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ovo = OvoFont({
  subsets: ["latin"],
  weight: ["400"],
});

const epilogue = EpilogueFont({
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "E-commerce template",
  description: "Next.js + Supabase E-Commerce App",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className}`}>
        <CartProvider>
          <Navbar />
          <main>{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
