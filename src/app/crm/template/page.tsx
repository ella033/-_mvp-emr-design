"use client";

import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tree, TreeNode, DragDropResult } from "@/components/ui/tree";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupItem } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";
import TemplateMessageForm from "../_components/message/template-message-form";
import { CrmMessageType, CrmMessageSubType } from "@/constants/crm-enums";
import type { MessageData } from "@/types/crm/message-template/message-types";
import { useUserMessageTemplateHierarchy } from "@/hooks/crm/use-user-message-template-hierarchy";
import { useGetTemplateById } from "@/hooks/crm/use-get-template-by-id";
import { useToastHelpers } from "@/components/ui/toast";
import { useCreateUserMessageTemplateFolder } from "@/hooks/crm/use-create-user-message-template-folder";
import { useUpdateUserMessageTemplateFolder } from "@/hooks/crm/use-update-user-message-template-folder";
import { useCreateUserMessageTemplate } from "@/hooks/crm/use-create-user-message-template";
import { useUpdateUserMessageTemplate } from "@/hooks/crm/use-update-user-message-template";
import { useDeleteUserMessageTemplateFolder } from "@/hooks/crm/use-delete-user-message-template-folder";
import { useDeleteUserMessageTemplate } from "@/hooks/crm/use-delete-user-message-template";
import { useMoveUserMessageTemplate } from "@/hooks/crm/use-move-user-message-template";
import { useMoveUserMessageFolder } from "@/hooks/crm/use-move-user-message-folder";
import { ContextMenu, ContextMenuItem } from "@/components/ui/context-menu";
import { FileService } from "@/services/file-service";
import type { FileUploadV2Uuid } from "@/types/file-types-v2";

// 버튼 그룹 데이터 정의
const buttonGroupItems: ButtonGroupItem[] = [
  { id: "sms", title: "문자" },
  { id: "talk", title: "알림톡" },
];

export default function CrmTemplatePage() {
  const toastHelpers = useToastHelpers();
  const queryClient = useQueryClient();
  const [activeButtonId, setActiveButtonId] = useState<string>("sms");
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<number>(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null
  );
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [contextMenuNode, setContextMenuNode] = useState<TreeNode | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<number | null>(null);
  const [isTemplatePanelVisible, setIsTemplatePanelVisible] =
    useState<boolean>(true);
  const [templateName, setTemplateName] = useState<string>("");

  const messageType = activeButtonId === "sms" ? 1 : 2;

  const { data, isLoading, error, refetch } =
    useUserMessageTemplateHierarchy(messageType);

  // 선택된 템플릿 정보 조회
  const { data: templateData } = useGetTemplateById(selectedTemplateId || 0);

  // 폴더 생성/수정 hooks
  const createFolder = useCreateUserMessageTemplateFolder({
    onSuccess: () => {
      toastHelpers.success("카테고리가 생성되었습니다.");
      refetch();
      queryClient.invalidateQueries({
        queryKey: ["crm-user-message-template-folders"],
      });
    },
    onError: () => {
      toastHelpers.error("카테고리 생성에 실패했습니다.");
    },
  });

  const updateFolder = useUpdateUserMessageTemplateFolder({
    onSuccess: () => {
      toastHelpers.success("카테고리가 수정되었습니다.");
      refetch();
      queryClient.invalidateQueries({
        queryKey: ["crm-user-message-template-folders"],
      });
    },
    onError: () => {
      toastHelpers.error("카테고리 수정에 실패했습니다.");
    },
  });

  // 템플릿 생성/수정 hooks
  const createTemplate = useCreateUserMessageTemplate({
    onSuccess: () => {
      toastHelpers.success("템플릿이 생성되었습니다.");
      refetch();
      queryClient.invalidateQueries({
        queryKey: ["crm-user-message-templates-by-folder"],
      });
      queryClient.invalidateQueries({
        queryKey: ["crm-user-message-template-folders"],
      });
    },
    onError: () => {
      toastHelpers.error("템플릿 생성에 실패했습니다.");
    },
  });

  const updateTemplate = useUpdateUserMessageTemplate({
    onSuccess: (data) => {
      toastHelpers.success("템플릿이 수정되었습니다.");
      refetch();
      queryClient.invalidateQueries({
        queryKey: ["crm-user-message-template", data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["crm-user-message-templates-by-folder"],
      });
    },
    onError: () => {
      toastHelpers.error("템플릿 수정에 실패했습니다.");
    },
  });

  // 템플릿/폴더 삭제 hooks
  const deleteFolder = useDeleteUserMessageTemplateFolder({
    onSuccess: () => {
      toastHelpers.success("카테고리가 삭제되었습니다.");
      refetch();
      setSelectedNodeId(0);
      setSelectedTemplateId(null);
      queryClient.invalidateQueries({
        queryKey: ["crm-user-message-template-folders"],
      });
      queryClient.invalidateQueries({
        queryKey: ["crm-user-message-templates-by-folder"],
      });
    },
    onError: () => {
      toastHelpers.error("카테고리 삭제에 실패했습니다.");
    },
  });

  const deleteTemplate = useDeleteUserMessageTemplate({
    onSuccess: () => {
      toastHelpers.success("템플릿이 삭제되었습니다.");
      refetch();
      setSelectedNodeId(0);
      setSelectedTemplateId(null);
      queryClient.invalidateQueries({
        queryKey: ["crm-user-message-templates-by-folder"],
      });
    },
    onError: () => {
      toastHelpers.error("템플릿 삭제에 실패했습니다.");
    },
  });

  // 템플릿/폴더 이동 hooks
  const moveTemplate = useMoveUserMessageTemplate({
    onSuccess: () => {
      toastHelpers.success("템플릿이 이동되었습니다.");
      refetch();
      queryClient.invalidateQueries({
        queryKey: ["crm-user-message-templates-by-folder"],
      });
    },
    onError: () => {
      toastHelpers.error("템플릿 이동에 실패했습니다.");
    },
  });

  const moveFolder = useMoveUserMessageFolder({
    onSuccess: () => {
      toastHelpers.success("카테고리가 이동되었습니다.");
      refetch();
      queryClient.invalidateQueries({
        queryKey: ["crm-user-message-template-folders"],
      });
      queryClient.invalidateQueries({
        queryKey: ["crm-user-message-templates-by-folder"],
      });
    },
    onError: () => {
      toastHelpers.error("카테고리 이동에 실패했습니다.");
    },
  });

  useEffect(() => {
    if (data) {
      setTreeData(data as TreeNode[]);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      toastHelpers.error("발송이 실패하였습니다.");
    }
  }, [error, toastHelpers]);

  // selectedNodeId가 변경될 때 패널 표시/숨김 처리
  useEffect(() => {
    if (!selectedNodeId) {
      setIsTemplatePanelVisible(false);
      setTemplateName(""); // 선택 해제 시 템플릿명 초기화
    } else if (selectedNodeId > 0) {
      // 임시 노드(음수 ID)가 아닌 경우에만 처리
      // 선택된 노드 찾기
      const node = findNodeById(treeData, selectedNodeId);
      if (node) {
        // 템플릿이면 패널 표시, 폴더면 패널 숨김
        setIsTemplatePanelVisible(!node.isFolder);
        if (node.isFolder) {
          setTemplateName(""); // 폴더 선택 시 템플릿명 초기화
        }
      }
    }
  }, [selectedNodeId, treeData]);

  const [messageData, setMessageData] = useState<MessageData>({
    messageType: CrmMessageType.문자,
    messageContent: "",
    messageSubType: CrmMessageSubType.SMS,
    isAdDisplayed: false,
  });

  // 취소 버튼 핸들러
  const handleCancel = () => {
    setSelectedNodeId(0);
    setSelectedTemplateId(null);
  };

  // 저장 버튼 핸들러
  const handleSave = async () => {
    if (!selectedTemplateId) {
      toastHelpers.error("저장할 템플릿이 선택되지 않았습니다.");
      return;
    }

    if (!templateName.trim()) {
      toastHelpers.error("템플릿명을 입력해주세요.");
      return;
    }

    let messageImageFileinfo: FileUploadV2Uuid[] = [];

    // 이미지 처리
    const hasImages = messageData.images && messageData.images.length > 0;
    const hasExistingFileInfo =
      messageData.messageImageFileinfo &&
      messageData.messageImageFileinfo.length > 0;

    // 이미지가 모두 삭제된 경우
    if (!hasImages && hasExistingFileInfo) {
      // messageImageFileinfo는 빈 배열로 유지 (이미지 삭제)
      messageImageFileinfo = [];
    }
    // 이미지가 있고, 개수가 변경된 경우 새로 업로드
    else if (
      hasImages &&
      (!hasExistingFileInfo ||
        messageData.images!.length !== messageData.messageImageFileinfo!.length)
    ) {
      try {
        const uploadPromises = messageData.images!.map((image) =>
          FileService.uploadFileV2({
            file: image.file,
            category: "message_attachment",
            entityType: "crm_message",
          })
        );

        const uploadResults = await Promise.all(uploadPromises);

        messageImageFileinfo = uploadResults.map((result) => ({
          id: result.id,
          uuid: result.uuid,
        }));
      } catch (error) {
        console.error("이미지 업로드 실패:", error);
        toastHelpers.error("첨부 이미지 등록이 실패하였습니다.");
        return;
      }
    }
    // 이미지가 변경되지 않은 경우 기존 정보 사용
    else if (hasExistingFileInfo) {
      messageImageFileinfo = messageData.messageImageFileinfo!;
    }

    // 템플릿 수정 API 호출
    updateTemplate.mutate({
      id: selectedTemplateId,
      data: {
        name: templateName,
        messageContent: messageData.messageContent,
        messageImageFileinfo,
        isAdDisplayed: messageData.isAdDisplayed,
        messageSubType: messageData.messageSubType,
      },
    });
  };

  const handleNodeToggle = (nodeId: number) => {
    const updateNodeExpansion = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, isExpanded: !node.isExpanded };
        }
        if (node.children) {
          return { ...node, children: updateNodeExpansion(node.children) };
        }
        return node;
      });
    };

    setTreeData(updateNodeExpansion(treeData));
  };

  const handleNodeSelect = (node: TreeNode) => {
    setSelectedNodeId(node.id);

    // 폴더인 경우 카테고리 ID로 설정
    if (node.isFolder) {
      setSelectedTemplateId(null); // 템플릿 선택 해제
    } else {
      // 템플릿인 경우 템플릿 ID 설정
      setSelectedTemplateId(node.id);
    }
  };

  const handleNodeContextMenu = (node: TreeNode, event: React.MouseEvent) => {
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setContextMenuNode(node);
  };

  const handleCloseContextMenu = () => {
    setContextMenuPosition(null);
    setContextMenuNode(null);
  };

  const handleStartRename = () => {
    if (contextMenuNode) {
      // 편집 모드로 전환 (더블클릭과 동일하게 동작)
      setEditingNodeId(contextMenuNode.id);
    }
  };

  const handleDelete = () => {
    if (!selectedNodeId) {
      return;
    }

    if (!window.confirm("삭제하시겠습니까?")) {
      return;
    }

    const node = findNodeById(treeData, selectedNodeId);
    if (!node) {
      toastHelpers.error("대상 노드를 찾을 수 없습니다.");
      return;
    }

    if (node.isFolder) {
      deleteFolder.mutate(selectedNodeId);
    } else {
      deleteTemplate.mutate(selectedNodeId);
    }
  };

  const handleAddTemplate = () => {
    // 카테고리가 선택되지 않은 경우
    if (!selectedNodeId) {
      toastHelpers.error("템플릿을 추가할 대상 카테고리를 선택하세요");
      return;
    }

    // 임시 ID 생성
    const tempId = -Date.now();

    // 새 템플릿 노드 생성
    const newTemplate: TreeNode = {
      id: tempId,
      name: "",
      isFolder: false,
    };

    // 트리 데이터 업데이트를 위한 재귀 함수
    const addTemplateToTree = (nodes: TreeNode[]): TreeNode[] => {
      // 현재 레벨에서 선택된 노드를 찾음
      const selectedNode = nodes.find((node) => node.id === selectedNodeId);

      if (selectedNode) {
        // 선택된 노드가 폴더인 경우: 해당 폴더의 children으로 추가
        if (selectedNode.isFolder) {
          return nodes.map((node) =>
            node.id === selectedNodeId
              ? {
                  ...node,
                  children: [...(node.children || []), newTemplate],
                }
              : node
          );
        }
        // 선택된 노드가 폴더가 아닌 경우: 동일한 레벨(부모의 children)에 형제로 추가
        else {
          return [...nodes, newTemplate];
        }
      }

      // 현재 레벨에 없으면 자식 노드에서 재귀적으로 탐색
      return nodes.map((node) => {
        if (node.children && node.children.length > 0) {
          const updatedChildren = addTemplateToTree(node.children);
          return { ...node, children: updatedChildren };
        }
        return node;
      });
    };

    // 트리 내부에 추가
    setTreeData(addTemplateToTree(treeData));

    // 편집 모드로 전환
    setEditingNodeId(tempId);

    // 새 노드 선택
    setSelectedNodeId(tempId);
  };

  const handleAddCategory = () => {
    // 임시 ID 생성
    const tempId = -Date.now();

    // 새 카테고리 노드 생성
    const newCategory: TreeNode = {
      id: tempId,
      name: "", // 빈 이름으로 시작
      isFolder: true,
      children: [],
      isExpanded: false,
    };

    // Tree 맨 하위에 추가
    setTreeData([...treeData, newCategory]);

    // 편집 모드로 전환
    setEditingNodeId(tempId);

    // 새 노드 선택
    setSelectedNodeId(tempId);
  };

  // 노드 데이터 찾기
  const findNodeById = (nodes: TreeNode[], id: number): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  // 트리에서 노드의 부모 폴더 찾기 헬퍼 함수
  const findParentFolder = (
    nodes: TreeNode[],
    targetId: number,
    parent: TreeNode | null = null
  ): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return parent;
      }
      if (node.children) {
        const found = findParentFolder(node.children, targetId, node);
        if (found !== undefined) {
          return found;
        }
      }
    }
    return undefined as any;
  };

  const handleNodeRenameComplete = (nodeId: number, newName: string) => {
    // 트리에서 노드 데이터 가져오기
    const node = findNodeById(treeData, nodeId);
    if (!node) {
      toastHelpers.error("대상 노드를 찾을 수 없습니다.");
      return;
    }

    // 임시 ID(음수)인 경우 새로운 항목 생성
    if (nodeId < 0) {
      if (node.isFolder) {
        // 새 폴더 생성
        createFolder.mutate(
          {
            messageType,
            name: newName,
          },
          {
            onSuccess: (response: any) => {
              // 생성된 폴더의 ID로 선택 유지
              if (response?.id) {
                setSelectedNodeId(response.id);
              }
            },
          }
        );
      } else {
        // 새 템플릿 생성
        // 부모 폴더 ID 찾기
        let parentId: number | undefined;

        // selectedNodeId가 폴더면 그것을 부모로 사용
        const selectedNode = findNodeById(treeData, selectedNodeId);
        if (selectedNode?.isFolder) {
          parentId = selectedNodeId;
        } else {
          // selectedNodeId가 템플릿이면 그 템플릿의 부모 폴더를 찾음
          const parent = findParentFolder(treeData, nodeId);
          parentId = parent?.id;
        }

        createTemplate.mutate(
          {
            messageType,
            name: newName,
            parentId,
            messageContent: "",
          },
          {
            onSuccess: (response: any) => {
              // 생성된 템플릿의 ID로 선택 유지
              if (response?.id) {
                setSelectedNodeId(response.id);
                setSelectedTemplateId(response.id);
              }
            },
          }
        );
      }
    } else {
      // 기존 항목 이름 변경
      if (node.isFolder) {
        // 폴더 이름 수정 - ID 유지
        updateFolder.mutate(
          {
            id: nodeId,
            data: { name: newName },
          },
          {
            onSuccess: () => {
              // 기존 선택 상태 유지 (nodeId는 변경되지 않음)
              setSelectedNodeId(nodeId);
            },
          }
        );
      } else {
        // 템플릿 이름 수정 - ID 유지
        updateTemplate.mutate(
          {
            id: nodeId,
            data: { name: newName },
          },
          {
            onSuccess: () => {
              // 기존 선택 상태 유지 (nodeId는 변경되지 않음)
              setSelectedNodeId(nodeId);
              setSelectedTemplateId(nodeId);
            },
          }
        );
      }
    }
  };

  const handleEditingNodeIdChange = (nodeId: number | null) => {
    // 편집 종료 시 임시 노드(음수 ID)가 빈 이름이면 제거
    if (editingNodeId !== null && editingNodeId < 0 && nodeId === null) {
      // 재귀적으로 노드 찾기
      const tempNode = findNodeById(treeData, editingNodeId);
      if (tempNode && !tempNode.name.trim()) {
        // 재귀적으로 빈 이름의 임시 노드 제거
        const removeNodeById = (
          nodes: TreeNode[],
          targetId: number
        ): TreeNode[] => {
          return nodes
            .filter((node) => node.id !== targetId)
            .map((node) => {
              if (node.children && node.children.length > 0) {
                return {
                  ...node,
                  children: removeNodeById(node.children, targetId),
                };
              }
              return node;
            });
        };
        setTreeData(removeNodeById(treeData, editingNodeId));
      }
    }
    setEditingNodeId(nodeId);
  };

  // 드래그 앤 드롭 핸들러
  const handleNodeDrop = (result: DragDropResult) => {
    const { draggedNode, targetNode, dropPosition } = result;

    // 폴더를 이동하는 경우
    if (draggedNode.isFolder) {
      // 폴더는 항상 루트 레벨에서만 이동 가능 (before/after만 가능)
      if (dropPosition === "before") {
        // targetNode 앞에 위치 - targetNode의 이전 폴더를 찾아야 함
        const rootFolders = treeData.filter((n) => n.isFolder);
        const targetIndex = rootFolders.findIndex(
          (n) => n.id === targetNode.id
        );
        const prevFolder =
          targetIndex > 0 ? rootFolders[targetIndex - 1] : null;

        moveFolder.mutate({
          folderId: draggedNode.id,
          data: {
            afterFolderId: prevFolder ? prevFolder.id : null,
          },
        });
      } else if (dropPosition === "after") {
        // targetNode 뒤에 위치
        moveFolder.mutate({
          folderId: draggedNode.id,
          data: {
            afterFolderId: targetNode.id,
          },
        });
      }
      // inside는 allowNestedFolders=false이므로 발생하지 않음
    } else {
      // 파일(템플릿)을 이동하는 경우
      if (targetNode.isFolder) {
        if (dropPosition === "inside") {
          // 폴더 안으로 이동 (맨 앞에 삽입)
          moveTemplate.mutate({
            id: draggedNode.id,
            data: {
              targetFolderId: targetNode.id,
              afterFileId: null, // 맨 앞
            },
          });
        } else if (dropPosition === "before" || dropPosition === "after") {
          // 폴더와 같은 레벨 (루트)로 이동 - 현재는 불가능하게 처리
          // 템플릿은 항상 폴더 안에 있어야 함
          toastHelpers.error("템플릿은 카테고리 내에서만 이동할 수 있습니다.");
        }
      } else {
        // 다른 파일 앞/뒤로 이동
        // targetNode의 부모 폴더 찾기
        const targetParent = findParentFolder(treeData, targetNode.id);
        if (!targetParent) {
          toastHelpers.error("대상 폴더를 찾을 수 없습니다.");
          return;
        }

        if (dropPosition === "before") {
          // targetNode 앞에 위치 - targetNode의 이전 파일을 찾아야 함
          const siblings = targetParent.children || [];
          const targetIndex = siblings.findIndex((n) => n.id === targetNode.id);
          const prevFile = targetIndex > 0 ? siblings[targetIndex - 1] : null;

          moveTemplate.mutate({
            id: draggedNode.id,
            data: {
              targetFolderId: targetParent.id,
              afterFileId: prevFile ? prevFile.id : null,
            },
          });
        } else if (dropPosition === "after") {
          // targetNode 뒤에 위치
          moveTemplate.mutate({
            id: draggedNode.id,
            data: {
              targetFolderId: targetParent.id,
              afterFileId: targetNode.id,
            },
          });
        }
      }
    }
  };

  const contextMenuItems: ContextMenuItem[] = [
    {
      id: "rename",
      label: "이름변경",
      onClick: handleStartRename,
    },
    {
      id: "delete",
      label: "삭제",
      onClick: handleDelete,
    },
  ];
  const handleButtonGroupChangeAction = (buttonId: string) => {
    setActiveButtonId(buttonId);
    setSelectedNodeId(0); // 버튼 그룹 변경 시 선택된 노드 초기화
  };

  return (
    <div className="flex w-full bg-[var(--bg-2)] gap-2" data-testid="crm-template-page">
      <div
        data-testid="crm-template-sidebar"
        className={cn(
          "flex flex-col items-start gap-2 self-stretch",
          "w-[28%] px-4 py-3",
          "bg-[var(--bg-main)]",
          "shadow-[0_0_4px_0_rgba(0,0,0,0.06)]"
        )}
      >
        {/* 상단 버튼 그룹 영역 */}
        <ButtonGroup
          buttons={buttonGroupItems}
          activeButtonId={activeButtonId}
          onButtonChangeAction={handleButtonGroupChangeAction}
          className="text-sm"
          testId="crm-template-message-type-tabs"
        />

        {/* 헤더 영역 */}
        <div className="mt-5 flex items-center justify-between w-full">
          <h1
            className={cn(
              "font-bold text-base",
              "text-[color:var(--gray-100)]"
            )}
          >
            템플릿
          </h1>
          <div className="flex gap-3">
            <button
              onClick={handleAddCategory}
              data-testid="crm-template-add-category-button"
              className={cn(
                "text-sm flex justify-center items-center gap-1 transition-colors cursor-pointer",
                "min-w-16 px-3 py-2 rounded",
                "border border-[var(--main-color)]",
                "bg-[var(--bg-main)] text-[color:var(--main-color)]"
              )}
            >
              카테고리 추가
            </button>
            <button
              onClick={handleAddTemplate}
              disabled={!selectedNodeId}
              data-testid="crm-template-add-template-button"
              className={cn(
                "text-sm flex justify-center items-center gap-1 transition-colors",
                "min-w-16 px-3 py-2 rounded",
                selectedNodeId
                  ? "bg-[var(--main-color)] text-[color:var(--bg-main)] cursor-pointer"
                  : "bg-[var(--gray-700)] text-[var(--gray-500)]"
              )}
            >
              템플릿 추가
            </button>
          </div>
        </div>

        {/* 트리 영역 */}
        <div className="w-full p-1 border border-[var(--border-1)] rounded-md" data-testid="crm-template-tree">
          {isLoading ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="text-sm text-[var(--gray-400)]">로딩 중...</div>
            </div>
          ) : (
            <Tree
              data={treeData}
              editable={true}
              draggable={true}
              allowNestedFolders={false}
              onNodeToggle={handleNodeToggle}
              onNodeSelect={handleNodeSelect}
              selectedNodeId={selectedNodeId}
              onNodeContextMenu={handleNodeContextMenu}
              editingNodeId={editingNodeId}
              onEditingNodeIdChange={handleEditingNodeIdChange}
              onNodeRename={handleNodeRenameComplete}
              onNodeDrop={handleNodeDrop}
              emptyContent={
                <div className="min-h-[400px] flex items-center justify-center">
                  <div className="text-center text-sm text-[var(--gray-400)]">
                    등록된 템플릿이 없습니다.
                    <br />
                    카테고리 추가 후 템플릿을 추가해주세요.
                  </div>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* (우측) 메시지 패널 */}
      {isTemplatePanelVisible && (
        <div className="w-[47%] py-2 pr-2 h-full" data-testid="crm-template-editor-panel">
          <div className="bg-white border border-[var(--border-1)] rounded-md h-full flex flex-col">
            {/* 메시지 폼 영역 */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <TemplateMessageForm
                messageData={messageData}
                onMessageDataChange={setMessageData}
                templateData={templateData}
                templateName={templateName}
                onTemplateNameChange={setTemplateName}
                onDelete={() => {
                  if (selectedTemplateId) {
                    deleteTemplate.mutate(selectedTemplateId);
                  }
                }}
              />
            </div>
            {/* 하단 버튼 */}
            <div className="p-4 flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                data-testid="crm-template-cancel-button"
                className="w-20 border border-[var(--border-1)]"
                onClick={handleCancel}
              >
                취소
              </Button>
              <Button
                data-testid="crm-template-save-button"
                className="flex-1 bg-[var(--main-color)] hover:bg-[var(--main-color-hover)]"
                onClick={handleSave}
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 컨텍스트 메뉴 */}
      <ContextMenu
        items={contextMenuItems}
        position={contextMenuPosition}
        onCloseAction={handleCloseContextMenu}
      />
    </div>
  );
}
