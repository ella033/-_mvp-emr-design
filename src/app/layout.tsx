import type { Metadata } from "next";
import "@/styles/globals.css";
import { headers } from "next/headers";
import { SidebarProvider } from "@/components/ui/sidebar";
import TopMenubar from "@/components/top-menubar";
import { CustomThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";
import ReactQueryProvider from "@/components/react-query-provider";
import { SocketProvider } from "../contexts/SocketContext";
import { ToastProvider } from "@/components/ui/toast";
import InitialDataFetcherWrapper from "@/components/fetcher/initial-data-fetcher-wrapper";
import { ClearProvider } from "@/contexts/ClearContext";
import GlobalSocketListener from "@/components/global-socket-listener";
import DocumentPrintPopupNoSSR from "@/components/document/document-print-popup.no-ssr";
import TemplateCodePopupGate from "@/components/template-code-popup-gate";
import { TabletContentWrapper } from "@/components/tablet-content-wrapper";
import { AgentationWrapper } from "@/components/agentation-wrapper";

export const metadata: Metadata = {
  title: "NEXT EMR",
  description: "UBcare Cloud",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isPopout = pathname.startsWith("/popout");
  const isDesignPreview = pathname.startsWith("/medical-v2");

  return (
    <html lang="ko">
      <body className="antialiased">
        {/* 전역 테마 Provider */}
        <CustomThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {/* React Query 전역 Provider */}
          <ReactQueryProvider>
            <ToastProvider>
              {isDesignPreview ? (
                /* 디자인 프리뷰: 독립 레이아웃 */
                children
              ) : isPopout ? (
                /* 팝아웃 창: 사이드바/메뉴바 없이 최소 레이아웃 */
                <SocketProvider>
                  <ClearProvider>
                    {children}
                  </ClearProvider>
                </SocketProvider>
              ) : (
                /* 메인 앱: 전체 레이아웃 */
                <SidebarProvider>
                  <AppSidebar />
                  <main className="flex flex-col flex-1 min-w-0 h-screen">
                    <InitialDataFetcherWrapper />
                    <SocketProvider>
                      <GlobalSocketListener />
                      <ClearProvider>
                        <TopMenubar />
                        <TabletContentWrapper>
                          {children}
                        </TabletContentWrapper>
                        <DocumentPrintPopupNoSSR />
                        <TemplateCodePopupGate />
                      </ClearProvider>
                    </SocketProvider>
                  </main>
                </SidebarProvider>
              )}
            </ToastProvider>
          </ReactQueryProvider>
        </CustomThemeProvider>
        <AgentationWrapper />
      </body>
    </html>
  );
}
