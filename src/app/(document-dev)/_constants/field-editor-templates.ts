export enum FieldEditorTemplateId {
  Opinion = 'opinion',
}

export const FIELD_EDITOR_DEFAULT_TEMPLATE_ID = FieldEditorTemplateId.Opinion;

export const FIELD_EDITOR_TEMPLATES = {
  [FieldEditorTemplateId.Opinion]: {
    id: FieldEditorTemplateId.Opinion,
    name: '소견서',
    // Figma 노드 20749:19338 (image 17)
    imageUrl: 'https://www.figma.com/api/mcp/asset/dedfee65-d78b-49c8-a313-c5a82a47dbc2',
  },
} as const;


