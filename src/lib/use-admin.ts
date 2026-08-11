import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { isAdminUser } from "./admin.functions";

/** True only when the server confirms the signed-in user holds the admin role. */
export function useIsAdmin() {
  const check = useServerFn(isAdminUser);
  const query = useQuery({
    queryKey: ["admin", "is-admin"],
    queryFn: () => check(),
    staleTime: 60_000,
    retry: false,
  });
  return { isAdmin: !!query.data?.isAdmin, isPending: query.isPending };
}