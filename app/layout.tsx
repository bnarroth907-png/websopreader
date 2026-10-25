import type { Metadata } from "next";
import { getAppName } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: getAppName(),
  description: "Official library of standard operating procedures.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('sop-reader-theme')==='dark'||(!localStorage.getItem('sop-reader-theme')&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
