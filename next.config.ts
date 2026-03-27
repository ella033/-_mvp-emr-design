import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import { config } from "@/lib/config";

// Define the base Next.js configuration
const baseConfig: NextConfig = {
  // ⭐⭐⭐ 가장 중요: Standalone 모드 활성화 ⭐⭐⭐
  output: "standalone",

  eslint: {
    dirs: ["."],
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  reactStrictMode: true, // Fast Refresh를 위해 활성화
  typescript: {
    ignoreBuildErrors: true,
  },

  // 실험적 기능
  experimental: {
    // 패키지 Import 최적화 (Tree-shaking 개선)
    optimizePackageImports: [
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-hover-card",
      "@radix-ui/react-label",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "lucide-react",
      "recharts",
      "@tanstack/react-query",
      "@tanstack/react-virtual",
    ],
  },
};

let configWithPlugins = baseConfig;

// Conditionally enable bundle analysis
if (process.env.ANALYZE === "true") {
  configWithPlugins = withBundleAnalyzer({
    enabled: true,
    openAnalyzer: true,
    analyzerMode: "static", // 또는 "server"
  })(configWithPlugins);
}

const nextConfig = {
  ...configWithPlugins,
  // =====turbopack 설정=====
  turbopack: {
    // SVG 파일을 React 컴포넌트로 import
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: { icon: true },
          },
        ],
        as: "*.js",
      },
    },
    // 확장자 우선순위 지정
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
  },
  // =====webpack 설정=====
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // 서버 사이드 빌드 시 필요한 무거운 모듈 외부화
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        canvas: "commonjs canvas",
      });
      // Puppeteer는 시스템 Chromium 사용
      config.externals.push("puppeteer-core");
      // Canvas 관련 (필요시)
      config.externals.push("jsdom");
    }
    return config;
  },
  // =====프록시 설정=====
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_APP_API_URL;
    if (!apiUrl) return [];
    return [
      {
        source: `${config.apiProxyPath}/:path*`,
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
