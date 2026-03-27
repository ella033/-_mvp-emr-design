import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { existsSync, readdirSync, statSync } from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. 환경 정보
  results.nodeEnv = process.env.NODE_ENV;
  results.platform = process.platform;

  // 2. 폰트 디렉토리 확인 (Docker 환경)
  const fontDir = "/usr/share/fonts/nanumfont";
  results.fontDirExists = existsSync(fontDir);

  if (results.fontDirExists) {
    try {
      const files = readdirSync(fontDir);
      results.fontFiles = files.map((file) => {
        try {
          const stats = statSync(`${fontDir}/${file}`);
          return { name: file, size: stats.size };
        } catch {
          return { name: file, size: "unknown" };
        }
      });
    } catch (e) {
      results.fontFilesError = String(e);
    }
  }

  // 3. 시스템 폰트 디렉토리 확인
  const systemFontDirs = [
    "/usr/share/fonts",
    "/usr/local/share/fonts",
    "/usr/share/fonts/truetype",
  ];
  results.systemFontDirs = systemFontDirs.map((dir) => ({
    path: dir,
    exists: existsSync(dir),
  }));

  // 4. fontconfig 확인 (fc-list)
  try {
    const fcListResult = execSync('fc-list 2>/dev/null | grep -i nanum || echo "No Nanum fonts found in fc-list"', {
      timeout: 5000,
    })
      .toString()
      .trim();
    results.fcList = fcListResult;
  } catch (e) {
    results.fcListError = String(e);
  }

  // 5. fc-match 확인 (폰트 이름 매칭)
  const fontNamesToTest = ["Nanum Gothic", "NanumGothic", "NanumBarunGothic", "Nanum"];
  results.fcMatch = {};

  for (const fontName of fontNamesToTest) {
    try {
      const matchResult = execSync(`fc-match "${fontName}" 2>/dev/null || echo "fc-match failed"`, {
        timeout: 5000,
      })
        .toString()
        .trim();
      (results.fcMatch as Record<string, string>)[fontName] = matchResult;
    } catch (e) {
      (results.fcMatch as Record<string, string>)[fontName] = `Error: ${String(e)}`;
    }
  }

  // 6. 전체 fc-list 요약 (한글 폰트 관련)
  try {
    const fcListAll = execSync('fc-list :lang=ko 2>/dev/null | head -20 || echo "No Korean fonts"', {
      timeout: 5000,
    })
      .toString()
      .trim();
    results.koreanFonts = fcListAll;
  } catch (e) {
    results.koreanFontsError = String(e);
  }

  // 7. Chromium 경로 확인
  const chromiumPaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
  ].filter(Boolean) as string[];

  results.chromium = chromiumPaths.map((path) => ({
    path,
    exists: existsSync(path),
  }));

  // 8. fc-cache 상태 확인
  try {
    const fcCacheResult = execSync("fc-cache -v 2>&1 | tail -5 || echo 'fc-cache not available'", {
      timeout: 10000,
    })
      .toString()
      .trim();
    results.fcCacheStatus = fcCacheResult;
  } catch (e) {
    results.fcCacheError = String(e);
  }

  console.log("[DEBUG-FONTS] Font debug info:", JSON.stringify(results, null, 2));

  return NextResponse.json(results, { status: 200 });
}

