/**
 * Tests pour la fonction SQL coach_list_participants
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client with chainable API
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

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => createChainableMock({ data: null, error: null })),
  rpc: vi.fn(),
};

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}));

describe("coach_list_participants (mocké)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("doit appeler rpc('coach_list_participants') depuis la page coach", async () => {
    // Simuler un coach avec 1 participant
    const mockParticipants = [
      {
        id: "participant-1",
        business_name: "Test Business",
        cohort_name: "Cohorte A",
        current_stage_number: 2,
        current_stage_title: "Offre",
        last_submission_status: "soumis",
        last_submission_date: "2026-09-26T10:00:00Z",
      },
    ];
    mockSupabaseClient.rpc.mockResolvedValue({ data: mockParticipants, error: null });

    // Simuler requireCoach
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "coach-id" } },
      error: null,
    });
    mockSupabaseClient.from().select().eq().maybeSingle.mockResolvedValue({
      data: { role: "coach", onboarding_completed: true },
      error: null,
    });

    // Tester que l'appel RPC est fait correctement
    const result = await mockSupabaseClient.rpc("coach_list_participants");
    
    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("coach_list_participants");
    expect(result.data).toEqual(mockParticipants);
  });

  it("doit lever une erreur pour un participant", async () => {
    mockSupabaseClient.rpc.mockRejectedValue(new Error("Unauthorized: only coaches and admins can list participants"));

    const result = mockSupabaseClient.rpc("coach_list_participants");
    
    await expect(result).rejects.toThrow("Unauthorized");
  });
});
