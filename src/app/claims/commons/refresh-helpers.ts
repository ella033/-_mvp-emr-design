import type { QueryClient } from "@tanstack/react-query";

export async function refreshClaims(
  qc: QueryClient,
  claimId: string,
  options?: { includeClaimsList?: boolean; includeClaim?: boolean; includeDetails?: boolean }
) {
  const includeClaim = options?.includeClaim ?? true;
  const includeDetails = options?.includeDetails ?? true;
  const includeClaimsList = options?.includeClaimsList ?? false;
  const tasks: Promise<unknown>[] = [];
  if (includeClaim) {
    tasks.push(
      qc.invalidateQueries({
        queryKey: ["claim", claimId],
        refetchType: "all",
      })
    );
  }
  if (includeDetails) {
    tasks.push(
      qc.invalidateQueries({
        queryKey: ["claim-details-by-claim-id", claimId],
        refetchType: "all",
      })
    );
  }
  if (includeClaimsList) {
    tasks.push(
      qc.invalidateQueries({
        queryKey: ["claims"],
        refetchType: "all",
      })
    );
  }
  await Promise.all(tasks);
}

export function mergeClaimDetailCache(
  qc: QueryClient,
  claimId: string,
  detailId: string,
  patch: Record<string, any>
) {
  qc.setQueriesData<any>({ queryKey: ["claim-details-by-claim-id", claimId] }, (old: any) => {
    if (!old) return old;
    const nextData = (old.data ?? []).map((row: any) => (row.id === detailId ? { ...row, ...patch } : row));
    return { ...old, data: nextData };
  });
}


