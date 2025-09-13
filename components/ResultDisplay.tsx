
import React, { useState } from 'react';
import type { AnalysisResult, ViewType } from '../types';
import { DatabaseConnection } from './DatabaseConnection';

interface ResultDisplayProps {
  result: AnalysisResult;
}

const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 xl:px-8 xl:py-4 text-sm xl:text-base font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
        isActive
          ? 'bg-blue-500 text-white shadow-md'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
};

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);


export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const [activeView, setActiveView] = useState<ViewType>('html');

  const handleDownloadHtml = () => {
    const blob = new Blob([result.html_template], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'log-template.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'json':
        return (
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <div className="p-4 xl:p-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-medium text-sm xl:text-base text-gray-700">JSON 스키마</h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(result.data_schema, null, 2));
                }}
                className="px-4 py-2 xl:px-6 xl:py-3 text-xs xl:text-sm font-medium rounded-xl transition-all duration-200 bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm"
              >
                복사
              </button>
            </div>
            <div className="p-6 md:p-8 xl:p-12 bg-white">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm xl:text-base text-gray-800 font-mono leading-relaxed bg-gray-50 p-4 xl:p-6 rounded-lg border overflow-x-auto">
                  {JSON.stringify(result.data_schema, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        );
      case 'markdown':
        return (
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <div className="p-4 xl:p-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-medium text-sm xl:text-base text-gray-700">마크다운 템플릿</h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.markdown_template);
                }}
                className="px-4 py-2 xl:px-6 xl:py-3 text-xs xl:text-sm font-medium rounded-xl transition-all duration-200 bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm"
              >
                복사
              </button>
            </div>
            <div className="p-6 md:p-8 xl:p-12 bg-white">
              <div className="bg-gray-50 rounded-lg border p-6 xl:p-8">
                <div 
                  className="markdown-content text-sm xl:text-base text-gray-800 leading-7 font-mono"
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
                  }}
                >
                  {result.markdown_template.split('\n').map((line, index) => {
                    // 제목 처리
                    if (line.startsWith('# ')) {
                      return <h1 key={index} className="text-xl xl:text-2xl font-bold text-gray-900 mb-3 mt-4 first:mt-0">{line.substring(2)}</h1>;
                    }
                    if (line.startsWith('## ')) {
                      return <h2 key={index} className="text-lg xl:text-xl font-semibold text-gray-800 mb-2 mt-3">{line.substring(3)}</h2>;
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={index} className="text-base xl:text-lg font-medium text-gray-700 mb-2 mt-2">{line.substring(4)}</h3>;
                    }
                    
                    // 구분선 처리
                    if (line.startsWith('---')) {
                      return <hr key={index} className="border-gray-300 my-4" />;
                    }
                    
                    // 테이블 헤더 처리
                    if (line.includes('|') && line.includes(':----')) {
                      return <div key={index} className="border-b border-gray-300 my-2"></div>;
                    }
                    
                    // 테이블 행 처리
                    if (line.includes('|') && !line.startsWith('<!--')) {
                      const cells = line.split('|').filter(cell => cell.trim() !== '');
                      return (
                        <div key={index} className="flex border-b border-gray-200 py-2">
                          {cells.map((cell, cellIndex) => (
                            <div key={cellIndex} className="flex-1 px-2 text-center">
                              <span className="text-gray-700">{cell.trim()}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    
                    // HTML 주석 처리
                    if (line.startsWith('<!--')) {
                      return <div key={index} className="text-gray-500 italic text-xs mb-2">{line}</div>;
                    }
                    
                    // 일반 텍스트 처리
                    if (line.trim() === '') {
                      return <div key={index} className="h-2"></div>;
                    }
                    
                    return <div key={index} className="mb-1">{line}</div>;
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      case 'html':
        return (
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
             <div className="p-4 xl:p-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <h3 className="font-medium text-sm xl:text-base text-gray-700">HTML 템플릿</h3>
                </div>
                <button
                  onClick={handleDownloadHtml}
                  className="flex items-center space-x-2 px-4 py-2 xl:px-6 xl:py-3 text-xs xl:text-sm font-medium rounded-xl transition-all duration-200 bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm"
                >
                    <DownloadIcon />
                    <span>다운로드</span>
                </button>
            </div>
            <div className="p-6 md:p-8 xl:p-12 bg-white">
                 <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <iframe
                      srcDoc={result.html_template}
                      className="w-full min-h-[600px] xl:min-h-[800px] border-0 bg-white"
                      sandbox="allow-same-origin allow-scripts"
                      title="HTML Template Preview"
                      style={{
                        colorScheme: 'light'
                      }}
                    />
                 </div>
            </div>
          </div>
        );
      case 'database':
        return <DatabaseConnection result={result} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-3 xl:gap-4 mb-6 xl:mb-8">
        <TabButton label="HTML 템플릿" isActive={activeView === 'html'} onClick={() => setActiveView('html')} />
        <TabButton label="JSON 스키마" isActive={activeView === 'json'} onClick={() => setActiveView('json')} />
        <TabButton label="마크다운 템플릿" isActive={activeView === 'markdown'} onClick={() => setActiveView('markdown')} />
        <TabButton label="DB 연결" isActive={activeView === 'database'} onClick={() => setActiveView('database')} />
      </div>
      <div className="animate-fade-in">{renderContent()}</div>
    </div>
  );
};