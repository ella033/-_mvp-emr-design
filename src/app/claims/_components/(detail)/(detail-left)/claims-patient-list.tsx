"use client";

import {
	claimClassificationToLabel,
	formNumberToInsuranceType,
} from "@/app/claims/(enums)/claims-enums";
import { useClaimsDxStore } from "@/app/claims/(stores)/claims-dx-store";
import { useConfirm } from "@/app/claims/commons/confirm-provider";
import { Button } from "@/components/ui/button";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useToastHelpers } from "@/components/ui/toast";
import { claimsApi } from "@/lib/api/api-routes";
import { ClaimsService } from "@/services/claims-service";
import { useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export interface PatientListItem {
	id: string;
	chartNo: string;
	patientName: string;
	treatmentDate: string;
	errorCount: number;
	reviewStatus: "미심사" | "심사완료" | "제외";
	reviewMemo?: string;
	hasError: boolean;
	isReviewed: boolean;
	isExcluded: boolean;
	hasReviewMemo: boolean;
}

interface ClaimsPatientListProps {
	patients: PatientListItem[];
	selectedId?: string;
	onSelectPatientAction: (id: string) => void;
}

export default function ClaimsPatientList({
	patients,
	selectedId,
	onSelectPatientAction,
}: ClaimsPatientListProps) {
	const [keyword, setKeyword] = useState("");
	const [filterError, setFilterError] = useState(false);
	const [filterUnreviewed, setFilterUnreviewed] = useState(false);
	const [filterExcluded, setFilterExcluded] = useState(false);
	const [filterMemo, setFilterMemo] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [orderedPatientIds, setOrderedPatientIds] = useState<string[]>([]);
	const [draggingPatientId, setDraggingPatientId] = useState<string | null>(null);
	const { confirm } = useConfirm();
	const qc = useQueryClient();
	const params = useParams<{ id: string }>();
	const claimId = params?.id || "";
	const { success } = useToastHelpers();
	const claim = useClaimsDxStore((s) => s.claim);
	const setIsEditing = useClaimsDxStore((s) => s.setIsEditing);

	useEffect(() => {
		setOrderedPatientIds(patients.map((patient) => patient.id));
	}, [patients]);

	const orderedPatients = useMemo(() => {
		if (orderedPatientIds.length === 0) return patients;
		const patientById = new Map(patients.map((patient) => [patient.id, patient]));
		const ordered = orderedPatientIds
			.map((patientId) => patientById.get(patientId))
			.filter((patient): patient is PatientListItem => Boolean(patient));
		const missing = patients.filter((patient) => !orderedPatientIds.includes(patient.id));
		return [...ordered, ...missing];
	}, [patients, orderedPatientIds]);

	const filteredPatients = useMemo(() => {
		return orderedPatients.filter((patient) => {
			if (keyword) {
				const searchTarget = `${patient.patientName} ${patient.chartNo} ${patient.reviewMemo ?? ""}`;
				if (!searchTarget.includes(keyword)) return false;
			}
			if (filterError && !patient.hasError) return false;
			if (filterUnreviewed && patient.isReviewed) return false;
			if (filterExcluded && !patient.isExcluded) return false;
			if (filterMemo && !patient.hasReviewMemo) return false;
			return true;
		});
	}, [orderedPatients, keyword, filterError, filterUnreviewed, filterExcluded, filterMemo]);

	const submitClaim = async (submitClaimId: string) => {
		await ClaimsService.completeClaim(submitClaimId);
		await qc.invalidateQueries({ queryKey: ["claims"] });
		const downloadUrl = `/api${claimsApi.samFile(submitClaimId)}`;
		const anchor = document.createElement("a");
		anchor.href = downloadUrl;
		anchor.download = "";
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
	};

	const handleSubmitClaim = async (
		event: React.MouseEvent<HTMLButtonElement>,
		targetClaim: any
	) => {
		event.stopPropagation();
		const hasError = (targetClaim.errorCount ?? 0) > 0;
		const message = `${hasError ? "수정되지 않은 오류가 있습니다.\n" : ""}${String(targetClaim.treatmentYearMonth).slice(0, 4)}년 ${String(targetClaim.treatmentYearMonth).slice(4, 6)}월 ${formNumberToInsuranceType(targetClaim.formNumber)} ${claimClassificationToLabel(targetClaim.claimClassification)} ${targetClaim.claimOrder ?? "1"}차\n명세서를 송신하시겠습니까?`;
		const ok = await confirm({
			message,
			confirmText: "송신",
			cancelText: "취소",
		});
		if (!ok) return;

		try {
			await submitClaim(targetClaim.id);
		} catch (error: any) {
			alert(error?.message || "송신 처리에 실패했습니다.");
		}
	};

	const hasSelection = selectedIds.size > 0;

	const buildReorderedPatientIds = (
		sourceIds: string[],
		fromPatientId: string,
		toPatientId: string
	): string[] => {
		const fromIndex = sourceIds.indexOf(fromPatientId);
		const toIndex = sourceIds.indexOf(toPatientId);
		if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
			return sourceIds;
		}
		const nextIds = [...sourceIds];
		const [movedId] = nextIds.splice(fromIndex, 1);
		if (!movedId) return sourceIds;
		nextIds.splice(toIndex, 0, movedId);
		return nextIds;
	};

	const handleDropPatient = async (targetPatientId: string) => {
		if (!draggingPatientId || draggingPatientId === targetPatientId) return;
		const currentOrder = orderedPatientIds.length > 0
			? orderedPatientIds
			: patients.map((patient) => patient.id);
		const nextOrder = buildReorderedPatientIds(
			currentOrder,
			draggingPatientId,
			targetPatientId
		);
		if (nextOrder === currentOrder) return;

		const previousOrder = currentOrder;
		setOrderedPatientIds(nextOrder);
		setDraggingPatientId(null);

		try {
			if (!claimId) return;
			await ClaimsService.reorderClaimDetails(claimId, nextOrder);
			await qc.invalidateQueries({
				queryKey: ["claim-details-by-claim-id", claimId],
			});
			success("명세서 순서를 변경했습니다.");
		} catch (error: any) {
			setOrderedPatientIds(previousOrder);
			alert(error?.message || "명세서 순서 변경에 실패했습니다.");
		}
	};

	const handlePreReview = async () => {
		if (!claimId || selectedIds.size === 0) return;
		const ok = await confirm({
			message: "선택된 환자를 사전심사 대상으로 처리하시겠습니까?",
			confirmText: "확인",
			cancelText: "취소",
		});
		if (!ok) return;

		await Promise.all(
			[...selectedIds].map((detailId) =>
				ClaimsService.updateLinkedClaimDetail(claimId, detailId, null)
			)
		);
		qc.invalidateQueries({ queryKey: ["claim-details-by-claim-id", claimId] });
		setSelectedIds(new Set());
		success("사전심사 처리 완료");
	};

	return (
		<div className="h-full bg-[var(--bg-main)]">
				<div className="h-full px-4 py-3">
					<div className="mx-auto flex h-full w-full max-w-[510px] flex-col gap-3">
						<div className="flex items-center justify-between">
							<h3 className="text-[16px] font-bold leading-[1.4] tracking-[-0.16px] text-[var(--gray-100)]">
								환자목록
							</h3>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									className="h-8 min-w-[69px] rounded-[4px] border-[var(--main-color)] px-3 text-[13px] font-medium text-[var(--main-color)]"
									disabled={!hasSelection}
									onClick={handlePreReview}
								>
									사전심사
								</Button>
								<Button
									size="sm"
									className="h-8 min-w-[64px] rounded-[4px] bg-[var(--main-color)] px-3 text-[13px] font-medium text-white hover:bg-[var(--main-color-hover)]"
									onClick={(event) => handleSubmitClaim(event, claim as any)}
								>
									송신
								</Button>
							</div>
						</div>

						<div>
							<div className="relative mb-2">
								<Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-400)]" />
								<input
									className="h-8 w-full rounded-[6px] border border-[var(--border-2)] bg-[var(--bg-main)] pl-8 pr-3 text-[13px] leading-[1.25] tracking-[-0.13px] text-[var(--gray-200)]"
									placeholder="검색어를 검색하세요."
									value={keyword}
									onChange={(event) => setKeyword(event.target.value)}
								/>
							</div>

							<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--gray-300)]">
								<label className="inline-flex items-center gap-1">
									<input
										type="checkbox"
										className="size-4 rounded-[4px] border-[var(--border-2)]"
										checked={
											!filterError &&
											!filterUnreviewed &&
											!filterExcluded &&
											!filterMemo
										}
										onChange={() => {
											setFilterError(false);
											setFilterUnreviewed(false);
											setFilterExcluded(false);
											setFilterMemo(false);
										}}
									/>
									전체
								</label>
								<label className="inline-flex items-center gap-1">
									<input
										type="checkbox"
										className="size-4 rounded-[4px] border-[var(--border-2)]"
										checked={filterError}
										onChange={(event) => setFilterError(event.target.checked)}
									/>
									오류
								</label>
								<label className="inline-flex items-center gap-1">
									<input
										type="checkbox"
										className="size-4 rounded-[4px] border-[var(--border-2)]"
										checked={filterUnreviewed}
										onChange={(event) => setFilterUnreviewed(event.target.checked)}
									/>
									미심사
								</label>
								<label className="inline-flex items-center gap-1">
									<input
										type="checkbox"
										className="size-4 rounded-[4px] border-[var(--border-2)]"
										checked={filterExcluded}
										onChange={(event) => setFilterExcluded(event.target.checked)}
									/>
									제외
								</label>
								<label className="inline-flex items-center gap-1">
									<input
										type="checkbox"
										className="size-4 rounded-[4px] border-[var(--border-2)]"
										checked={filterMemo}
										onChange={(event) => setFilterMemo(event.target.checked)}
									/>
									심사메모 작성
								</label>
							</div>
						</div>

						<div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
							<Table className="w-full table-fixed border-collapse [&_tr]:border-0 [&_thead]:border-0 [&_th]:border-0 [&_tbody]:border-0">
								<TableHeader className="sticky top-0 z-10">
									<TableRow className="h-[28px] bg-[var(--bg-2)] hover:bg-[var(--bg-2)]">
										<TableHead className="w-[44px] p-0">
											<div className="flex h-[28px] items-center justify-center pl-1">
												<input
													type="checkbox"
													className="size-4 rounded-[4px] border-[var(--border-2)]"
													checked={
														filteredPatients.length > 0 &&
														filteredPatients.every((patient) =>
															selectedIds.has(patient.id)
														)
													}
													onChange={(event) => {
														setSelectedIds((prev) => {
															const next = new Set(prev);
															if (event.target.checked) {
																filteredPatients.forEach((patient) =>
																	next.add(patient.id)
																);
															} else {
																filteredPatients.forEach((patient) =>
																	next.delete(patient.id)
																);
															}
															return next;
														});
													}}
												/>
											</div>
										</TableHead>
										<TableHead className="w-[58px] p-0 text-center text-[12px] font-medium text-[var(--gray-200)]">
											차트번호
										</TableHead>
										<TableHead className="w-[72px] p-0 text-center text-[12px] font-medium text-[var(--gray-200)]">
											환자명
										</TableHead>
										<TableHead className="w-[86px] p-0 text-center text-[12px] font-medium text-[var(--gray-200)]">
											진료일자
										</TableHead>
										<TableHead className="w-[68px] p-0 text-center text-[12px] font-medium text-[var(--gray-200)]">
											오류
										</TableHead>
										<TableHead className="w-[74px] p-0 text-center text-[12px] font-medium text-[var(--gray-200)]">
											심사상태
										</TableHead>
										<TableHead className="p-0 text-center text-[12px] font-medium text-[var(--gray-200)]">
											심사메모
										</TableHead>
									</TableRow>
								</TableHeader>

								<TableBody>
									{filteredPatients.length > 0 ? (
										filteredPatients.map((patient) => {
											const isSelected = selectedId === patient.id;
											return (
												<TableRow
													key={patient.id}
													className={`h-[28px] cursor-pointer border-b border-[var(--border-1)] last:border-b-0 hover:bg-[var(--bg-1)] ${
														isSelected ? "bg-[#F0ECFE]" : "bg-[var(--bg-main)]"
													}`}
													draggable
													onDragStart={() => setDraggingPatientId(patient.id)}
													onDragOver={(event) => event.preventDefault()}
													onDrop={() => {
														void handleDropPatient(patient.id);
													}}
													onDragEnd={() => setDraggingPatientId(null)}
													onClick={() => {
														setIsEditing(false);
														onSelectPatientAction(patient.id);
													}}
												>
													<TableCell className="p-0">
														<div className="flex h-[28px] items-center justify-center pl-1">
															<input
																type="checkbox"
																checked={selectedIds.has(patient.id)}
																onClick={(event) => event.stopPropagation()}
																onChange={(event) => {
																	setSelectedIds((prev) => {
																		const next = new Set(prev);
																		if (event.target.checked) next.add(patient.id);
																		else next.delete(patient.id);
																		return next;
																	});
																}}
																className="size-4 rounded-[4px] border-[var(--border-2)]"
															/>
														</div>
													</TableCell>
													<TableCell className="truncate p-0 text-center text-[12px] text-[var(--gray-300)]">
														{patient.chartNo}
													</TableCell>
													<TableCell className="truncate p-0 text-center text-[12px] text-[var(--gray-300)]">
														{patient.patientName}
													</TableCell>
													<TableCell className="truncate p-0 text-center text-[12px] text-[var(--gray-300)]">
														{patient.treatmentDate}
													</TableCell>
													<TableCell className="p-0 text-center text-[12px]">
														{patient.errorCount > 0 ? (
															<span className="inline-flex items-center justify-center gap-1.5 font-medium text-[#FF4242]">
																<img src="/icon/ic_line_alert-circle.svg" alt="" className="h-4 w-4 shrink-0" />
																{patient.errorCount}건
															</span>
														) : (
															<span className="text-[var(--gray-300)]">0건</span>
														)}
													</TableCell>
													<TableCell className="p-0 text-[12px]">
														<span className={`inline-flex items-center justify-center gap-[2px] w-full ${patient.reviewStatus === "심사완료" ? "font-medium text-[#2EA652]" : "text-[var(--gray-300)]"}`}>
															{patient.reviewStatus === "심사완료" && (
																<img src="/icon/ic_filled_check.svg" alt="" className="w-4 h-4 shrink-0" />
															)}
															{patient.reviewStatus || "미심사"}
														</span>
													</TableCell>
													<TableCell className="truncate p-0 text-center text-[12px] text-[var(--gray-300)]">
														{patient.reviewMemo || "-"}
													</TableCell>
												</TableRow>
											);
										})
									) : (
										<TableRow className="h-[40px]">
											<TableCell
												colSpan={7}
												className="text-center text-[12px] text-[var(--gray-500)]"
											>
												데이터가 없습니다.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					</div>
				</div>
		</div>
	);
}