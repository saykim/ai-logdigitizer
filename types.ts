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

// DB 연결 관련 타입들
export interface DatabaseConfig {
  provider: 'supabase' | 'mysql' | 'postgresql';
  connectionString?: string;
  apiUrl?: string;
  apiKey?: string;
  tableName?: string;
}

export interface DatabaseConnection {
  id: string;
  name: string;
  config: DatabaseConfig;
  isConnected: boolean;
  createdAt: Date;
}

export interface DatabaseSchema {
  tableName: string;
  columns: DatabaseColumn[];
  primaryKey?: string;
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
}

export interface FormDataEntry {
  fieldName: string;
  value: string | number | boolean;
  timestamp: Date;
}

export type ViewType = 'json' | 'markdown' | 'html' | 'database';