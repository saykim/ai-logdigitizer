import { createClient } from '@supabase/supabase-js';
import type { DatabaseConfig, DatabaseSchema } from '../../types';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { config, schema }: { config: DatabaseConfig; schema: DatabaseSchema } = req.body;

    if (!config.apiUrl || !config.apiKey) {
      return res.status(400).json({ error: 'API URL과 API Key가 필요합니다.' });
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(config.apiUrl, config.apiKey);

    // SQL 생성
    const columnDefinitions = schema.columns.map(col => {
      let sqlType = '';
      
      switch (col.type) {
        case 'uuid':
          sqlType = 'uuid default gen_random_uuid()';
          break;
        case 'timestamp':
          sqlType = 'timestamp with time zone default now()';
          break;
        case 'numeric':
          sqlType = 'numeric';
          break;
        case 'date':
          sqlType = 'date';
          break;
        case 'boolean':
          sqlType = 'boolean';
          break;
        case 'text':
          sqlType = 'text';
          break;
        case 'varchar':
        default:
          sqlType = 'varchar(255)';
          break;
      }

      const nullable = col.nullable ? '' : ' not null';
      return `${col.name} ${sqlType}${nullable}`;
    }).join(',\n  ');

    const primaryKeyClause = schema.primaryKey ? `,\n  primary key (${schema.primaryKey})` : '';

    const createTableSQL = `
      create table if not exists ${schema.tableName} (
        ${columnDefinitions}${primaryKeyClause}
      );
    `;

    console.log('Creating table with SQL:', createTableSQL);

    // RPC를 사용해서 SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    });

    if (error) {
      // RPC가 없는 경우 대체 방법 시도
      console.log('RPC failed, trying alternative method:', error);
      
      // 간단한 insert 테스트로 테이블 생성 여부 확인
      const testInsert = await supabase
        .from(schema.tableName)
        .insert({})
        .select();

      if (testInsert.error && testInsert.error.code === '42P01') {
        return res.status(400).json({ 
          error: '테이블 생성 권한이 없거나 RPC 함수가 설정되지 않았습니다. Supabase 콘솔에서 수동으로 테이블을 생성해주세요.' 
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: '데이터베이스 스키마가 성공적으로 생성되었습니다.',
      sql: createTableSQL
    });

  } catch (error) {
    console.error('Schema creation error:', error);
    return res.status(500).json({ 
      error: '스키마 생성 중 오류가 발생했습니다: ' + (error as Error).message 
    });
  }
}
