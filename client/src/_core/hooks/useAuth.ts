import { trpc } from "@/lib/trpc";
import { useCallback, useMemo } from "react";

export function useAuth() {
  const utils = trpc.useUtils();

  const isAdminQuery = trpc.auth.isAdmin.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.adminLogout.useMutation({
    onSuccess: () => {
      utils.auth.isAdmin.setData(undefined, false);
      window.location.reload();
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      utils.auth.isAdmin.setData(undefined, false);
      await utils.auth.isAdmin.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    return {
      isAdmin: isAdminQuery.data ?? false,
      loading: isAdminQuery.isLoading || logoutMutation.isPending,
      error: isAdminQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: isAdminQuery.data ?? false,
    };
  }, [
    isAdminQuery.data,
    isAdminQuery.error,
    isAdminQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  return {
    ...state,
    refresh: () => isAdminQuery.refetch(),
    logout,
  };
}
