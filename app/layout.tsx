import Navbar from "../app/components/Navbar";
import "./globals.css";

export const metadata = {
  title: "My E-Commerce",
  description: "Next.js + Supabase E-Commerce App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
