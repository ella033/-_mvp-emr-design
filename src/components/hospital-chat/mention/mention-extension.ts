import { Node, mergeAttributes } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import tippy from "tippy.js";
import { MentionList } from "./mention-list";
import { HospitalChatsService } from "@/services/hospital-chats-service";
import type { MentionPatientResult } from "@/types/hospital-chat-types";

/**
 * 에디터가 속한 document를 반환 (PiP 윈도우 대응)
 */
function getEditorDocument(editor: any): Document {
  try {
    return editor.view.dom.ownerDocument ?? document;
  } catch {
    return document;
  }
}

export const PatientMention = Node.create({
  name: "patientMention",
  group: "inline",
  inline: true,
  selectable: false,
  atom: true,

  addAttributes() {
    return {
      patientId: { default: null },
      patientName: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="patient-mention"]',
        getAttrs: (el) => {
          const dom = el as HTMLElement;
          return {
            patientId: Number(dom.dataset.patientId),
            patientName:
              dom.dataset.patientName ||
              dom.textContent?.replace("@", ""),
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": "patient-mention",
        "data-patient-id": node.attrs.patientId,
        "data-patient-name": node.attrs.patientName,
        class: "patient-mention",
      }),
      `@${node.attrs.patientName}`,
    ];
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        pluginKey: new PluginKey("patientMentionSuggestion"),
        editor: this.editor,
        char: "@",
        startOfLine: false,
        command: ({ editor, range, props }) => {
          const item = props as MentionPatientResult;
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: "patientMention",
              attrs: {
                patientId: item.patientId,
                patientName: item.patientName,
              },
            })
            .insertContent(" ")
            .run();
        },
        items: async ({ query }) => {
          if (!query || query.length < 1) return [];
          try {
            return await HospitalChatsService.searchMentionPatients(query);
          } catch {
            return [];
          }
        },
        render: () => {
          let component: ReactRenderer;
          let popup: any;

          return {
            onStart: (props) => {
              // 에디터가 속한 document (PiP 윈도우일 수 있음)
              const doc = getEditorDocument(props.editor);

              component = new ReactRenderer(MentionList, {
                props,
                editor: props.editor,
              });

              popup = tippy(doc.body, {
                getReferenceClientRect: () =>
                  props.clientRect?.() ?? new DOMRect(),
                appendTo: () => doc.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              });
            },

            onUpdate(props) {
              component?.updateProps(props);
              if (popup?.[0]) {
                popup[0].setProps({
                  getReferenceClientRect: () =>
                    props.clientRect?.() ?? new DOMRect(),
                });
              }
            },

            onKeyDown(props) {
              if (props.event.key === "Escape") {
                popup?.[0]?.hide();
                return true;
              }
              return (component?.ref as any)?.onKeyDown(props);
            },

            onExit() {
              popup?.[0]?.destroy();
              component?.destroy();
            },
          };
        },
      }),
    ];
  },
});
