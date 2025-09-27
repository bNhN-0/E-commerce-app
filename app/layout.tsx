import Navbar from "../app/components/Navbar";
import { CartProvider } from "../app/components/CartContext"; 
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
  title: "Mingala Mart",
  description: "Your one-stop shop for all things fashion, beauty, sports, and tech.",
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
      <body className={`${outfit.className} h-full text-gray-900`}>
        <CartProvider>
          <Navbar />
          <main>{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
