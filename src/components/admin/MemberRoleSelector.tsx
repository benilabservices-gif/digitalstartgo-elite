"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface MemberRoleSelectorProps {
  memberId: string;
  currentRole: string;
}

export function MemberRoleSelector({ memberId, currentRole }: MemberRoleSelectorProps) {
  const [role, setRole] = useState(currentRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value;
    setRole(newRole);
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("change_user_role", {
      p_user_id: memberId,
      p_new_role: newRole,
    });

    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      setRole(currentRole);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={role}
        onChange={handleChange}
        disabled={loading}
        className="rounded-[2px] border border-dark/10 bg-paper px-2 py-1 text-xs text-dark focus:border-gold/60 focus:outline-none disabled:opacity-50"
      >
        <option value="participant">Participant</option>
        <option value="coach">Coach</option>
        <option value="admin">Admin</option>
      </select>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
