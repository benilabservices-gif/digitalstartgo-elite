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

// Track from() call count
let fromCallCount = 0;

// Mock Supabase SSR client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn((table: string) => {
    fromCallCount++;
    const callNum = fromCallCount;
    
    // Return a chainable query object
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockImplementation(async () => {
        // Return different data based on call number
        if (callNum === 1) {
          // First from() call - getRedirectUrl or initial profile check
          return { data: { role: "admin", onboarding_completed: true }, error: null };
        }
        // Second from() call - middleware profile check
        return { data: { role: "admin", onboarding_completed: true }, error: null };
      }),
      single: vi.fn(),
    };
    return query;
  }),
};

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}));

const { middleware } = await import("@/middleware");

describe("Middleware — Redirections par rôle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromCallCount = 0;
  });

  function setupMocks(userRole: string, onboardingCompleted: boolean, hasSubscription = true) {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: `${userRole}-id` } },
      error: null,
    });
    
    // Override the maybeSingle to return role-specific data
    const query = mockSupabaseClient.from("profiles");
    query.maybeSingle.mockImplementation(async () => ({
      data: { role: userRole, onboarding_completed: onboardingCompleted },
      error: null,
    }));
    
    // Also mock subscription check for participants
    const subQuery = mockSupabaseClient.from("subscriptions");
    subQuery.maybeSingle.mockImplementation(async () => 
      hasSubscription ? { data: { id: "sub-1" }, error: null } : { data: null, error: null }
    );
  }

  describe("Redirection après connexion", () => {
    it("doit rediriger un admin vers /admin après login", async () => {
      setupMocks("admin", true);
      
      const request = new (await import("next/server")).NextRequest("http://localhost/login");
      await middleware(request as any);

      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/admin" }));
    });

    it("doit rediriger un coach vers /coach après login", async () => {
      setupMocks("coach", true);
      
      const request = new (await import("next/server")).NextRequest("http://localhost/login");
      await middleware(request as any);

      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/coach" }));
    });

    it("doit rediriger un participant vers /dashboard après login", async () => {
      setupMocks("participant", true);
      
      const request = new (await import("next/server")).NextRequest("http://localhost/login");
      await middleware(request as any);

      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/dashboard" }));
    });
  });

  describe("Redirection par rôle sur /dashboard", () => {
    it("doit rediriger un admin de /dashboard vers /admin", async () => {
      setupMocks("admin", true);
      
      const request = new (await import("next/server")).NextRequest("http://localhost/dashboard");
      await middleware(request as any);

      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/admin" }));
    });

    it("doit rediriger un coach de /dashboard vers /coach", async () => {
      setupMocks("coach", true);
      
      const request = new (await import("next/server")).NextRequest("http://localhost/dashboard");
      await middleware(request as any);

      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/coach" }));
    });
  });

  describe("Blocage d'accès cross-rôle", () => {
    it("doit rediriger un participant qui accède à /admin vers /dashboard", async () => {
      setupMocks("participant", true);
      
      const request = new (await import("next/server")).NextRequest("http://localhost/admin");
      await middleware(request as any);

      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/dashboard" }));
    });

    it("doit rediriger un coach qui accède à /admin vers /coach", async () => {
      setupMocks("coach", true);
      
      const request = new (await import("next/server")).NextRequest("http://localhost/admin");
      await middleware(request as any);

      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/coach" }));
    });

    it("doit laisser un admin accéder à /admin", async () => {
      setupMocks("admin", true);
      
      const request = new (await import("next/server")).NextRequest("http://localhost/admin");
      await middleware(request as any);

      // Ne doit pas rediriger
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("Onboarding et abonnement", () => {
    it("doit rediriger un participant non-onboardé vers /onboarding", async () => {
      setupMocks("participant", false);
      
      const request = new (await import("next/server")).NextRequest("http://localhost/dashboard");
      await middleware(request as any);

      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/onboarding" }));
    });

    it("ne doit pas exiger l'onboarding pour un admin", async () => {
      setupMocks("admin", false);
      
      const request = new (await import("next/server")).NextRequest("http://localhost/admin");
      await middleware(request as any);

      // Ne doit pas rediriger vers onboarding
      expect(mockRedirect).not.toHaveBeenCalledWith(expect.objectContaining({ pathname: "/onboarding" }));
    });

    it("ne doit pas exiger l'abonnement pour un coach", async () => {
      setupMocks("coach", true);
      
      const request = new (await import("next/server")).NextRequest("http://localhost/coach");
      await middleware(request as any);

      // Ne doit pas rediriger vers abonnement
      expect(mockRedirect).not.toHaveBeenCalledWith(expect.objectContaining({ pathname: "/abonnement" }));
    });
  });
});
