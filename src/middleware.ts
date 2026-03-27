// 이 파일은 Next.js 미들웨어로, 보호 경로에 대한 인증 체크를 수행합니다.
// - /dashboard, /admin, /profile 등 지정된 경로에 접근 시 인증 쿠키가 없으면 /auth/sign-in으로 리다이렉트합니다.
// - 그 외 경로는 인증 없이 통과시킵니다.
// - matcher 설정으로 /api, /_next 등은 미들웨어 적용에서 제외됩니다.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = [
  /^\/(\/.*)?$/,
  /^\/reception(\/.*)?$/,
  /^\/payment(\/.*)?$/,
  /^\/medical(\/.*)?$/,
  /^\/tests(\/.*)?$/,
  /^\/reservation(\/.*)?$/,
  /^\/stats(\/.*)?$/,
  /^\/crm(\/.*)?$/,
  /^\/claims(\/.*)?$/,
  /^\/master-data(\/.*)?$/,
  /^\/admin(\/.*)?$/,
  /^\/did(\/.*)?$/,
];

function isProtectedRoute(pathname: string) {
  return PROTECTED_PATHS.some((regex) => regex.test(pathname));
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 디자인 프리뷰 페이지는 인증 없이 접근 허용
  if (pathname.startsWith("/medical-v2") || pathname.startsWith("/home")) {
    const response = NextResponse.next();
    response.headers.set("x-pathname", pathname);
    return response;
  }

  if (isProtectedRoute(pathname)) {
    // DID 경로는 별도 쿠키(accessToken_did) 사용
    const isDid = pathname.startsWith("/did");
    const cookieName = isDid ? "accessToken_did" : "accessToken";
    const cookie = request.cookies.get(cookieName);

    if (!cookie) {
      const signInUrl = isDid
        ? new URL("/auth/did/sign-in", request.url)
        : new URL("/auth/sign-in", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  const response = NextResponse.next();
  // 서버 컴포넌트(layout.tsx)에서 경로를 확인할 수 있도록 헤더 추가
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: [
    "/((?!api|_next/static|_next/image|_next|_vercel|monitoring|favicon.ico|.*\\..*).*)",
  ],
};
