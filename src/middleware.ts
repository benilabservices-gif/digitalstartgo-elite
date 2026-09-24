import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes nécessitant une authentification + onboarding + abonnement actif
const APP_ROUTES = [
  "/dashboard",
  "/onboarding",
  "/diagnostic",
  "/missions",
  "/coach",
  "/ressources",
  "/admin",
  "/parcours",
  "/coach-ai",
];

// Routes d'authentification — accessibles à tous (même sans session)
const AUTH_ROUTES = ["/login", "/signup"];

// Page d'abonnement — accessible publiquement pour que les visiteurs
// puissent voir les tarifs avant de s'inscrire
const ABONNEMENT_ROUTES = ["/abonnement"];

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
  const isAbonnement = pathname.startsWith("/abonnement");

  // 1. Si pas connecté et que la route nécessite une auth → redirectToLogin
  if (!user && isAppRoute && !isAbonnement) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Si connecté et que la route est une route d'auth → rediriger vers dashboard
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Routes protégées (auth + onboarding + abonnement)
  if (user && isAppRoute && !isAbonnement) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, role")
      .eq("id", user.id)
      .maybeSingle();

    // Onboarding requis
    if (!profile || profile.onboarding_completed !== true) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // Abonnement requis uniquement pour les participants
    if (profile.role === "participant") {
      const { data: activeSubscription } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("profile_id", user.id)
        .gt("expires_at", new Date().toISOString())
        .limit(1)
        .maybeSingle();

      if (!activeSubscription) {
        // Rediriger vers la page d'abonnement (accessible publiquement)
        return NextResponse.redirect(new URL("/abonnement", request.url));
      }
    }
  }

  // 4. Page abonnement accessible même sans auth (pour les visiteurs)
  //    Mais si déjà connecté → pas besoin de protéger
  if (isAbonnement && !user) {
    // Retourner la page normalement (pas de redirection)
    return response;
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
