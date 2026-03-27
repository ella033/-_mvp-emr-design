"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useSenderList } from "@/hooks/crm/use-sender-list";
import { useCreateSender } from "@/hooks/crm/use-create-sender";
import { useDeleteSender } from "@/hooks/crm/use-delete-sender";
import { useUpdateSender } from "@/hooks/crm/use-update-sender";
import { useToastHelpers } from "@/components/ui/toast";

const SenderSettingPage = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newSenderNumber, setNewSenderNumber] = useState<string>("");

  // 발송번호 목록 조회
  const { data: senderData = [], isLoading, error } = useSenderList();
  const createSenderMutation = useCreateSender();
  const deleteSenderMutation = useDeleteSender();
  const updateSenderMutation = useUpdateSender();
  const { success } = useToastHelpers();

  const headerCellStyle =
    "border-none text-sm font-medium text-[var(--gray-200)] align-middle";
  const columnCellStyle =
    "border-none text-sm font-normal text-[var(--gray-300)] align-middle";
  const tableRowStyle = "border-none hover:bg-transparent h-8";

  const handleItemSelect = (senderNumber: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, senderNumber]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== senderNumber));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(senderData.map((item) => item.senderNumber));
    } else {
      setSelectedItems([]);
    }
  };

  const handleDelete = async () => {
    if (selectedItems.length === 0) {
      return;
    }

    try {
      // 선택된 각 발신번호를 순차적으로 삭제
      for (const senderNumber of selectedItems) {
        await deleteSenderMutation.mutateAsync(senderNumber);
      }

      // 삭제 완료 후 선택된 항목 초기화
      setSelectedItems([]);
    } catch (error) {
      console.error("발신번호 삭제 중 오류 발생:", error);
      alert(`발신번호 삭제 실패: ${error}`);
    }
  };

  const handleAddNewSender = () => {
    setIsAddingNew(true);
    setNewSenderNumber("");
  };

  const handleNewSenderNumberChange = (value: string) => {
    setNewSenderNumber(value);
  };

  const handleSaveNewSender = async () => {
    if (!newSenderNumber.trim()) {
      return;
    }

    try {
      await createSenderMutation.mutateAsync({
        senderNumber: newSenderNumber.trim(),
        isMain: true,
      });

      // 성공 시 상태 초기화
      setIsAddingNew(false);
      setNewSenderNumber("");

      // 성공 toast 메시지 표시
      success("새 발신번호가 등록 되었습니다.");
    } catch (error) {
      alert(`발신번호 등록 실패: ${error}`);
    }
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewSenderNumber("");
  };

  const handleMainSenderChange = async (selectedSenderNumber: string) => {
    try {
      // 현재 대표번호가 아닌 경우에만 업데이트
      const currentMainSender = senderData.find((item) => item.isMain);
      if (
        currentMainSender &&
        currentMainSender.senderNumber === selectedSenderNumber
      ) {
        return; // 이미 대표번호인 경우 아무것도 하지 않음
      }

      // 기존 대표번호를 false로 설정
      if (currentMainSender) {
        await updateSenderMutation.mutateAsync({
          senderNumber: currentMainSender.senderNumber,
          data: { isMain: false },
        });
      }

      // 새로 선택된 발신번호를 대표번호로 설정
      await updateSenderMutation.mutateAsync({
        senderNumber: selectedSenderNumber,
        data: { isMain: true },
      });

      // 성공 toast 메시지 표시
      success("대표번호가 변경 되었습니다.");
    } catch (error) {
      console.error("대표번호 변경 중 오류 발생:", error);
      alert(`대표번호 변경 실패: ${error}`);
    }
  };

  return (
    <div className="w-full bg-[var(--bg-2)]" data-testid="crm-settings-page">
      <div
        className="w-[30%] h-full bg-white flex flex-col"
        data-testid="crm-settings-sender-list"
      >
        <div className="space-y-2 p-4 pb-2">
          <div className="flex items-center justify-between">
            <Label className="text-base font-bold">발신번호 목록</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                data-testid="crm-settings-delete-button"
                onClick={handleDelete}
                disabled={
                  selectedItems.length === 0 || deleteSenderMutation.isPending
                }
                className="px-3 bg-white text-[var(--gray-100)] border-[var(--border-1)]"
              >
                {deleteSenderMutation.isPending ? "삭제 중..." : "삭제"}
              </Button>
              <Button
                size="sm"
                data-testid="crm-settings-add-button"
                className="px-3 bg-[var(--main-color)]"
                onClick={handleAddNewSender}
                disabled={isAddingNew}
              >
                발신번호 등록
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 pb-4 overflow-y-auto">
          <RadioGroup
            value={senderData.find((item) => item.isMain)?.senderNumber || ""}
            onValueChange={handleMainSenderChange}
          >
            <Table
              className="border-separate border-spacing-0"
              data-testid="crm-settings-sender-table"
            >
              <TableHeader className="bg-[var(--bg-2)] rounded-t-lg">
                <TableRow className={cn(tableRowStyle)}>
                  <TableHead
                    className={cn(
                      "min-w-8 text-center",
                      headerCellStyle,
                      "rounded-tl-lg"
                    )}
                  >
                    <Checkbox
                      checked={
                        senderData.length > 0 &&
                        selectedItems.length === senderData.length
                      }
                      onCheckedChange={handleSelectAll}
                      disabled={senderData.length === 0 || isLoading}
                    />
                  </TableHead>
                  <TableHead className={cn(headerCellStyle, "text-center")}>
                    발신번호
                  </TableHead>
                  <TableHead
                    className={cn(headerCellStyle, "text-center rounded-tr-lg")}
                  >
                    대표번호
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className={cn(tableRowStyle)}>
                    <TableCell
                      colSpan={3}
                      className={cn(
                        "text-center text-[var(--gray-500)] border-none align-middle"
                      )}
                      style={{ height: "500px" }}
                    >
                      로딩 중...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow className={cn(tableRowStyle)}>
                    <TableCell
                      colSpan={3}
                      className={cn(
                        "text-center text-[var(--gray-500)] border-none align-middle"
                      )}
                      style={{ height: "500px" }}
                    >
                      데이터를 불러오는 중 오류가 발생했습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {senderData.length === 0 && !isAddingNew && (
                      <TableRow className={cn(tableRowStyle)}>
                        <TableCell
                          colSpan={3}
                          className={cn(
                            "text-center text-[var(--gray-500)] border-none align-middle"
                          )}
                          style={{ height: "500px" }}
                        >
                          발신번호를 추가해주세요.
                        </TableCell>
                      </TableRow>
                    )}

                    {senderData.map((item) => (
                      <TableRow
                        key={item.senderNumber}
                        className={cn(
                          tableRowStyle,
                          "cursor-pointer hover:bg-gray-50"
                        )}
                      >
                        <TableCell
                          className={cn("min-w-8 text-center", columnCellStyle)}
                        >
                          <Checkbox
                            checked={selectedItems.includes(item.senderNumber)}
                            onCheckedChange={(checked) =>
                              handleItemSelect(
                                item.senderNumber,
                                checked as boolean
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className={cn(columnCellStyle)}>
                          {item.senderNumber}
                        </TableCell>
                        <TableCell
                          className={cn(columnCellStyle, "text-center")}
                        >
                          <RadioGroupItem
                            value={item.senderNumber}
                            id={item.senderNumber}
                            checked={item.isMain}
                          />
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* 새로운 발신번호 입력 행 */}
                    {isAddingNew && (
                      <TableRow className={cn(tableRowStyle, "bg-blue-50")}>
                        <TableCell
                          className={cn("min-w-8 text-center", columnCellStyle)}
                        >
                          <Checkbox disabled />
                        </TableCell>
                        <TableCell className={cn(columnCellStyle)}>
                          <div className="flex items-center gap-2">
                            <Input
                              data-testid="crm-settings-new-sender-input"
                              value={newSenderNumber}
                              onChange={(e) =>
                                handleNewSenderNumberChange(e.target.value)
                              }
                              placeholder="발신번호를 입력하세요"
                              className="h-8 text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveNewSender();
                                } else if (e.key === "Escape") {
                                  handleCancelAdd();
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              data-testid="crm-settings-save-button"
                              onClick={handleSaveNewSender}
                              disabled={
                                !newSenderNumber.trim() ||
                                createSenderMutation.isPending
                              }
                              className="h-7 px-4 text-xs"
                            >
                              저장
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell
                          className={cn(columnCellStyle, "text-center")}
                        >
                          <RadioGroupItem value="" id="new-sender" disabled />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
};

export default SenderSettingPage;
