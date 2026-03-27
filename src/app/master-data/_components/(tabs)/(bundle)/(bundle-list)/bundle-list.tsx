import { MasterDataContainer } from "../../../(common)/common-controls";
import { GridContainer } from "../../../(common)/common-controls";
import MySearchInput from "@/components/yjg/my-search-input";
import {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { MyButton } from "@/components/yjg/my-button";
import type {
  MyTreeGridHeaderType,
  MyTreeGridRowType,
  MyTreeGridRowCellType,
} from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import MyTreeGrid, { type MyTreeGridRef } from "@/components/yjg/my-tree-grid/my-tree-grid";
import { useGetBundleItemsTree } from "@/hooks/master-data/use-bundle-items-tree";
import {
  convertBundleItemsToTreeGridRowType,
  convertBundleItemToTreeGridRowType,
} from "./bundle-item-converter";
import {
  defaultBundleListHeaders,
  LS_BUNDLE_LIST_HEADERS_KEY,
} from "./bundle-header";
import {
  getInitialHeaders,
  saveHeaders,
  findRow,
  findParentRow,
  addRow,
  updateRow,
  updateAllRows,
  flattenTree,
  removeRow,
  findRowsByType,
  changeRowData,
} from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { Folder, ChevronUp, ChevronRight, Trash, Star } from "lucide-react";
import { LineBundleIcon } from "@/components/custom-icons";
import type { BundleCategoryInsert } from "@/types/master-data/bundle/bundle-category-type";
import { useBundleCategoryCreate } from "@/hooks/master-data/use-bundle-category-create";
import { useBundleCategoryUpdate } from "@/hooks/master-data/use-bundle-category-update";
import { useBundleCategoryMove } from "@/hooks/master-data/use-bundle-category-move";
import { useBundleCategoryDelete } from "@/hooks/master-data/use-bundle-category-delete";
import { useToastHelpers } from "@/components/ui/toast";
import { useBundleItemUpsert } from "@/hooks/master-data/use-bundle-item-upsert";
import { useBundleItemDelete } from "@/hooks/master-data/use-bundle-item-delete";
import { useBundleItemMove } from "@/hooks/master-data/use-bundle-item-move";
import { useBundleItemToggleFavorite } from "@/hooks/master-data/use-bundle-item-toggle-favorite";
import type { Bundle } from "@/types/master-data/bundle/bundle-type";
import type { BundleItem } from "@/types/master-data/bundle/bundle-items-type";
import type {
  MyTreeGridDragDropInfo,
  ContextMenuAction,
} from "@/components/yjg/my-tree-grid/my-tree-grid-interface";
import { BundlePriceType } from "@/constants/bundle-price-type";
import type { BundleListRef } from "../master-bundle";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const BundleList = forwardRef<
  BundleListRef,
  {
    setSelectedBundleId?: (id: number) => void;
    onBundleListChange?: () => void;
    onRowDoubleClick?: (row: MyTreeGridRowType) => void;
    searchWord?: string;
    onSearchWordChange?: (value: string) => void;
    hideTopControls?: boolean;
    hideContainerPadding?: boolean;
    hideGridHeader?: boolean;
    hideAddContextMenus?: boolean;
    activeOnly?: boolean;
    favoriteOnly?: boolean;
    title?: string;
    headersStorageKey?: string;
    defaultHeaders?: MyTreeGridHeaderType[];
    RowAction?: (bundle: Bundle) => React.ReactNode;
  }
>(function BundleList(
  {
    setSelectedBundleId,
    onBundleListChange,
    onRowDoubleClick,
    searchWord,
    onSearchWordChange,
    hideTopControls = false,
    hideContainerPadding = false,
    hideGridHeader = false,
    hideAddContextMenus = false,
    activeOnly = false,
    favoriteOnly = false,
    title = "묶음 처방 리스트",
    headersStorageKey = LS_BUNDLE_LIST_HEADERS_KEY,
    defaultHeaders = defaultBundleListHeaders,
    RowAction,
  },
  ref
) {
  const { success, warning, error } = useToastHelpers();
  const queryClient = useQueryClient();
  const [internalSearchWord, setInternalSearchWord] = useState("");
  const resolvedSearchWord = searchWord ?? internalSearchWord;
  const [treeHeaders, setTreeHeaders] = useState<MyTreeGridHeaderType[]>(
    getInitialHeaders(headersStorageKey, defaultHeaders)
  );
  const [treeData, setTreeData] = useState<MyTreeGridRowType[]>([]);
  const [selectedRow, setSelectedRow] = useState<MyTreeGridRowType | null>(null);
  const treeRef = useRef<MyTreeGridRef>(null);
  const { data, isLoading, refetch } = useGetBundleItemsTree(resolvedSearchWord);
  const { mutate: createCategory } = useBundleCategoryCreate();
  const { mutate: updateCategory } = useBundleCategoryUpdate();
  const { mutate: moveCategory } = useBundleCategoryMove();
  const { mutate: deleteCategory } = useBundleCategoryDelete();
  const { mutate: upsertBundle } = useBundleItemUpsert();
  const { mutate: moveBundle } = useBundleItemMove();
  const { mutate: deleteBundle } = useBundleItemDelete();
  const { mutate: toggleFavorite } = useBundleItemToggleFavorite();
  const [shouldClearHighlights, setShouldClearHighlights] = useState(false);
  const [isExpandAll, setIsExpandAll] = useState(false);
  const expandedStatesRef = useRef<Map<string, boolean>>(new Map());

  const hasSearchWord = resolvedSearchWord.trim() !== "";
  const hasNoSearchResults =
    hasSearchWord && !isLoading && treeData.length === 0;

  const invalidateBundleRelatedQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["bundle-items"] });
  };

  const stripPackageChildren = (rows: MyTreeGridRowType[]): MyTreeGridRowType[] => {
    return rows.map((row) => {
      if (row.type === "folder") {
        return {
          ...row,
          children: stripPackageChildren(row.children ?? []),
        };
      }
      if (row.type === "package") {
        return {
          ...row,
          // 리스트에서는 묶음의 하위 묶음을 표시하지 않음
          children: [],
          isExpanded: false,
        };
      }
      return row;
    });
  };

  const filterRows = (
    rows: MyTreeGridRowType[],
    options: { activeOnly: boolean; favoriteOnly: boolean; keepEmptyFolders?: boolean }
  ): MyTreeGridRowType[] => {
    const { activeOnly: useActiveOnly, favoriteOnly: useFavoriteOnly, keepEmptyFolders = false } = options;
    return rows
      .map((row) => {
        if (row.type === "folder") {
          const filteredChildren = filterRows(row.children ?? [], options);
          if (filteredChildren.length === 0 && !keepEmptyFolders) return null;
          return { ...row, children: filteredChildren };
        }

        if (row.type === "package") {
          const isActive = !!row.orgData?.data?.isActive;
          const isFavorite = !!row.orgData?.data?.isFavorite;
          if (useActiveOnly && !isActive) return null;
          if (useFavoriteOnly && !isFavorite) return null;
          return row;
        }

        return row;
      })
      .filter((row): row is MyTreeGridRowType => row !== null);
  };

  const shouldIncludePackage = (
    row: MyTreeGridRowType,
    options: { activeOnly: boolean; favoriteOnly: boolean }
  ) => {
    const isActive = !!row.orgData?.data?.isActive;
    const isFavorite = !!row.orgData?.data?.isFavorite;
    if (options.activeOnly && !isActive) return false;
    if (options.favoriteOnly && !isFavorite) return false;
    return true;
  };

  const collectPromotedPackagesFromHiddenPackage = (
    rows: MyTreeGridRowType[],
    options: { activeOnly: boolean; favoriteOnly: boolean }
  ): MyTreeGridRowType[] => {
    const collected: MyTreeGridRowType[] = [];

    const walk = (items: MyTreeGridRowType[], hasHiddenPackageAncestor: boolean) => {
      items.forEach((item) => {
        if (item.type === "package") {
          const isIncluded = shouldIncludePackage(item, options);

          if (isIncluded) {
            // 비즐겨찾기 package 부모 때문에 가려진 경우에만 루트로 승격
            if (hasHiddenPackageAncestor) {
              collected.push({
                ...item,
                parentRowKey: null,
                level: 0,
                isExpanded: false,
                children: filterRows(item.children ?? [], options),
              });
            }
            return;
          }

          if (item.children && item.children.length > 0) {
            walk(item.children, true);
          }
          return;
        }

        if (item.children && item.children.length > 0) {
          walk(item.children, hasHiddenPackageAncestor);
        }
      });
    };

    walk(rows, false);
    return collected;
  };

  // refetch 함수를 ref로 노출
  useImperativeHandle(
    ref,
    () => ({
      refetch: () => {
        // 현재 isExpanded 상태를 저장
        const currentExpandedStates = new Map<string, boolean>();
        const saveExpandedStates = (rows: MyTreeGridRowType[]) => {
          rows.forEach((row) => {
            if (row.isExpanded !== undefined) {
              currentExpandedStates.set(row.rowKey, row.isExpanded);
            }
            if (row.children) {
              saveExpandedStates(row.children);
            }
          });
        };
        saveExpandedStates(treeData);
        expandedStatesRef.current = currentExpandedStates;

        // 데이터 다시 불러오기
        refetch();
      },
    }),
    [treeData, refetch]
  );

  useEffect(() => {
    if (data) {
      const treeData = convertBundleItemsToTreeGridRowType(null, data, RowAction);
      const expandedStates = expandedStatesRef.current;

      // 저장된 isExpanded 상태를 복원
      const restoreExpandedStates = (
        rows: MyTreeGridRowType[]
      ): MyTreeGridRowType[] => {
        return rows.map((row) => {
          const expandedState = expandedStates.get(row.rowKey);
          const updatedRow = {
            ...row,
            isExpanded:
              expandedState !== undefined ? expandedState : row.isExpanded,
          };

          if (row.children) {
            updatedRow.children = restoreExpandedStates(row.children);
          }

          return updatedRow;
        });
      };

      const restoredTreeData = restoreExpandedStates(treeData);
      const normalizedTreeData = stripPackageChildren(restoredTreeData);
      const keepEmptyFolders = !hasSearchWord;
      const finalTreeData = favoriteOnly
        ? [
          ...filterRows(normalizedTreeData, { activeOnly, favoriteOnly, keepEmptyFolders }),
          ...collectPromotedPackagesFromHiddenPackage(normalizedTreeData, {
            activeOnly,
            favoriteOnly,
          }),
        ]
        : activeOnly
          ? filterRows(normalizedTreeData, { activeOnly, favoriteOnly, keepEmptyFolders })
          : normalizedTreeData;
      setTreeData(finalTreeData);
    }
  }, [data, activeOnly, favoriteOnly, RowAction]);

  // 그리드에서 열림/접힘 토글 시 상태를 ref에 반영해, 이후 data 갱신(리페치 등) 시 복원되도록 함
  useEffect(() => {
    const map = new Map<string, boolean>();
    const saveExpanded = (rows: MyTreeGridRowType[]) => {
      rows.forEach((row) => {
        if (row.isExpanded !== undefined) {
          map.set(row.rowKey, row.isExpanded);
        }
        if (row.children?.length) saveExpanded(row.children);
      });
    };
    saveExpanded(treeData);
    expandedStatesRef.current = map;
  }, [treeData]);

  // treeData가 변경되고 shouldClearHighlights가 true일 때 하이라이트 제거
  useEffect(() => {
    if (shouldClearHighlights) {
      const timer = setTimeout(() => {
        const updatedData = updateAllRows(treeData, {
          isHighlight: false,
        });
        setTreeData(updatedData);
        setShouldClearHighlights(false);
      }, 500);

      return () => clearTimeout(timer);
    }
    return;
  }, [treeData, shouldClearHighlights]);

  const handleSearch = (value: string) => {
    if (onSearchWordChange) {
      onSearchWordChange(value);
      return;
    }
    setInternalSearchWord(value);
  };

  const handleClearSearch = () => {
    if (onSearchWordChange) {
      onSearchWordChange("");
      return;
    }
    setInternalSearchWord("");
  };

  const handleSelectedRowsChange = (
    selectedRows: MyTreeGridRowType[],
    _lastSelectedRow: MyTreeGridRowType | null
  ) => {
    if (selectedRows.length === 0) {
      setSelectedBundleId?.(0);
      setSelectedRow(null);
      return;
    }
    const selectedRow = selectedRows[selectedRows.length - 1];
    if (!selectedRow) return;
    if (selectedRow?.type === "package") {
      setSelectedBundleId?.(selectedRow.orgData.data?.id as number);
    }
    setSelectedRow(selectedRow);
  };

  const handleRowDoubleClick = (row: MyTreeGridRowType) => {
    onRowDoubleClick?.(row);
  };

  const handleDataChange = (newData: MyTreeGridRowType[]) => {
    setTreeData(newData);
  };

  // 오류 발생 시 데이터 다시 불러오기
  const handleError = (err: Error, operation: string) => {
    error(`${operation} 실패: ${err.message}`);
    // 데이터 다시 불러오기
    refetch();
  };

  const handleMoveNode = (
    movedData: MyTreeGridRowType[],
    dragInfo: MyTreeGridDragDropInfo
  ) => {
    const id = dragInfo.draggedRow.orgData.data.id;
    const newParentId = dragInfo.newParent?.orgData.data.id || null;
    const prevSortNumber =
      (dragInfo.beforeRow?.orgData.data.sortNumber as number) || 0;
    const nextSortNumber =
      (dragInfo.afterRow?.orgData.data.sortNumber as number) || 0;

    switch (dragInfo.draggedRow.type) {
      case "folder":
        {
          moveCategory(
            {
              id: id,
              parentId: newParentId,
              prevSortNumber: prevSortNumber,
              nextSortNumber: nextSortNumber,
            },
            {
              onSuccess: (data) => {
                const updatedData = changeRowData(
                  movedData,
                  dragInfo.draggedRow.rowKey,
                  {
                    type: "bundle-category",
                    data: data,
                  }
                );
                setTreeData(updatedData);
                invalidateBundleRelatedQueries();
                // bundle-detail에 변경사항 알림
                onBundleListChange?.();
              },
              onError: (err) => {
                handleError(err, "카테고리 이동");
              },
            }
          );
        }
        break;
      case "package":
        {
          const parentType = dragInfo.newParent
            ? dragInfo.newParent.type === "folder"
              ? "category"
              : "bundle"
            : "root";
          moveBundle(
            {
              id: id,
              parentType: parentType,
              parentId: newParentId,
              prevSortNumber: prevSortNumber,
              nextSortNumber: nextSortNumber,
            },
            {
              onSuccess: (data) => {
                const updatedData = changeRowData(
                  movedData,
                  dragInfo.draggedRow.rowKey,
                  {
                    type: "bundle",
                    data: data,
                  }
                );
                setTreeData(updatedData);
                invalidateBundleRelatedQueries();
                // bundle-detail에 변경사항 알림
                onBundleListChange?.();
              },
              onError: (err) => {
                handleError(err, "bundle 이동");
              },
            }
          );
        }
        break;
    }
  };

  const handleDataChangeItem = (
    headerKey: string,
    row: MyTreeGridRowType,
    value: string | number | boolean
  ) => {
    switch (headerKey) {
      case "name":
        changeBundle(row, "name", value as string);
        break;
      case "isActive":
        changeBundle(row, "isActive", value as boolean);
        break;
      default:
        break;
    }
  };

  const changeBundle = (
    row: MyTreeGridRowType,
    key: string,
    value: string | number | boolean
  ) => {
    const id = row.orgData.data.id;
    if (!id) return;

    const successAction = () => {
      const updatedData = updateRow(treeData, row.rowKey, {
        cells: row.cells.map((item) => {
          if (item.headerKey === key) {
            return { ...item, value };
          }
          return item;
        }),
      });
      setTreeData(updatedData);
      // bundle-detail에 변경사항 알림
      onBundleListChange?.();
    };

    const errorAction = (err: Error) => {
      handleError(err, "bundle 변경");
    };

    if (row.type === "folder") {
      updateCategory(
        {
          id: id,
          [key]: value,
        },
        {
          onSuccess: () => {
            successAction();
            invalidateBundleRelatedQueries();
          },
          onError: (err) => {
            errorAction(err);
          },
        }
      );
    } else if (row.type === "package") {
      upsertBundle(
        {
          id: id,
          [key]: value,
        },
        {
          onSuccess: () => {
            successAction();
            invalidateBundleRelatedQueries();
          },
          onError: (err) => {
            errorAction(err);
          },
        }
      );
    }
  };

  const afterAddNode = (parentRowKey: string | null, data: BundleItem) => {
    const newRow: MyTreeGridRowType | null = convertBundleItemToTreeGridRowType(
      parentRowKey,
      data,
      RowAction
    );
    if (!newRow) return;
    newRow.isHighlight = true;
    const updatedData = addRow(treeData, parentRowKey, newRow, true); // isTypeOrder = true
    setTreeData(updatedData);
    setShouldClearHighlights(true);

    if (treeRef.current) {
      const flatRows = flattenTree(updatedData);
      const newNodeIndex = flatRows.findIndex(
        (n) => n.rowKey === newRow.rowKey
      );
      if (newNodeIndex !== -1) {
        treeRef.current.scrollToRow(newNodeIndex + 1);
      }
    }
  };

  const handleAddCategory = (
    _header: MyTreeGridHeaderType,
    row: MyTreeGridRowType
  ) => {
    addCategory(row);
  };

  const addCategory = (parentRow: MyTreeGridRowType | null) => {
    const localNode = findRow(treeData, parentRow?.rowKey || "");
    if (localNode?.type === "package") {
      warning("묶음 하위에는 카테고리를 추가할 수 없습니다.");
      return;
    }
    const siblings = parentRow ? parentRow.children : treeData;
    const nodeTypeNodes = siblings
      ? siblings.filter((node) => node.type === "folder")
      : [];
    const newCategory: BundleCategoryInsert = {
      name: `${nodeTypeNodes.length + 1}. 새 카테고리`,
      parentId: parentRow ? (parentRow.orgData.data.id as number) : null,
    };

    createCategory(newCategory, {
      onSuccess: (data) => {
        afterAddNode(parentRow ? parentRow.rowKey : null, data);
        invalidateBundleRelatedQueries();
        // bundle-detail에 변경사항 알림
        onBundleListChange?.();
      },
      onError: (err) => {
        handleError(err, "카테고리 추가");
      },
    });
  };

  const handleAddBundle = (
    _header: MyTreeGridHeaderType,
    node: MyTreeGridRowType
  ) => {
    addBundle(node);
  };

  const getBundleCodeName = () => {
    const bundleRows = findRowsByType(treeData, "package");
    let codeName = `${bundleRows.length + 1}. 새 묶음`;
    const sameCodes = bundleRows.filter(
      (row) => row.orgData.data.code === codeName
    );
    if (sameCodes.length > 0) {
      codeName = `${codeName}-${sameCodes.length}`;
    }
    return codeName;
  };

  /** 조상 중 type이 package인 개수 (묶음 깊이). 0,1만 허용 = 이 값이 1 이상이면 하위에 묶음 추가 불가 */
  const getPackageDepth = (
    rows: MyTreeGridRowType[],
    rowKey: string
  ): number => {
    const { parent } = findParentRow(rows, rowKey);
    if (!parent) return 0;
    const parentPackageCount =
      parent.type === "package" ? 1 : 0;
    return parentPackageCount + getPackageDepth(rows, parent.rowKey);
  };

  const addBundle = (parentNode: MyTreeGridRowType | null) => {
    // 리스트에서는 묶음 하위에 묶음을 추가하지 않음
    if (parentNode?.type === "package") {
      warning("묶음 하위에는 묶음을 추가할 수 없습니다.");
      return;
    }

    const defaultCodeName = getBundleCodeName();

    const parentId = null;
    const categoryId =
      parentNode?.type === "folder"
        ? (parentNode.orgData.data.id as number)
        : null;

    const newBundle: Bundle = {
      code: defaultCodeName,
      name: defaultCodeName,
      parentId: parentId,
      categoryId: categoryId,
      isActive: true,
      priceType: BundlePriceType.단가합산,
      isShowBundleName: true,
      isVerbal: false,
      isClaim: true,
    };
    upsertBundle(newBundle, {
      onSuccess: (data) => {
        afterAddNode(parentNode ? parentNode.rowKey : null, data);
        invalidateBundleRelatedQueries();
        // bundle-detail에 변경사항 알림
        onBundleListChange?.();
      },
      onError: (err) => {
        handleError(err, "bundle 추가");
      },
    });
  };

  const handleModifyName = (
    _header: MyTreeGridHeaderType,
    row: MyTreeGridRowType
  ) => {
    if (row.type !== "folder" && row.type !== "package") return;
    treeRef.current?.startEditCell(row.rowKey, "name");
  };

  const handleDelete = (rows: MyTreeGridRowType[]) => {
    if (rows.length !== 1) {
      warning("한 개의 항목만 삭제할 수 있습니다.");
      return;
    }
    const deleteRow = rows[0];
    if (!deleteRow) return;

    const successAction = () => {
      // 서버 삭제 성공 시에만 UI에서 제거
      const updatedData = removeRow(treeData, deleteRow.rowKey);
      setTreeData(updatedData);

      const name = deleteRow.cells.find(
        (item: MyTreeGridRowCellType) => item.headerKey === "name"
      )?.value;
      success(`'${name}' 삭제되었습니다.`);
      // bundle-detail에 변경사항 알림
      onBundleListChange?.();
    };

    const errorAction = (err: Error) => {
      handleError(err, "삭제");
    };

    if (deleteRow.type === "folder") {
      deleteCategory(deleteRow.orgData.data.id as number, {
        onSuccess: () => {
          successAction();
          invalidateBundleRelatedQueries();
        },
        onError: (err) => {
          errorAction(err);
        },
      });
    } else if (deleteRow.type === "package") {
      deleteBundle(deleteRow.orgData.data.id as number, {
        onSuccess: () => {
          successAction();
          invalidateBundleRelatedQueries();
        },
        onError: (err) => {
          errorAction(err);
        },
      });
    }
  };

  const deleteSelectedRows = (
    _header: MyTreeGridHeaderType,
    row: MyTreeGridRowType,
    _selectedRows: MyTreeGridRowType[]
  ) => {
    handleDelete([row]);
  };

  const handleToggleFavorite = (
    _header: MyTreeGridHeaderType,
    row: MyTreeGridRowType,
    _selectedRows: MyTreeGridRowType[]
  ) => {
    if (row.type !== "package") return;
    const id = row.orgData?.data?.id as number | undefined;
    if (id == null) return;
    const nextFavorite = !row.orgData?.data?.isFavorite;
    toggleFavorite(
      { id, isFavorite: nextFavorite },
      {
        onSuccess: () => {
          const updatedData = updateRow(treeData, row.rowKey, {
            cells: row.cells.map((cell) => {
              if (cell.headerKey === "isFavorite") {
                return { ...cell, value: nextFavorite };
              }
              return cell;
            }),
            orgData: {
              ...row.orgData,
              data: { ...row.orgData.data, isFavorite: nextFavorite },
            },
          });
          setTreeData(updatedData);
          invalidateBundleRelatedQueries();
          onBundleListChange?.();
        },
        onError: (err) => {
          handleError(err, nextFavorite ? "즐겨찾기 설정" : "즐겨찾기 설정 해제");
        },
      }
    );
  };

  const contextMenuActions: ContextMenuAction[] = [
    {
      id: "toggleFavorite",
      getLabel: (
        _header: MyTreeGridHeaderType,
        row: MyTreeGridRowType
      ) =>
        row.orgData?.data?.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가",
      icon: <Star className="w-3 h-3" />,
      onClick: handleToggleFavorite,
      disabled: (
        _header: MyTreeGridHeaderType,
        row: MyTreeGridRowType,
        selectedRows: MyTreeGridRowType[]
      ) => {
        if (selectedRows.length !== 1) return true;
        return row.type !== "package";
      },
    },
    {
      id: "add",
      label: "카테고리 추가",
      icon: <Folder className="w-3 h-3" />,
      onClick: handleAddCategory,
      shortcuts: ["1"],
      disabled: (
        _header: MyTreeGridHeaderType,
        row: MyTreeGridRowType,
        selectedRows: MyTreeGridRowType[]
      ) => {
        if (selectedRows.length > 1) {
          return true;
        }
        return row.type === "package" || row.type === "item";
      },
    },
    {
      id: "addBundle",
      label: "묶음 추가",
      icon: <LineBundleIcon className="w-3 h-3" />,
      onClick: handleAddBundle,
      shortcuts: ["2"],
      // 묶음은 0, 1까지만 허용 (2단계). package 조상이 1명 이상이면 그 하위 추가 불가
      disabled: (
        _header: MyTreeGridHeaderType,
        row: MyTreeGridRowType,
        selectedRows: MyTreeGridRowType[]
      ) => {
        if (selectedRows.length > 1) {
          return true;
        }
        return row.type === "item" || row.type === "package";
      },
    },
    {
      id: "modifyName",
      label: "명칭 바꾸기",
      icon: <Pencil className="w-3 h-3" />,
      onClick: handleModifyName,
      shortcuts: ["F2"],
      disabled: (
        _header: MyTreeGridHeaderType,
        row: MyTreeGridRowType,
        selectedRows: MyTreeGridRowType[]
      ) => {
        if (selectedRows.length > 1) return true;
        return row.type !== "folder" && row.type !== "package";
      },
    },
    {
      id: "delete",
      label: "삭제",
      icon: <Trash className="w-3 h-3" />,
      onClick: deleteSelectedRows,
      shortcuts: ["delete"],
    },
  ].filter((action) => {
    if (!hideAddContextMenus) return true;
    return action.id !== "add" && action.id !== "addBundle";
  });

  useEffect(() => {
    saveHeaders(headersStorageKey, treeHeaders);
  }, [treeHeaders, headersStorageKey]);

  // 전체 열기 함수
  const toggleExpandAll = () => {
    const updatedData = updateAllRows(treeData, {
      isExpanded: !isExpandAll,
    });
    setTreeData(updatedData);
    setIsExpandAll(!isExpandAll);
  };

  const content = (
    <>
      {!hideTopControls && (
        <>
          <div className="text-base font-semibold whitespace-nowrap pt-1">
            {title}
          </div>
          <div className="flex flex-row w-full items-center gap-1 flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <MySearchInput
                value={resolvedSearchWord}
                onChange={(e) => handleSearch(e.target.value)}
                onClear={handleClearSearch}
              />
            </div>
            {selectedRow?.type !== "package" && (
              <MyButton
                onClick={() => {
                  addCategory(selectedRow);
                }}
              >
                카테고리 추가
              </MyButton>
            )}
            {selectedRow?.type !== "item" && selectedRow?.type !== "package" && (
              <MyButton
                onClick={() => {
                  addBundle(selectedRow);
                }}
              >
                묶음 추가
              </MyButton>
            )}
            <MyButton
              className="p-[4px]"
              onClick={toggleExpandAll}
              tooltip={isExpandAll ? "전체 접기" : "전체 열기"}
            >
              {isExpandAll ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </MyButton>
          </div>
        </>
      )}
      <div className={cn("flex-1 flex w-full h-full rounded-sm overflow-hidden", !hideGridHeader && "border border-[var(--border-1)]")}>
        {hasNoSearchResults ? (
          <div className="flex flex-1 items-center justify-center text-[var(--gray-400)] text-[12px] p-[4px]">
            검색결과가 없습니다.
          </div>
        ) : (
          <MyTreeGrid
            ref={treeRef}
            headers={treeHeaders}
            setHeaders={setTreeHeaders}
            data={treeData}
            onRowDoubleClick={handleRowDoubleClick}
            onDataChange={handleDataChange}
            onMoveNode={handleMoveNode}
            onSelectedRowsChange={handleSelectedRowsChange}
            onDataChangeItem={handleDataChangeItem}
            hideHeader={hideGridHeader}
            hideBorder={true}
            size="sm"
            allowDragDrop={true}
            autoExpandOnDrop={true}
            showContextMenu={true}
            contextMenuActions={contextMenuActions}
            isLoading={isLoading}
            multiSelect={false}
            isOutSideClickUnSelect={false}
            isTypeOrder={true}
            textEditTriggerMode="explicit"
            disablePackageChildrenDrop={true}
            searchKeyword={resolvedSearchWord}
          />
        )}
      </div>
    </>
  );

  if (hideContainerPadding) {
    return (
      <div className="flex flex-1 min-h-0 min-w-0 w-full h-full">
        {content}
      </div>
    );
  }

  return (
    <MasterDataContainer>
      <GridContainer className="gap-3">{content}</GridContainer>
    </MasterDataContainer>
  );
});

export default BundleList;
