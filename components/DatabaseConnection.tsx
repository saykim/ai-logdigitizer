import React, { useState, useEffect } from 'react';
import type { AnalysisResult, DatabaseConfig, DatabaseSchema, FormDataEntry } from '../types';

interface DatabaseConnectionProps {
  result: AnalysisResult;
}

export const DatabaseConnection: React.FC<DatabaseConnectionProps> = ({ result }) => {
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>({
    provider: 'supabase',
    apiUrl: '',
    apiKey: '',
    tableName: 'log_entries'
  });
  
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSchemaCreated, setIsSchemaCreated] = useState<boolean>(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  // 초기 폼 데이터 설정
  useEffect(() => {
    const initialData: Record<string, string> = {};
    result.data_schema.forEach(field => {
      initialData[field.name] = '';
    });
    setFormData(initialData);
  }, [result.data_schema]);

  const handleConfigChange = (key: keyof DatabaseConfig, value: string) => {
    setDbConfig(prev => ({ ...prev, [key]: value }));
    setConnectionStatus('disconnected');
  };

  const testConnection = async () => {
    if (!dbConfig.apiUrl || !dbConfig.apiKey) {
      setErrorMessage('API URL과 API Key를 입력해주세요.');
      return;
    }

    setConnectionStatus('connecting');
    setErrorMessage('');

    try {
      const response = await fetch('/api/database/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbConfig)
      });

      const data = await response.json();

      if (response.ok) {
        setConnectionStatus('connected');
        setIsSchemaCreated(data.schemaExists || false);
      } else {
        setConnectionStatus('error');
        setErrorMessage(data.error || '연결에 실패했습니다.');
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage('네트워크 오류가 발생했습니다.');
    }
  };

  const createSchema = async () => {
    try {
      const schema: DatabaseSchema = {
        tableName: dbConfig.tableName || 'log_entries',
        columns: [
          { name: 'id', type: 'uuid', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false },
          ...result.data_schema.map(field => ({
            name: field.name,
            type: getDbType(field.type),
            nullable: true
          }))
        ],
        primaryKey: 'id'
      };

      const response = await fetch('/api/database/create-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: dbConfig, schema })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSchemaCreated(true);
        setSaveMessage('데이터베이스 스키마가 성공적으로 생성되었습니다.');
      } else {
        setErrorMessage(data.error || '스키마 생성에 실패했습니다.');
      }
    } catch (error) {
      setErrorMessage('스키마 생성 중 오류가 발생했습니다.');
    }
  };

  const getDbType = (fieldType: string): string => {
    switch (fieldType) {
      case 'number': return 'numeric';
      case 'date': return 'date';
      case 'datetime': return 'timestamp';
      case 'boolean': return 'boolean';
      case 'textarea': return 'text';
      default: return 'varchar';
    }
  };

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const saveData = async () => {
    if (!isSchemaCreated) {
      setErrorMessage('먼저 데이터베이스 스키마를 생성해주세요.');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/database/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          config: dbConfig, 
          data: formData,
          schema: result.data_schema
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSaveMessage('데이터가 성공적으로 저장되었습니다!');
        // 폼 초기화
        const resetData: Record<string, string> = {};
        result.data_schema.forEach(field => {
          resetData[field.name] = '';
        });
        setFormData(resetData);
      } else {
        setErrorMessage(data.error || '데이터 저장에 실패했습니다.');
      }
    } catch (error) {
      setErrorMessage('데이터 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderConnectionStatus = () => {
    const statusConfig = {
      disconnected: { color: 'text-gray-500', bg: 'bg-gray-100', text: '연결 안됨' },
      connecting: { color: 'text-blue-600', bg: 'bg-blue-100', text: '연결 중...' },
      connected: { color: 'text-green-600', bg: 'bg-green-100', text: '연결됨' },
      error: { color: 'text-red-600', bg: 'bg-red-100', text: '연결 오류' }
    };

    const config = statusConfig[connectionStatus];
    
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color} ${config.bg}`}>
        <div className={`w-2 h-2 rounded-full mr-2 ${config.color.replace('text-', 'bg-')}`}></div>
        {config.text}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      <div className="p-4 xl:p-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-purple-500 rounded-md flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c0 2.21 1.79 4 4 4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z" />
            </svg>
          </div>
          <h3 className="font-medium text-sm xl:text-base text-gray-700">데이터베이스 연결</h3>
        </div>
        {renderConnectionStatus()}
      </div>
      
      <div className="p-6 md:p-8 xl:p-12 space-y-8">
        {/* DB 설정 섹션 */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">데이터베이스 설정</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase Project URL
              </label>
              <input
                type="url"
                value={dbConfig.apiUrl}
                onChange={(e) => handleConfigChange('apiUrl', e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase Anon Key
              </label>
              <input
                type="password"
                value={dbConfig.apiKey}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              테이블 이름
            </label>
            <input
              type="text"
              value={dbConfig.tableName}
              onChange={(e) => handleConfigChange('tableName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={testConnection}
            disabled={connectionStatus === 'connecting'}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {connectionStatus === 'connecting' ? '연결 테스트 중...' : '연결 테스트'}
          </button>
        </div>

        {/* 스키마 생성 섹션 */}
        {connectionStatus === 'connected' && (
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">데이터베이스 스키마</h4>
            
            {!isSchemaCreated ? (
              <div className="space-y-4">
                <p className="text-gray-600">분석된 필드들을 기반으로 데이터베이스 테이블을 생성합니다.</p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-2">생성될 필드들:</h5>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {result.data_schema.map((field, index) => (
                      <li key={index} className="flex justify-between">
                        <span>{field.name}</span>
                        <span className="text-gray-400">({getDbType(field.type)})</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <button
                  onClick={createSchema}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  스키마 생성
                </button>
              </div>
            ) : (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">스키마가 준비되었습니다!</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 데이터 입력 폼 */}
        {isSchemaCreated && (
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">데이터 입력</h4>
            
            <div className="space-y-4">
              {result.data_schema.map((field, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.name}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div>
              ))}
              
              <button
                onClick={saveData}
                disabled={isSaving}
                className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSaving ? '저장 중...' : '데이터 저장'}
              </button>
            </div>
          </div>
        )}

        {/* 메시지 표시 */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errorMessage}
          </div>
        )}
        
        {saveMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {saveMessage}
          </div>
        )}
      </div>
    </div>
  );
};
