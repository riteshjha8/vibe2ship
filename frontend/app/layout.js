import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import ReminderOverlay from "@/components/ReminderOverlay";

export const metadata = {
  title: "Vibe2Ship | The Last-Minute Life Saver",
  description: "An AI productivity companion that plans, prioritizes, and rings the alarm before you miss a deadline.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Fonts load at runtime via a normal stylesheet link rather than
            next/font, so the production build never depends on reaching
            Google's servers - only the visiting browser does, same as any
            standard website. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="font-body antialiased min-h-screen">
        <AuthProvider>
          <SocketProvider>
            {children}
            <ReminderOverlay />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
