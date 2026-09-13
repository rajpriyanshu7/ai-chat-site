import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { THEME_KEY } from "@/lib/theme";

// Inter is a variable font — one download covers weights 400/500/600 used in
// the type scale. Self-hosted by next/font at build time.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || "Chat",
  description: "Free anonymous chat. Ask anything — no sign-up needed.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0C1016",
};

// Runs before first paint so the chosen theme is applied with no flash.
// Dark is the default (no class); only the light choice adds `.light`.
const themeBootstrap = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==='light'||(t==='system'&&window.matchMedia('(prefers-color-scheme: light)').matches)){document.documentElement.classList.add('light');}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The bootstrap script may add `.light` before hydration.
      suppressHydrationWarning
      className={`${inter.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        {children}
      </body>
    </html>
  );
}
