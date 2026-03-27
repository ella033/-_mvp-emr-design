import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import type {
  MyTreeGridHeaderType,
  MyTreeGridRowType,
  CellUpdateHandler,
} from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import { MyTreeGridRef } from "@/components/yjg/my-tree-grid/my-tree-grid";
import {
  flattenTree,
  getCellValueAsString,
  getInitialHeaders,
  getInitialShowRowIcon,
  removeRows,
  saveHeaders,
  saveShowRowIcon,
  updateAllRows,
  updateRow,
} from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import DiseaseActionRow from "./disease-action-row/disease-action-row";
import MyTreeGrid from "@/components/yjg/my-tree-grid/my-tree-grid";
import type { ContextMenuAction } from "@/components/yjg/my-tree-grid/my-tree-grid-interface";
import { Trash, Trash2, Undo, Redo } from "lucide-react";
import { convertDiseaseLibraryToMyTreeGridType } from "./converter/disease-library-converter";
import { GetItemTypeCategoryIcon } from "@/types/master-data/item-type";
import { useToastHelpers } from "@/components/ui/toast";
import { defaultDiseaseHeaders } from "./disease-header";

const DISEASE_GRID_SIZE = "sm";

export interface DiseaseGridRef {
  getTreeData: () => MyTreeGridRowType[];
  addDiseaseLibrary: (disease: any) => void;
  addDiseases: (diseases: any[]) => void;
}

interface DiseaseGridProps {
  headerLsKey: string;
  data: any[];
  onConvertToGridRowTypes: (
    size: "xs" | "sm" | "default" | "lg" | "xl",
    data: any[],
    handleToggleMainDisease: (rowKey: string) => void,
    isHighlight?: boolean,
    lastIndex?: number
  ) => MyTreeGridRowType[];
  isCheckExclude?: boolean;
  onDataChanged?: (isChanged: boolean) => void;
}

const DiseaseGrid = forwardRef<DiseaseGridRef, DiseaseGridProps>(
  (
    {
      headerLsKey,
      data,
      onConvertToGridRowTypes,
      isCheckExclude = false,
      onDataChanged,
    },
    ref
  ) => {
    const { warning } = useToastHelpers();
    const treeRef = useRef<MyTreeGridRef>(null);
    const gridContainerRef = useRef<HTMLDivElement>(null);
    /** 선택삭제 후 같은 인덱스에 선택 복원할 때 사용 */
    const selectionIndexAfterDeleteRef = useRef<number | null>(null);
    const [headers, setHeaders] = useState<MyTreeGridHeaderType[]>(
      getInitialHeaders(headerLsKey, defaultDiseaseHeaders)
    );
    const [treeData, setTreeData] = useState<MyTreeGridRowType[]>([]);
    // 히스토리 데이터 저장 (undo/redo 기능용)
    const [treeDataHistory, setTreeDataHistory] = useState<
      MyTreeGridRowType[][]
    >([]);

    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [selectedRows, setSelectedRows] = useState<MyTreeGridRowType[]>([]);
    const [shouldClearHighlights, setShouldClearHighlights] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [showRowIcon, setShowRowIcon] = useState(() =>
      getInitialShowRowIcon(headerLsKey)
    );

    // 히스토리에 데이터 추가
    const addToHistory = useCallback(
      (newTreeData: MyTreeGridRowType[]) => {
        // 현재 인덱스 다음 위치에 새 히스토리 삽입
        const newHistory = [
          ...treeDataHistory.slice(0, historyIndex + 1),
          newTreeData,
          ...treeDataHistory.slice(historyIndex + 1),
        ];
        const trimmedHistory = newHistory.slice(-30);

        // 히스토리와 인덱스를 동시에 업데이트
        setTreeDataHistory(trimmedHistory);
        setHistoryIndex(historyIndex + 1);
      },
      [treeDataHistory, historyIndex]
    );

    // 실행 취소
    const undo = useCallback(() => {
      setHistoryIndex((prevIndex) => {
        if (prevIndex > 0) {
          const newIndex = prevIndex - 1;
          const newTreeData = treeDataHistory[newIndex];
          if (newTreeData) {
            setTreeData(newTreeData);
            return newIndex;
          }
        }
        return prevIndex;
      });
    }, [treeDataHistory]);

    // 다시 실행
    const redo = useCallback(() => {
      setHistoryIndex((prevIndex) => {
        if (prevIndex < treeDataHistory.length - 1) {
          const newIndex = prevIndex + 1;
          const newTreeData = treeDataHistory[newIndex];
          if (newTreeData) {
            setTreeData(newTreeData);
            return newIndex;
          }
        }
        return prevIndex;
      });
    }, [treeDataHistory]);

    const isUndoDisabled = useCallback(
      (
        _header: MyTreeGridHeaderType,
        _row: MyTreeGridRowType,
        _selectedRows: MyTreeGridRowType[]
      ) => {
        return historyIndex <= 0;
      },
      [historyIndex]
    );

    const isRedoDisabled = useCallback(
      (
        _header: MyTreeGridHeaderType,
        _row: MyTreeGridRowType,
        _selectedRows: MyTreeGridRowType[]
      ) => {
        return historyIndex >= treeDataHistory.length - 1;
      },
      [historyIndex, treeDataHistory.length]
    );

    // 히스토리 배열이 변경될 때 인덱스 유효성 검사
    useEffect(() => {
      if (historyIndex >= treeDataHistory.length) {
        setHistoryIndex(Math.max(0, treeDataHistory.length - 1));
      }
    }, [treeDataHistory.length, historyIndex]);

    // 데이터 변경 여부를 상위 컴포넌트에 알림
    const prevIsChangedRef = useRef<boolean>(false);
    useEffect(() => {
      const isChanged = historyIndex > 0;
      // 이전 값과 다를 경우에만 호출하여 무한 루프 방지
      if (prevIsChangedRef.current !== isChanged) {
        prevIsChangedRef.current = isChanged;
        onDataChanged?.(isChanged);
      }
    }, [historyIndex, onDataChanged]);

    // 메인 질병 토글 핸들러
    const handleToggleMainDisease = useCallback(
      (rowKey: string) => {
        setTreeData((prevTreeData) => {
          if (!prevTreeData || !Array.isArray(prevTreeData))
            return prevTreeData;

          const targetRow = prevTreeData.find((row) => row.rowKey === rowKey);
          if (!targetRow) return prevTreeData;

          // 클릭한 row를 맨 위로 이동
          const otherRows = prevTreeData.filter((row) => row.rowKey !== rowKey);
          const newTreeData = [targetRow, ...otherRows];

          // 히스토리에 추가
          addToHistory(newTreeData);
          return newTreeData;
        });
      },
      [addToHistory]
    );

    // 데이터 변환 함수
    const transformRowWithMainDiseaseButton = (
      row: MyTreeGridRowType,
      index: number
    ) => {
      const isMainDisease = index === 0;

      return {
        ...row,
        // 주상병이면 해당 row에 배경색 적용 (최상단 row)
        ...(isMainDisease ? { className: "bg-[var(--bg-main-disease)] text-[var(--fg-main)]" } : {}),
        // 주상병이면 isExcluded를 false로 설정
        cells: isMainDisease
          ? row.cells?.map((cell) =>
            cell.headerKey === "isExcluded" ? { ...cell, value: false } : cell
          )
          : row.cells,
        iconBtn: (
          <GetItemTypeCategoryIcon
            size={DISEASE_GRID_SIZE}
            category="disease"
            iconClassName={isMainDisease ? "text-orange-500" : ""}
            onClick={() => handleToggleMainDisease(row.rowKey)}
          />
        ),
      };
    };

    // 데이터 초기화
    useEffect(() => {
      const newTreeData = onConvertToGridRowTypes(
        DISEASE_GRID_SIZE,
        data,
        handleToggleMainDisease
      );
      setTreeData(newTreeData || []);
      // 히스토리 초기화 (초기 데이터를 히스토리의 첫 번째로 설정)
      setTreeDataHistory([newTreeData || []]);
      setHistoryIndex(0);
    }, [data]);

    // 트리 데이터 업데이트 (메인 질병 버튼 추가)
    const updatedTreeData = useMemo(() => {
      if (!treeData || !Array.isArray(treeData)) {
        return [];
      }
      return treeData.map((row, index) =>
        transformRowWithMainDiseaseButton(row, index)
      );
    }, [treeData, handleToggleMainDisease]);

    // 하이라이트 클리어 처리
    useEffect(() => {
      if (!shouldClearHighlights) return;

      const timer = setTimeout(() => {
        const updatedData = updateAllRows(treeData, {
          isHighlight: false,
        });
        setTreeData(updatedData);
        setShouldClearHighlights(false);
      }, 500);

      return () => clearTimeout(timer);
    }, [shouldClearHighlights, treeData]);

    // 선택삭제 후 같은 인덱스에 선택 복원
    useEffect(() => {
      const pendingIndex = selectionIndexAfterDeleteRef.current;
      if (pendingIndex === null) return;

      selectionIndexAfterDeleteRef.current = null;
      const flat = flattenTree(treeData, false, 0, 1, true);
      const idx = Math.min(pendingIndex, Math.max(0, flat.length - 1));
      const row = flat[idx];
      if (row) {
        treeRef.current?.setSelectedRowKeys([row.rowKey]);
      }
    }, [treeData]);

    // 드래그 앤 드롭 데이터 변경
    const handleDataChange = useCallback(
      (newData: MyTreeGridRowType[]) => {
        const updatedData = newData.map((row, index) => {
          return {
            ...row,
            sortNumber: index + 1,
          };
        });

        setTreeData(updatedData);
        // 히스토리에 추가
        addToHistory(updatedData);
      },
      [addToHistory]
    );

    const updateIsSuspected: CellUpdateHandler = useCallback(
      (row, value) => {
        return {
          ...row,
          cells:
            row.cells?.map((cell) => {
              if (cell.headerKey === "isSuspected") {
                return { ...cell, value };
              }
              if (value === true && cell.headerKey === "isExcluded") {
                return { ...cell, value: false };
              }
              return cell;
            }) || [],
        };
      },
      [isCheckExclude]
    );

    const updateIsExcluded: CellUpdateHandler = useCallback(
      (row, value) => {
        return {
          ...row,
          cells:
            row.cells?.map((cell) => {
              if (cell.headerKey === "isExcluded") {
                return { ...cell, value };
              }
              if (value === true && cell.headerKey === "isSuspected") {
                return { ...cell, value: false };
              }
              return cell;
            }) || [],
        };
      },
      [isCheckExclude]
    );

    const cellUpdateHandlers: Record<string, CellUpdateHandler> = useMemo(
      () => ({
        isSuspected: updateIsSuspected,
        isExcluded: updateIsExcluded,
      }),
      [updateIsSuspected, updateIsExcluded]
    );

    // 개별 셀 데이터 변경
    const handleDataChangeItem = useCallback(
      (
        headerKey: string,
        row: MyTreeGridRowType,
        value: string | number | boolean
      ) => {
        // isExcluded를 true로 설정하려고 할 때 주상병인지 확인
        if (isCheckExclude && headerKey === "isExcluded" && value === true) {
          const isMainDisease =
            treeData.length > 0 && treeData[0]?.rowKey === row.rowKey;
          if (isMainDisease) {
            warning("주상병은 배제할 수 없습니다.");
            return; // 변경하지 않고 반환
          }
        }

        setTreeData((prevTreeData) => {
          // 헤더 키에 해당하는 업데이트 핸들러가 있는 경우
          const updateHandler = cellUpdateHandlers[headerKey];
          let updatedRow: MyTreeGridRowType;

          if (updateHandler) {
            updatedRow = updateHandler(row, value);
          } else {
            // 업데이트 핸들러가 없는 경우 기본 로직
            updatedRow = {
              ...row,
              cells:
                row.cells?.map((cell) => {
                  if (cell.headerKey === headerKey) {
                    return { ...cell, value };
                  }
                  return cell;
                }) || [],
            };
          }
          const newTreeData = updateRow(prevTreeData, row.rowKey, updatedRow);
          // 히스토리에 추가
          addToHistory(newTreeData);
          return newTreeData;
        });
      },
      [addToHistory, cellUpdateHandlers, isCheckExclude, treeData, warning]
    );

    // 선택된 행 변경
    const handleSelectedRowsChange = (
      selectedRows: MyTreeGridRowType[],
      _lastSelectedRow: MyTreeGridRowType | null
    ) => {
      setSelectedRows(selectedRows);
    };

    // 선택된 행들의 데이터 일괄 변경
    const handleSelectedRowsDataChange = useCallback(
      (
        headerKey: string,
        selectedRows: MyTreeGridRowType[],
        value: string | number | boolean
      ) => {
        // isExcluded를 true로 설정하려고 할 때 주상병이 포함되어 있는지 확인
        if (isCheckExclude && headerKey === "isExcluded" && value === true) {
          const mainDiseaseRowKey = treeData[0]?.rowKey;
          const hasMainDisease = selectedRows.some(
            (row) => row.rowKey === mainDiseaseRowKey
          );
          if (hasMainDisease) {
            warning("주상병은 배제할 수 없습니다.");
            // 주상병을 제외한 나머지만 처리하도록 selectedRows 필터링
            selectedRows = selectedRows.filter(
              (row) => row.rowKey !== mainDiseaseRowKey
            );
            if (selectedRows.length === 0) return;
          }
        }

        setTreeData((prevTreeData) => {
          const newTreeData = prevTreeData.map((row) => {
            const isSelected = selectedRows.some(
              (selectedRow) => selectedRow.rowKey === row.rowKey
            );

            if (isSelected) {
              return {
                ...row,
                cells:
                  row.cells?.map((cell) => {
                    if (cell.headerKey === headerKey) {
                      return { ...cell, value };
                    }
                    if (value === true) {
                      // isSuspected가 true가 되면 isExcluded는 false
                      if (
                        headerKey === "isSuspected" &&
                        cell.headerKey === "isExcluded"
                      ) {
                        return { ...cell, value: false };
                      }
                      // isExcluded가 true가 되면 isSuspected는 false
                      if (
                        headerKey === "isExcluded" &&
                        cell.headerKey === "isSuspected"
                      ) {
                        return { ...cell, value: false };
                      }
                    }
                    return cell;
                  }) || [],
              };
            }

            return row;
          });

          // 히스토리에 추가
          addToHistory(newTreeData);
          return newTreeData;
        });
      },
      [addToHistory, isCheckExclude, treeData, warning]
    );

    const afterAddDisease = () => {
      setShouldClearHighlights(true);
      treeRef.current?.scrollToBottom();
    };

    const getDiseaseLibraryId = useCallback((disease: any): string | null => {
      const id = disease?.diseaseLibraryId ?? disease?.id;
      if (id == null || id === "") return null;
      return String(id);
    }, []);

    const getExistingDiseaseLibraryIds = useCallback(
      (rows: MyTreeGridRowType[]) => {
        const allRows = flattenTree(rows, true);
        return new Set(
          allRows
            .map((row) => getCellValueAsString(row, "diseaseLibraryId"))
            .filter((id): id is string => id != null && id !== "")
        );
      },
      []
    );

    const splitDiseasesByDuplicate = useCallback(
      (diseases: any[], existingIds: Set<string>) => {
        const uniqueDiseases: any[] = [];
        const duplicatedDiseases: any[] = [];

        diseases.forEach((disease) => {
          const diseaseLibraryId = getDiseaseLibraryId(disease);
          if (!diseaseLibraryId) {
            uniqueDiseases.push(disease);
            return;
          }
          if (existingIds.has(diseaseLibraryId)) duplicatedDiseases.push(disease);
          else uniqueDiseases.push(disease);
        });

        return { uniqueDiseases, duplicatedDiseases };
      },
      [getDiseaseLibraryId]
    );

    const addLibrary = (disease: any) => {
      const diseaseLibraryId = getDiseaseLibraryId(disease);
      const existingIds = getExistingDiseaseLibraryIds(treeData);
      if (diseaseLibraryId && existingIds.has(diseaseLibraryId)) {
        warning("이미 추가된 상병입니다.");
        return;
      }
      const newRow = convertDiseaseLibraryToMyTreeGridType(
        DISEASE_GRID_SIZE,
        disease,
        handleToggleMainDisease
      );
      if (newRow) {
        newRow.isHighlight = true;
        setTreeData((prevTreeData) => {
          const newTreeData = [...prevTreeData, newRow];
          // 히스토리에 추가
          addToHistory(newTreeData);
          return newTreeData;
        });
        afterAddDisease();
      }
    };

    // 질병 선택 처리
    const handleAddLibrary = useCallback(
      (data: any) => {
        addLibrary(data);
      },
      [handleToggleMainDisease, addToHistory]
    );

    // ref 노출
    useImperativeHandle(
      ref,
      () => ({
        getTreeData: () => treeData,
        addDiseaseLibrary: (disease: any) => {
          addLibrary(disease);
        },
        addDiseases: (diseases: any[]) => {
          const existingIds = getExistingDiseaseLibraryIds(treeData);
          const { uniqueDiseases, duplicatedDiseases } = splitDiseasesByDuplicate(
            diseases,
            existingIds
          );
          const diseasesToAdd = uniqueDiseases;
          const excludedCount = duplicatedDiseases.length;
          if (excludedCount > 0) {
            let message = "";
            if (diseasesToAdd.length > 0) {
              message = `중복된 상병을 제외하고 ${diseasesToAdd.length}건의 상병을 추가하였습니다.`;
            } else {
              message = `중복된 상병입니다.`;
            }
            warning(message);
          }
          if (diseasesToAdd.length === 0) return;
          const rows = onConvertToGridRowTypes(
            DISEASE_GRID_SIZE,
            diseasesToAdd,
            handleToggleMainDisease,
            true,
            treeData.length
          );
          setTreeData((prevTreeData) => {
            const newTreeData = [...prevTreeData, ...rows];
            // 히스토리에 추가
            addToHistory(newTreeData);
            return newTreeData;
          });
          afterAddDisease();
        },
      }),
      [
        treeData,
        onConvertToGridRowTypes,
        handleToggleMainDisease,
        addToHistory,
        getExistingDiseaseLibraryIds,
        splitDiseasesByDuplicate,
      ]
    );

    // 키보드 이벤트 처리 (포커스 상태에서만)
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isFocused) return;

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
        ) {
          e.preventDefault();
          redo();
        } else if (e.key === "Delete") {
          // input/textarea 내에서는 삭제 동작 무시
          const activeElement = document.activeElement;
          if (
            activeElement instanceof HTMLInputElement ||
            activeElement instanceof HTMLTextAreaElement ||
            (activeElement as HTMLElement)?.isContentEditable
          ) {
            return;
          }

          if (e.shiftKey) {
            // Shift + Delete: 전체삭제
            e.preventDefault();
            e.stopImmediatePropagation();
            deleteAllRows();
          } else if (!e.ctrlKey && !e.altKey) {
            // Delete: 선택삭제
            e.preventDefault();
            e.stopImmediatePropagation();
            if (selectedRows.length > 0) {
              const first = selectedRows[0];
              if (!first) return;
              const flatBefore = flattenTree(treeData, false, 0, 1, true);
              const firstIndex = flatBefore.findIndex(
                (r) => r.rowKey === first.rowKey
              );
              const targetIndex = firstIndex >= 0 ? firstIndex : 0;

              const rowKeys = selectedRows.map((r) => r.rowKey);
              const updatedData = removeRows(treeData, rowKeys);
              selectionIndexAfterDeleteRef.current = targetIndex;
              setTreeData(updatedData);
              addToHistory(updatedData);
            }
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isFocused, undo, redo, selectedRows, treeData, addToHistory]);

    const deleteSelectedRows = (
      _header: MyTreeGridHeaderType,
      _row: MyTreeGridRowType,
      selectedRows: MyTreeGridRowType[]
    ) => {
      if (selectedRows.length === 0) return;
      const first = selectedRows[0];
      if (!first) return;
      const flatBefore = flattenTree(treeData, false, 0, 1, true);
      const firstIndex = flatBefore.findIndex(
        (r) => r.rowKey === first.rowKey
      );
      const targetIndex = firstIndex >= 0 ? firstIndex : 0;

      const rowKeys = Array.from(selectedRows).map((n) => n.rowKey);
      const updatedData = removeRows(treeData, rowKeys);
      selectionIndexAfterDeleteRef.current = targetIndex;
      setTreeData(updatedData);
      // 히스토리에 추가
      addToHistory(updatedData);
    };

    const deleteAllRows = () => {
      if (treeData.length === 0) return;
      setTreeData([]);
      // 히스토리에 추가
      addToHistory([]);
    };

    const contextMenuActions: ContextMenuAction[] = [
      {
        id: "delete",
        label: "선택삭제",
        icon: <Trash className="w-3 h-3" />,
        onClick: deleteSelectedRows,
        shortcuts: ["delete"],
      },
      {
        id: "deleteAll",
        label: "전체삭제",
        icon: <Trash2 className="w-3 h-3" />,
        onClick: deleteAllRows,
        shortcuts: ["shift+delete"],
      },
      {
        id: "undo",
        label: "되돌리기",
        icon: <Undo className="w-3 h-3" />,
        onClick: undo,
        disabled: isUndoDisabled,
        shortcuts: ["ctrl", "z"],
      },
      {
        id: "redo",
        label: "다시 실행",
        icon: <Redo className="w-3 h-3" />,
        onClick: redo,
        disabled: isRedoDisabled,
        shortcuts: ["ctrl", "y"],
      },
    ];

    // 헤더 저장
    useEffect(() => {
      saveHeaders(headerLsKey, headers);
    }, [headers, headerLsKey]);

    // 행 아이콘 보이기 설정 저장
    useEffect(() => {
      saveShowRowIcon(headerLsKey, showRowIcon);
    }, [showRowIcon, headerLsKey]);

    // 마지막 row에서 ↓ → actionRow 검색 input으로 포커스 이동
    const focusSearchInput = useCallback(() => {
      const searchInput = gridContainerRef.current?.querySelector<HTMLInputElement>(
        "input[type='text']"
      );
      searchInput?.focus();
    }, []);

    // actionRow 검색 input에서 ↑ → 그리드 마지막 행으로 포커스 이동
    const handleSearchInputKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "ArrowUp" && e.target instanceof HTMLInputElement) {
          e.preventDefault();
          treeRef.current?.focusLastRow();
        }
      },
      []
    );

    return (
      <div ref={gridContainerRef} className="flex flex-col gap-2 w-full h-full" onKeyDown={handleSearchInputKeyDown}>
        <div
          className={`flex-1 flex w-full h-full border rounded-sm overflow-hidden ${isFocused
            ? "border-none ring-1 ring-[var(--input-focus)]/50"
            : "border-[var(--border-1)]"
            }`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          tabIndex={0}
        >
          <MyTreeGrid
            ref={treeRef}
            headers={headers}
            setHeaders={setHeaders}
            settingButtonOptions={{
              title: "상병 컬럼 설정",
              defaultHeaders: defaultDiseaseHeaders,
              showRowIconSetting: true,
              showRowIcon,
              onShowRowIconChange: setShowRowIcon,
            }}
            data={updatedTreeData}
            onDataChange={handleDataChange}
            onDataChangeItem={handleDataChangeItem}
            onSelectedRowsChange={handleSelectedRowsChange}
            showContextMenu={true}
            contextMenuActions={contextMenuActions}
            allowDragDrop={true}
            autoExpandOnDrop={true}
            multiSelect={true}
            isOutSideClickUnSelect={false}
            hideBorder={true}
            size={DISEASE_GRID_SIZE}
            showRowIcon={showRowIcon}
            onNavigatePastLastRow={focusSearchInput}
            onEmptyAreaClick={focusSearchInput}
            actionRow={
              <DiseaseActionRow
                size={DISEASE_GRID_SIZE}
                headers={headers}
                selectedRows={selectedRows}
                onSelectedRowsDataChange={handleSelectedRowsDataChange}
                onAddLibrary={handleAddLibrary}
              />
            }
          />
        </div>
      </div>
    );
  }
);

DiseaseGrid.displayName = "DiseaseGrid";

export default DiseaseGrid;
