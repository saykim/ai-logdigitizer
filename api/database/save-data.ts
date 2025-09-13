import { createClient } from '@supabase/supabase-js';
import type { DatabaseConfig, DataSchemaItem } from '../../types';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { config, data, schema }: { 
      config: DatabaseConfig; 
      data: Record<string, string>; 
      schema: DataSchemaItem[] 
    } = req.body;

    if (!config.apiUrl || !config.apiKey) {
      return res.status(400).json({ error: 'API URL과 API Key가 필요합니다.' });
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(config.apiUrl, config.apiKey);

    // 데이터 타입 변환
    const processedData: Record<string, any> = {};
    
    for (const field of schema) {
      const value = data[field.name];
      
      if (value === undefined || value === null || value === '') {
        processedData[field.name] = null;
        continue;
      }

      switch (field.type) {
        case 'number':
          processedData[field.name] = parseFloat(value);
          break;
        case 'boolean':
          processedData[field.name] = value === 'true' || value === '1';
          break;
        case 'date':
        case 'datetime':
          processedData[field.name] = new Date(value).toISOString();
          break;
        default:
          processedData[field.name] = value;
      }
    }

    // 자동으로 추가되는 필드들은 제외 (id, created_at는 데이터베이스에서 자동 생성)
    const tableName = config.tableName || 'log_entries';

    const { data: insertedData, error } = await supabase
      .from(tableName)
      .insert(processedData)
      .select();

    if (error) {
      console.error('Insert error:', error);
      return res.status(400).json({ 
        error: '데이터 저장에 실패했습니다: ' + error.message 
      });
    }

    return res.status(200).json({
      success: true,
      message: '데이터가 성공적으로 저장되었습니다.',
      data: insertedData
    });

  } catch (error) {
    console.error('Data save error:', error);
    return res.status(500).json({ 
      error: '데이터 저장 중 오류가 발생했습니다: ' + (error as Error).message 
    });
  }
}
