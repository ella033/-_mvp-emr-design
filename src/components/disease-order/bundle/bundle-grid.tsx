import type { MyTreeGridRef } from "@/components/yjg/my-tree-grid/my-tree-grid";
import type {
  MyTreeGridHeaderType,
  MyTreeGridRowType,
} from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import type { BundleRelation } from "@/types/master-data/bundle/bundle-type";
import MyTreeGrid from "@/components/yjg/my-tree-grid/my-tree-grid";
import {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  useCallback,
} from "react";
import {
  convertBundleLibraryToMyTreeGridType,
  convertBundleRelationToMyTreeGridType,
} from "./bundle-grid-converter";
import {
  defaultBundleGridHeaders,
  LS_BUNDLE_GRID_HEADERS_KEY,
} from "./bundle-grid-header";
import {
  getInitialHeaders,
  removeRows,
  saveHeaders,
  updateAllRows,
} from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { Trash, Trash2 } from "lucide-react";
import PrescriptionLibrarySearch from "@/components/library/prescription-library-search";

const BUNDLE_GRID_SIZE = "sm";

export interface BundleGridRef {
  getTreeData: () => MyTreeGridRowType[];
  setTreeData: (data: MyTreeGridRowType[]) => void;
}

export interface BundleGridProps {
  data: BundleRelation[];
}

export const BundleGrid = forwardRef<BundleGridRef, BundleGridProps>(
  ({ data }, ref) => {
    const [gridHeaders, setGridHeaders] = useState<MyTreeGridHeaderType[]>(
      getInitialHeaders(LS_BUNDLE_GRID_HEADERS_KEY, defaultBundleGridHeaders)
    );
    const [treeData, setTreeData] = useState<MyTreeGridRowType[]>([]);
    const [shouldClearHighlights, setShouldClearHighlights] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const treeRef = useRef<MyTreeGridRef>(null);
    const actionRowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const newTreeData = convertBundleRelationToMyTreeGridType(
        BUNDLE_GRID_SIZE,
        data
      );
      setTreeData(newTreeData || []);
    }, [data, convertBundleRelationToMyTreeGridType]);

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

    const handleDataChange = (data: MyTreeGridRowType[]) => {
      setTreeData(data);
    };

    const addBundle = (bundle: MyTreeGridRowType | null) => {
      if (!bundle) return;
      bundle.isHighlight = true;
      setTreeData((prevTreeData) => [...prevTreeData, bundle]);
      setShouldClearHighlights(true);
    };

    const removeBundle = (bundles: MyTreeGridRowType[]) => {
      const rowKeys = Array.from(bundles).map((n) => n.rowKey);
      const updatedData = removeRows(treeData, rowKeys);
      setTreeData(updatedData);
    };

    const handleAddLibrary = useCallback(
      (bundleLibrary: any) => {
        addBundle(
          convertBundleLibraryToMyTreeGridType(BUNDLE_GRID_SIZE, bundleLibrary)
        );
      },
      [convertBundleLibraryToMyTreeGridType]
    );

    useImperativeHandle(
      ref,
      () => ({
        getTreeData: () => {
          return treeData;
        },
        setTreeData: (data: MyTreeGridRowType[]) => {
          setShouldClearHighlights(true);
          setTreeData(data);
        },
      }),
      [treeData]
    );

    const deleteSelectedRows = (
      _header: MyTreeGridHeaderType,
      _row: MyTreeGridRowType,
      selectedRows: MyTreeGridRowType[]
    ) => {
      removeBundle(selectedRows);
    };

    const deleteAllRows = () => {
      setTreeData([]);
    };

    const contextMenuActions = [
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
      },
    ];

    useEffect(() => {
      saveHeaders(LS_BUNDLE_GRID_HEADERS_KEY, gridHeaders);
    }, [gridHeaders]);

    useEffect(() => {
      if (treeData.length > 0) {
        setTimeout(() => {
          treeRef.current?.scrollToBottom();
        }, 0);
      }
    }, [treeData]);

    return (
      <div className="flex flex-col w-full h-full gap-2">
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
            headers={gridHeaders}
            setHeaders={setGridHeaders}
            settingButtonOptions={{
              title: "묶음 컬럼 설정",
              defaultHeaders: defaultBundleGridHeaders,
            }}
            data={treeData}
            onDataChange={handleDataChange}
            allowDragDrop={true}
            autoExpandOnDrop={true}
            multiSelect={true}
            showContextMenu={true}
            contextMenuActions={contextMenuActions}
            hideBorder={true}
            size={BUNDLE_GRID_SIZE}
            actionRow={
              <div
                ref={actionRowRef}
                className="flex flex-row w-full p-[1px] my-[1px]"
              >
                <PrescriptionLibrarySearch
                  actionRowRef={actionRowRef}
                  onAddLibrary={handleAddLibrary}
                  placeholder="묶음 검색"
                  hideMagnifyingGlass={true}
                  showBundle={true}
                />
              </div>
            }
          />
        </div>
      </div>
    );
  }
);

BundleGrid.displayName = "BundleGrid";

export default BundleGrid;
