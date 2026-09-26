/**
 * Tests pour le middleware — redirections par rôle
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock NextResponse and NextRequest BEFORE importing middleware
const mockRedirect = vi.fn();
vi.mock("next/server", () => ({
  NextResponse: {
    next: vi.fn(() => ({
      cookies: {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      },
    })),
    redirect: (...args: any[]) => mockRedirect(...args),
  },
  NextRequest: class {
    url: string;
    nextUrl: { pathname: string };
    headers: Map<string, string>;
    cookies: { get: ReturnType<typeof vi.fn> };

    constructor(url: string) {
      this.url = url;
      this.nextUrl = { pathname: new URL(url).pathname };
      this.headers = new Map();
      this.cookies = { get: vi.fn() };
    }
  },
}));

// Build a proper chainable mock that mimics Supabase client
function createChainableMock(returnValue: any) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(returnValue),
    single: vi.fn().mockResolvedValue(returnValue),
  };
  return chain;
}

// Track how many times from() was called
let fromCallIndex = 0;
const fromCallResults: any[][] = [];

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn((table: string) => {
    const idx = fromCallIndex++;
    // Return the pre-configured result for this call, or default
    const result = fromCallResults[idx] ?? { data: { role: "admin", onboarding_completed: true }, error: null };
    return createChainableMock(result);
  }),
};

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}));

const { middleware } = await import("@/middleware");

function runMiddleware(pathname: string, role: string, onboardingCompleted: boolean, hasSubscription = true) {
  fromCallIndex = 0;
  fromCallResults.length = 0;
  
  // First from() call: getRedirectUrl or profile fetch
  fromCallResults.push({ data: { role, onboarding_completed: onboardingCompleted }, error: null });
  // Second from() call: same for the main middleware block
  fromCallResults.push({ data: { role, onboarding_completed: onboardingCompleted }, error: null });
  // Third from() call: subscription check (only for participants)
  fromCallResults.push({ data: hasSubscription ? { id: "sub-1" } : null, error: null });

  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: { id: `${role}-id` } },
    error: null,
  });
}

describe("Middleware — Redirections par rôle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Redirection après connexion", () => {
    it("doit rediriger un admin vers /admin après login", async () => {
      runMiddleware("/login", "admin", true);
      const request = new (await import("next/server")).NextRequest("http://localhost/login");
      await middleware(request as any);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/admin" }));
    });

    it("doit rediriger un coach vers /coach après login", async () => {
      runMiddleware("/login", "coach", true);
      const request = new (await import("next/server")).NextRequest("http://localhost/login");
      await middleware(request as any);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/coach" }));
    });

    it("doit rediriger un participant vers /dashboard après login", async () => {
      runMiddleware("/login", "participant", true);
      const request = new (await import("next/server")).NextRequest("http://localhost/login");
      await middleware(request as any);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/dashboard" }));
    });
  });

  describe("Redirection par rôle sur /dashboard", () => {
    it("doit rediriger un admin de /dashboard vers /admin", async () => {
      runMiddleware("/dashboard", "admin", true);
      const request = new (await import("next/server")).NextRequest("http://localhost/dashboard");
      await middleware(request as any);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/admin" }));
    });

    it("doit rediriger un coach de /dashboard vers /coach", async () => {
      runMiddleware("/dashboard", "coach", true);
      const request = new (await import("next/server")).NextRequest("http://localhost/dashboard");
      await middleware(request as any);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/coach" }));
    });
  });

  describe("Blocage d'accès cross-rôle", () => {
    it("doit rediriger un participant qui accède à /admin vers /dashboard", async () => {
      runMiddleware("/admin", "participant", true);
      const request = new (await import("next/server")).NextRequest("http://localhost/admin");
      await middleware(request as any);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/dashboard" }));
    });

    it("doit rediriger un coach qui accède à /admin vers /coach", async () => {
      runMiddleware("/admin", "coach", true);
      const request = new (await import("next/server")).NextRequest("http://localhost/admin");
      await middleware(request as any);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/coach" }));
    });

    it("doit laisser un admin accéder à /admin", async () => {
      runMiddleware("/admin", "admin", true);
      const request = new (await import("next/server")).NextRequest("http://localhost/admin");
      await middleware(request as any);
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("Onboarding et abonnement", () => {
    it("doit rediriger un participant non-onboardé vers /onboarding", async () => {
      runMiddleware("/dashboard", "participant", false);
      const request = new (await import("next/server")).NextRequest("http://localhost/dashboard");
      await middleware(request as any);
      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/onboarding" }));
    });

    it("ne doit pas exiger l'onboarding pour un admin", async () => {
      runMiddleware("/admin", "admin", false);
      const request = new (await import("next/server")).NextRequest("http://localhost/admin");
      await middleware(request as any);
      expect(mockRedirect).not.toHaveBeenCalledWith(expect.objectContaining({ pathname: "/onboarding" }));
    });

    it("ne doit pas exiger l'abonnement pour un coach", async () => {
      runMiddleware("/coach", "coach", true);
      const request = new (await import("next/server")).NextRequest("http://localhost/coach");
      await middleware(request as any);
      expect(mockRedirect).not.toHaveBeenCalledWith(expect.objectContaining({ pathname: "/abonnement" }));
    });
  });
});
