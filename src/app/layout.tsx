import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { loadCurrentUser } from "@/features/auth/server/load-current-user";
import { CurrentUserProvider } from "@/features/auth/context/current-user-context";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "LMS Platform - 온라인 학습 관리 시스템",
  description: "강사와 학습자를 위한 종합 온라인 교육 플랫폼",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await loadCurrentUser();

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <Providers>
          <CurrentUserProvider initialState={currentUser}>
            <Header />
            <main className="min-h-screen bg-gray-50">
              {children}
            </main>
          </CurrentUserProvider>
        </Providers>
      </body>
    </html>
  );
}
