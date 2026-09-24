import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const APP_ROUTES = [
  "/dashboard",
  "/onboarding",
  "/diagnostic",
  "/missions",
  "/coach",
  "/ressources",
  "/admin",
  "/abonnement",
  "/parcours",
  "/coach-ai",
];
const AUTH_ROUTES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAppRoute = APP_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!user && isAppRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // /coach est volontairement hors de ce contrôle : un compte coach n'a pas
  // forcément d'onboarding participant complété.
  if (
    user &&
    (pathname.startsWith("/diagnostic") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/missions") ||
      pathname.startsWith("/ressources") ||
      pathname.startsWith("/parcours") ||
      pathname.startsWith("/coach-ai"))
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.onboarding_completed !== true) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // /abonnement reste volontairement hors de ce contrôle (pas ajouté à la
    // liste ci-dessus) : c'est la page où corriger l'absence d'abonnement,
    // elle ne doit pas se rediriger elle-même. Les coachs et admins ne sont
    // jamais des clients payants, seuls les participants sont concernés.
    if (profile.role === "participant") {
      const { data: activeSubscription } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("profile_id", user.id)
        .gt("expires_at", new Date().toISOString())
        .limit(1)
        .maybeSingle();

      if (!activeSubscription) {
        return NextResponse.redirect(new URL("/abonnement", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/diagnostic/:path*",
    "/missions/:path*",
    "/coach/:path*",
    "/ressources/:path*",
    "/admin/:path*",
    "/abonnement/:path*",
    "/parcours/:path*",
    "/coach-ai/:path*",
    "/login",
    "/signup",
  ],
};
