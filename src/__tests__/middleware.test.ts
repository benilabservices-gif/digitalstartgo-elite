/**
 * Tests pour le middleware — redirections par rôle
 */
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        maybeSingle: jest.fn(),
        single: jest.fn(),
      })),
      order: jest.fn(),
      limit: jest.fn(),
      gt: jest.fn(),
    })),
    rpc: jest.fn(),
  })),
};

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// Mock NextResponse
const mockRedirect = jest.fn((url: string) => ({ url }));
jest.mock("next/server", () => ({
  NextResponse: {
    next: jest.fn(() => ({
      cookies: {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
      },
    })),
    redirect: mockRedirect,
  },
  NextRequest: class {
    url: string;
    nextUrl: { pathname: string };
    headers: Map<string, string>;
    cookies: { get: jest.Mock };

    constructor(url: string) {
      this.url = url;
      this.nextUrl = { pathname: new URL(url).pathname };
      this.headers = new Map();
      this.cookies = { get: jest.fn() };
    }
  },
}));

describe("Middleware — Redirections par rôle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Redirection après connexion", () => {
    it("doit rediriger un admin vers /admin après login", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-id" } },
        error: null,
      });
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: { role: "admin", onboarding_completed: true },
        error: null,
      });

      const request = new NextRequest("http://localhost/login");
      const response = await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/admin" }));
    });

    it("doit rediriger un coach vers /coach après login", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "coach-id" } },
        error: null,
      });
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: { role: "coach", onboarding_completed: true },
        error: null,
      });

      const request = new NextRequest("http://localhost/login");
      const response = await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/coach" }));
    });

    it("doit rediriger un participant vers /dashboard après login", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "participant-id" } },
        error: null,
      });
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: { role: "participant", onboarding_completed: true },
        error: null,
      });

      const request = new NextRequest("http://localhost/login");
      const response = await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/dashboard" }));
    });
  });

  describe("Redirection par rôle sur /dashboard", () => {
    it("doit rediriger un admin de /dashboard vers /admin", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-id" } },
        error: null,
      });
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: { role: "admin", onboarding_completed: true },
        error: null,
      });

      const request = new NextRequest("http://localhost/dashboard");
      const response = await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/admin" }));
    });

    it("doit rediriger un coach de /dashboard vers /coach", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "coach-id" } },
        error: null,
      });
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: { role: "coach", onboarding_completed: true },
        error: null,
      });

      const request = new NextRequest("http://localhost/dashboard");
      const response = await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/coach" }));
    });
  });

  describe("Blocage d'accès cross-rôle", () => {
    it("doit rediriger un participant qui accède à /admin vers /dashboard", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "participant-id" } },
        error: null,
      });
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: { role: "participant", onboarding_completed: true },
        error: null,
      });
      mockSupabase.from().select().eq().gt().limit().maybeSingle.mockResolvedValue({
        data: { id: "sub-1" },
        error: null,
      });

      const request = new NextRequest("http://localhost/admin");
      const response = await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/dashboard" }));
    });

    it("doit rediriger un coach qui accède à /admin vers /coach", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "coach-id" } },
        error: null,
      });
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: { role: "coach", onboarding_completed: true },
        error: null,
      });

      const request = new NextRequest("http://localhost/admin");
      const response = await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/coach" }));
    });

    it("doit laisser un admin accéder à /admin", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-id" } },
        error: null,
      });
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: { role: "admin", onboarding_completed: true },
        error: null,
      });

      const request = new NextRequest("http://localhost/admin");
      const response = await middleware(request);

      // Ne doit pas rediriger
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("Onboarding et abonnement", () => {
    it("doit rediriger un participant non-onboardé vers /onboarding", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "participant-id" } },
        error: null,
      });
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: { role: "participant", onboarding_completed: false },
        error: null,
      });

      const request = new NextRequest("http://localhost/dashboard");
      const response = await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/onboarding" }));
    });

    it("ne doit pas exiger l'onboarding pour un admin", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-id" } },
        error: null,
      });
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: { role: "admin", onboarding_completed: false },
        error: null,
      });

      const request = new NextRequest("http://localhost/admin");
      const response = await middleware(request);

      // Ne doit pas rediriger vers onboarding
      expect(mockRedirect).not.toHaveBeenCalledWith(expect.objectContaining({ pathname: "/onboarding" }));
    });

    it("ne doit pas exiger l'abonnement pour un coach", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "coach-id" } },
        error: null,
      });
      mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: { role: "coach", onboarding_completed: true },
        error: null,
      });

      const request = new NextRequest("http://localhost/coach");
      const response = await middleware(request);

      // Ne doit pas rediriger vers abonnement
      expect(mockRedirect).not.toHaveBeenCalledWith(expect.objectContaining({ pathname: "/abonnement" }));
    });
  });
});
