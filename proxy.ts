import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n/config";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = intlMiddleware(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isLoginPage = pathname.includes("/login");
  const isPublicPage = isLoginPage;

  if (!session && !isPublicPage) {
    const locale = pathname.split("/")[1] || "id";
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  if (session && isLoginPage) {
    const locale = pathname.split("/")[1] || "id";
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return response;
}

export default middleware;

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
