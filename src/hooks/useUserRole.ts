import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useUserRole() {
  const { user } = useAuth();

  const { data: roles, isLoading, isFetching, isFetched } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('[useUserRole] Buscando roles para:', user.id);

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error('[useUserRole] Erro ao buscar roles:', error);
        throw error;
      }

      const userRoles = data?.map(r => r.role) || [];
      console.log('[useUserRole] Roles encontradas:', userRoles);
      
      return userRoles;
    },
    enabled: !!user?.id,
    staleTime: 0, // SEMPRE refetch - não usar cache
    gcTime: 1000 * 60 * 10, // Garbage collection após 10 minutos
  });

  // Loading = está fetchando OU (tem user mas ainda não carregou roles completamente)
  const actuallyLoading = isFetching || (!!user?.id && (!isFetched || roles === undefined));

  const isAdmin = roles?.includes("admin") || false;
  const isProfessional = roles?.includes("professional") || false;

  console.log('[useUserRole] Estado final:', { 
    roles, 
    isAdmin, 
    isProfessional, 
    isLoading,
    isFetching,
    isFetched,
    actuallyLoading,
    hasUser: !!user?.id,
    userId: user?.id 
  });

  return {
    roles: roles || [],
    isAdmin,
    isProfessional,
    isLoading: actuallyLoading,
  };
}
