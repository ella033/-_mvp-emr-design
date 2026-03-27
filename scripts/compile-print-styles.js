/**
 * 프린트 스타일 컴파일 스크립트
 * 
 * 이 스크립트는 빌드 시점에 DocumentCenter.print.scss를 CSS로 컴파일하여
 * public/document-center-print.css 파일을 생성합니다.
 * 
 * 목적:
 * - 브라우저 프린트와 Puppeteer PDF 생성 시 동일한 스타일 적용
 * - 배포 환경에서 소스 파일 접근 없이 컴파일된 CSS 사용
 * - DocumentCenter.print.scss 하나로 프린트 스타일 통합 관리
 * 
 * 실행 시점:
 * - package.json의 "prebuild" 스크립트로 빌드 전 자동 실행
 * 
 * 사용처:
 * - src/app/api/printable-demo/pdf/route.ts: Puppeteer PDF 생성 시 사용
 * - 브라우저 프린트: Next.js가 자동으로 SCSS 컴파일하여 적용
 */
const sass = require('sass');
const fs = require('fs');
const path = require('path');

const scssPath = path.join(__dirname, '../src/app/document/_components/DocumentCenter.print.scss');
const baseCssPath = path.join(__dirname, '../src/lib/printable/styles.css');
const outputPath = path.join(__dirname, '../public/document-center-print.css');

try {
  if (!fs.existsSync(scssPath)) {
    console.warn('⚠️  SCSS file not found:', scssPath);
    process.exit(0); // 빌드 실패로 만들지 않음
  }

  const compiled = sass.compile(scssPath, { style: 'expanded' });

  const baseCss = fs.existsSync(baseCssPath) ? fs.readFileSync(baseCssPath, 'utf-8') : '';
  const mergedCss = `${baseCss}\n\n${compiled.css}`;

  fs.writeFileSync(outputPath, mergedCss);
  console.log('✅ Compiled DocumentCenter.print.scss (+ base styles.css) to public/document-center-print.css');
} catch (error) {
  console.error('❌ Error compiling SCSS:', error);
  process.exit(1);
}

