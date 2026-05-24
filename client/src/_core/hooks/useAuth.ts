import { trpc } from "@/lib/trpc";
import { useCallback, useMemo } from "react";

export function useAuth() {
  const utils = trpc.useUtils();

  const sessionQuery = trpc.auth.session.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.session.setData(undefined, {
        isAuthenticated: false,
        isAdmin: false,
        role: "anonymous",
        displayName: null,
      });
      window.location.reload();
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      await utils.auth.session.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    const session = sessionQuery.data;
    return {
      session,
      role: session?.role ?? "anonymous",
      displayName: session?.displayName ?? null,
      isAdmin: session?.isAdmin ?? false,
      isVisitor: session?.role === "visitor",
      loading: sessionQuery.isLoading || logoutMutation.isPending,
      error: sessionQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: session?.isAuthenticated ?? false,
    };
  }, [
    sessionQuery.data,
    sessionQuery.error,
    sessionQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  return {
    ...state,
    refresh: () => sessionQuery.refetch(),
    logout,
  };
}
