import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { APP_NAME, APP_TAGLINE } from "@/constants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      className={`h-full`}
      dir="rtl"
    >
      <body className="min-h-full flex flex-col">
        <Toaster position="top-center" richColors />
        {children}
      </body>
    </html>
  );
}
