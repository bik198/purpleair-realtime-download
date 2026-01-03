import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import EmotionRegistry from "./registry";
import MUIThemeProvider from "./ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "PurpleAir Data Downloader",
  description: "Download historical sensor data from PurpleAir",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <EmotionRegistry>
          <MUIThemeProvider>
            {children}
          </MUIThemeProvider>
        </EmotionRegistry>
      </body>
    </html>
  );
}
