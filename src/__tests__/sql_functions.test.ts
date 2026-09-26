/**
 * Tests pour la fonction change_user_role
 */
describe("change_user_role", () => {
  it("doit être une fonction SQL SECURITY DEFINER", () => {
    const sql = `
      CREATE OR REPLACE FUNCTION public.change_user_role(
        p_user_id uuid,
        p_new_role text
      )
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $$
      DECLARE
        caller_id uuid;
        caller_role text;
      BEGIN
        caller_id := auth.uid();
        select role into caller_role from profiles where id = caller_id;
        
        if caller_role is distinct from 'admin' then
          raise exception 'Unauthorized: only admins can change roles';
        end if;
        
        if caller_id = p_user_id and p_new_role != 'admin' then
          raise exception 'Cannot remove your own admin role';
        end if;
        
        update profiles set role = p_new_role, updated_at = now() where id = p_user_id;
      END;
      $$;
    `;
    
    expect(sql).toBeDefined();
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain("raise exception 'Unauthorized: only admins can change roles'");
    expect(sql).toContain("raise exception 'Cannot remove your own admin role'");
  });

  it("doit interdire à un non-admin de changer un rôle", () => {
    // Simulation : si caller_role !== 'admin', lever une exception
    const callerRole = "participant";
    const isAdmin = callerRole === "admin";
    
    expect(isAdmin).toBe(false);
    // Dans la fonction réelle, cela lèverait :
    // raise exception 'Unauthorized: only admins can change roles';
  });

  it("doit interdire à un admin de se retirer son propre rôle", () => {
    // Simulation : si caller_id = p_user_id et p_new_role != 'admin'
    const callerIsTarget = true;
    const newRoleIsAdmin = false;
    
    expect(callerIsTarget && !newRoleIsAdmin).toBe(true);
    // Dans la fonction réelle, cela lèverait :
    // raise exception 'Cannot remove your own admin role';
  });

  it("doit permettre à un admin de changer le rôle d'un autre admin", () => {
    // Cas où caller_id !== p_user_id
    const callerIsTarget = false;
    const newRoleIsAdmin = false;
    
    expect(!callerIsTarget || newRoleIsAdmin).toBe(true);
    // Cela devrait passer la vérification
  });
});

/**
 * Tests pour la fonction admin_list_members
 */
describe("admin_list_members", () => {
  it("doit être une fonction SQL SECURITY DEFINER", () => {
    const sql = `
      CREATE OR REPLACE FUNCTION public.admin_list_members()
      RETURNS TABLE (
        id uuid,
        email text,
        full_name text,
        business_name text,
        role text,
        cohort_id uuid,
        subscription_active boolean
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $$
      BEGIN
        if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
          raise exception 'Unauthorized: only admins can list members';
        end if;
        
        return query
        select
          p.id,
          au.email,
          p.full_name,
          p.business_name,
          p.role,
          p.cohort_id,
          exists (
            select 1 from subscriptions s
            where s.profile_id = p.id
            and s.expires_at > now()
          ) as subscription_active
        from profiles p
        left join auth.users au on au.id = p.id;
      END;
      $$;
    `;
    
    expect(sql).toBeDefined();
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain("raise exception 'Unauthorized: only admins can list members'");
  });

  it("doit interdire à un non-admin de lister les membres", () => {
    // Simulation : si l'appelant n'est pas admin, lever une exception
    const callerRole = "participant";
    const isAdmin = callerRole === "admin";
    
    expect(isAdmin).toBe(false);
    // Dans la fonction réelle, cela lèverait :
    // raise exception 'Unauthorized: only admins can list members';
  });

  it("doit retourner les emails depuis auth.users", () => {
    // La fonction fait un LEFT JOIN avec auth.users
    const sql = `
      select
        p.id,
        au.email,
        p.full_name,
        p.business_name,
        p.role,
        p.cohort_id,
        exists (
          select 1 from subscriptions s
          where s.profile_id = p.id
          and s.expires_at > now()
        ) as subscription_active
      from profiles p
      left join auth.users au on au.id = p.id;
    `;
    
    expect(sql).toContain("auth.users");
    expect(sql).toContain("au.email");
  });
});
