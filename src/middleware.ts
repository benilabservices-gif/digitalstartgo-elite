import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes nécessitant une authentification + onboarding + abonnement actif
const APP_ROUTES = [
  "/dashboard",
  "/onboarding",
  "/diagnostic",
  "/coach",
  "/ressources",
  "/admin",
  "/parcours",
  "/coach-ai",
];

// Routes d'authentification — accessibles à tous (même sans session)
const AUTH_ROUTES = ["/login", "/signup", "/mot-de-passe-oublie", "/reinitialiser-mot-de-passe"];

// Page d'abonnement — accessible publiquement pour que les visiteurs
// puissent voir les tarifs avant de s'inscrire
const ABONNEMENT_ROUTES = ["/abonnement"];

// Routes admin — uniquement pour les admins
const ADMIN_ROUTES = ["/admin"];

// Routes coach — uniquement pour les coachs
const COACH_ROUTES = ["/coach"];

/**
 * Détermine la route de redirection après connexion selon le rôle
 */
async function getRedirectUrl(supabase: any, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", userId)
    .maybeSingle();

  const role = profile?.role;

  if (role === "admin") return "/admin";
  if (role === "coach") return "/coach";
  return "/dashboard";
}

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
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const isCoachRoute = COACH_ROUTES.some((route) => pathname.startsWith(route));

  // 1. Si pas connecté et que la route nécessite une auth → redirectToLogin
  if (!user && isAppRoute && !isAbonnement) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Si connecté et que la route est une route d'auth → rediriger vers dashboard
  if (user && isAuthRoute) {
    const redirectUrl = await getRedirectUrl(supabase, user.id);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // 3. Routes protégées (auth + onboarding + abonnement)
  if (user && isAppRoute && !isAbonnement) {
    const isOnboarding = pathname.startsWith("/onboarding");
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, role")
      .eq("id", user.id)
      .maybeSingle();

    // Redirection par rôle : admin → /admin, coach → /coach
    if (profile?.role === "admin" && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (profile?.role === "coach" && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/coach", request.url));
    }

    // Onboarding requis uniquement pour les participants
    if (profile?.role === "participant" && !isOnboarding) {
      if (!profile.onboarding_completed) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }

    // Abonnement requis uniquement pour les participants
    if (profile?.role === "participant") {
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

    // 4. Vérifications croisées par rôle
    // Participant qui tente d'accéder à /admin ou /coach → redirect vers /dashboard
    if (profile?.role === "participant") {
      if (isAdminRoute || isCoachRoute) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Coach qui tente d'accéder à /admin → redirect vers /coach
    if (profile?.role === "coach" && isAdminRoute) {
      return NextResponse.redirect(new URL("/coach", request.url));
    }
  }

  // 5. Page abonnement accessible même sans auth (pour les visiteurs)
  if (isAbonnement && !user) {
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/diagnostic/:path*",
    "/coach/:path*",
    "/ressources/:path*",
    "/admin/:path*",
    "/parcours/:path*",
    "/coach-ai/:path*",
    "/login",
    "/signup",
    "/mot-de-passe-oublie",
    "/reinitialiser-mot-de-passe",
  ],
};
