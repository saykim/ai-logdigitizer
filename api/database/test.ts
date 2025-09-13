import { createClient } from '@supabase/supabase-js';
import type { DatabaseConfig } from '../../types';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const config: DatabaseConfig = req.body;

    if (!config.apiUrl || !config.apiKey) {
      return res.status(400).json({ error: 'API URL과 API Key가 필요합니다.' });
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(config.apiUrl, config.apiKey);

    // 연결 테스트 - 간단한 쿼리 실행
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (error) {
      console.error('Supabase connection error:', error);
      return res.status(400).json({ 
        error: '데이터베이스 연결에 실패했습니다: ' + error.message 
      });
    }

    // 테이블 존재 여부 확인
    const tableName = config.tableName || 'log_entries';
    const { data: tableExists } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', tableName)
      .single();

    return res.status(200).json({
      success: true,
      message: '데이터베이스 연결이 성공했습니다.',
      schemaExists: !!tableExists
    });

  } catch (error) {
    console.error('Database test error:', error);
    return res.status(500).json({ 
      error: '서버 오류가 발생했습니다: ' + (error as Error).message 
    });
  }
}
