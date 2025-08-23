export interface DataSchemaItem {
  name: string;
  type: string;
  value?: string;
}

export interface AnalysisResult {
  data_schema: DataSchemaItem[];
  markdown_template: string;
  html_template: string;
}

export type ViewType = 'json' | 'markdown' | 'html';