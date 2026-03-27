import { Editor, Extension, Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import tippy from "tippy.js";
import { CommandList } from "./command-list";
import type { TemplateCode } from "@/types/template-code-types";
import { TemplateCodeType } from "@/constants/common/common-enum";
import {stripHtmlTags, filterAndSortTemplates } from "@/utils/template-code-utils";

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

interface CommandProps {
  editor: Editor;
  range: Range;
}

export interface SlashCommandOptions {
  getTemplateCodes: () => TemplateCode[];
  templateCodeType: TemplateCodeType;
}

export type CommandItem = {
  isQuickMenu: boolean;
  title: string;
  content: string;
  command: ({ editor, range }: CommandProps) => void;
};

const getCommandItems = (
  templateCodes: TemplateCode[],
  templateCodeType: TemplateCodeType
): CommandItem[] => {
  const filteredTemplates = filterAndSortTemplates(templateCodes, templateCodeType);

  return filteredTemplates.map((template) => ({
    isQuickMenu: template.isQuickMenu,
    title: template.code,
    content: stripHtmlTags(template.content),
    command: ({ editor, range }: CommandProps) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent(template.content)
        .run();
    },
  }));
};

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: "slash-command",

  addOptions() {
    return {
      getTemplateCodes: () => [],
      templateCodeType: TemplateCodeType.전체,
    };
  },

  addProseMirrorPlugins() {
    const { getTemplateCodes, templateCodeType } = this.options;

    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        startOfLine: false,
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
        items: ({ query }) => {
          // 함수를 호출하여 최신 templateCodes를 가져옴
          const templateCodes = getTemplateCodes();
          const items = getCommandItems(templateCodes, templateCodeType).filter(
            (item) => item.title.toLowerCase().includes(query.toLowerCase())
          );
          return items;
        },
        render: () => {
          let component: ReactRenderer;
          let popup: any;

          return {
            onStart: (props) => {
              // popup을 닫는 함수를 CommandList에 전달
              const closePopup = () => {
                if (popup && popup[0]) {
                  popup[0].hide();
                }
              };

              component = new ReactRenderer(CommandList, {
                props: {
                  ...props,
                  onClose: closePopup,
                },
                editor: props.editor,
              });

              const doc = getEditorDocument(props.editor);
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
              if (component) {
                component.updateProps(props);
              }

              if (popup && popup[0]) {
                popup[0].setProps({
                  getReferenceClientRect: () =>
                    props.clientRect?.() ?? new DOMRect(),
                });
              }
            },

            onKeyDown(props) {
              if (props.event.key === "Escape") {
                if (popup && popup[0]) {
                  popup[0].hide();
                }
                return true;
              }
              return (component?.ref as any)?.onKeyDown(props);
            },

            onExit() {
              if (popup && popup[0]) {
                popup[0].destroy();
              }
              if (component) {
                component.destroy();
              }
            },
          };
        },
      }),
    ];
  },
});
