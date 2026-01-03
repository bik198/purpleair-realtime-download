import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import EmotionRegistry from "./registry";
import MUIThemeProvider from "./ThemeProvider";
import Navbar from "./components/Navbar";

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
  description: "Download  real-time observation sensor data from PurpleAir sensor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <EmotionRegistry>
          <MUIThemeProvider>
            <Navbar />
            {children}
          </MUIThemeProvider>
        </EmotionRegistry>
      </body>
    </html>
  );
}
