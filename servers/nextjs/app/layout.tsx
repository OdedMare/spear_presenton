import type { Metadata } from "next";
import localFont from "next/font/local";
import { Roboto, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import MixpanelInitializer from "./MixpanelInitializer";
import { LayoutProvider } from "./(presentation-generator)/context/LayoutContext";
import { Toaster } from "@/components/ui/sonner";
import { TutorialProvider } from "@/components/tutorial/TutorialProvider";
import { TutorialModal } from "@/components/tutorial/TutorialModal";
import { WelcomeTutorial } from "@/components/tutorial/WelcomeTutorial";
import { BetaWarningBanner } from "@/components/BetaWarningBanner";

const inter = localFont({
  src: [
    {
      path: "./fonts/Inter.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-inter",
});

const instrument_sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument-sans",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-roboto",
});


export const metadata: Metadata = {
  metadataBase: new URL("https://spearpresenton.ai"),
  title: "SpearPresenton - AI-Powered Presentation Generator",
  description:
    "SpearPresenton - Advanced AI presentation generator with multi-agent translation, custom layouts, multi-model support (OpenAI, Gemini, Ollama), and PDF/PPTX export.",
  keywords: [
    "AI presentation generator",
    "SpearPresenton",
    "data storytelling",
    "data visualization tool",
    "AI data presentation",
    "presentation generator",
    "data to presentation",
    "interactive presentations",
    "professional slides",
    "AI translation",
  ],
  openGraph: {
    title: "SpearPresenton - AI-Powered Presentation Generator",
    description:
      "SpearPresenton - Advanced AI presentation generator with multi-agent translation, custom layouts, multi-model support (OpenAI, Gemini, Ollama), and PDF/PPTX export.",
    url: "https://spearpresenton.ai",
    siteName: "SpearPresenton",
    images: [
      {
        url: "https://spearpresenton.ai/spearpresenton-feature-graphics.png",
        width: 1200,
        height: 630,
        alt: "SpearPresenton Logo",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  alternates: {
    canonical: "https://spearpresenton.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpearPresenton - AI-Powered Presentation Generator",
    description:
      "SpearPresenton - Advanced AI presentation generator with multi-agent translation, custom layouts, multi-model support (OpenAI, Gemini, Ollama), and PDF/PPTX export.",
    images: ["https://spearpresenton.ai/spearpresenton-feature-graphics.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${roboto.variable} ${instrument_sans.variable} antialiased`}
      >
        <Providers>
          <MixpanelInitializer>
            <LayoutProvider>
              <TutorialProvider>
                <BetaWarningBanner />
                {children}
                <TutorialModal />
                <WelcomeTutorial />
              </TutorialProvider>
            </LayoutProvider>
          </MixpanelInitializer>
        </Providers>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
