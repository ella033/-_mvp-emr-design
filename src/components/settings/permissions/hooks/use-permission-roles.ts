import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { permissionsApi } from "../api/permissions.api";
import type { PermissionRoleSummary } from "../model";
import { toast } from "sonner"; // Assuming sonner or useToastHelpers, but usually I should use the hook. Check imports.

// Re-implementing toast helper access or standard toast
// The original used `useToastHelpers` from `@/components/ui/toast`. 
// I will just return errors/states and let UI handle toast? 
// Or better, handle toast in mutation callbacks here.

import { useToastHelpers } from "@/components/ui/toast";

export const usePermissionRoles = () => {
  const queryClient = useQueryClient();
  const toast = useToastHelpers();

  const [keyword, setKeyword] = useState("");

  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ["permissions", "roles"],
    queryFn: () => permissionsApi.getRoles(),
    staleTime: 60_000,
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: number) => permissionsApi.deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions", "roles"] });
      toast.success("권한 그룹을 삭제했습니다.");
    },
    onError: (error) => {
      console.error(error);
      toast.error("권한 그룹 삭제에 실패했습니다.");
    },
  });

  const { systemGroups, userGroups } = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    const filtered = roles.filter((role) => {
      if (!term) return true;
      const name = role.name?.toLowerCase() ?? "";
      const desc = role.description?.toLowerCase() ?? "";
      return name.includes(term) || desc.includes(term);
    });

    return {
      systemGroups: filtered.filter((item) => item.isSystem),
      userGroups: filtered.filter((item) => !item.isSystem),
    };
  }, [roles, keyword]);

  return {
    roles,
    systemGroups,
    userGroups,
    isLoading,
    error,
    keyword,
    setKeyword,
    deleteRole: deleteRoleMutation.mutateAsync,
    isDeleting: deleteRoleMutation.isLoading,
  };
};
