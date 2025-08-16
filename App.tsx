
import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultDisplay } from './components/ResultDisplay';
import { Spinner } from './components/Spinner';
import { analyzeDocument } from './services/geminiService';
import type { AnalysisResult } from './types';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedModel, setSelectedModel] = useState<'gemini-2.5-flash' | 'gemini-2.5-pro'>('gemini-2.5-flash');

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setAnalysisResult(null);
    setError(null);
  };

  const handleAnalyze = useCallback(async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64String = (reader.result as string).split(',')[1];
          const result = await analyzeDocument({
            mimeType: file.type,
            data: base64String,
          }, { model: selectedModel });
          setAnalysisResult(result);
        } catch (err) {
            if (err instanceof Error) {
                 setError(`Analysis failed: ${err.message}`);
            } else {
                 setError('An unknown error occurred during analysis.');
            }
        } finally {
             setIsLoading(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
        setIsLoading(false);
      };
    } catch (err) {
       if (err instanceof Error) {
            setError(`An unexpected error occurred: ${err.message}`);
       } else {
            setError('An unknown error occurred.');
       }
      setIsLoading(false);
    }
  }, [file, selectedModel]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <header className="text-center mb-16">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 via-blue-600 to-gray-800 mb-6 tracking-tight flex items-center justify-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mr-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            AI Log Digitizer
          </h1>
          
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto mb-6 rounded-full"></div>
          
          <p className="text-xl text-gray-600 font-medium max-w-3xl mx-auto leading-relaxed">
            Instantly convert manufacturing logs into structured data and reusable templates.
          </p>
          
          <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>PDF 지원</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>이미지 지원</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>실시간 분석</span>
            </div>
          </div>
        </header>

        <main className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12">
          {/* 처리 모드 선택 */}
          <div className="mb-6 flex items-center justify-between bg-gray-50 p-4 rounded-xl">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-medium text-gray-700">처리 모드</span>
            </div>
            
            <div className="flex bg-white rounded-lg p-1 border border-gray-200">
              <label className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${selectedModel === 'gemini-2.5-flash' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
                <input
                  type="radio"
                  name="model"
                  value="gemini-2.5-flash"
                  checked={selectedModel === 'gemini-2.5-flash'}
                  onChange={(e) => setSelectedModel(e.target.value as 'gemini-2.5-flash' | 'gemini-2.5-pro')}
                  className="sr-only"
                />
                ⚡ 빠른 처리
              </label>
              
              <label className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${selectedModel === 'gemini-2.5-pro' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
                <input
                  type="radio"
                  name="model"
                  value="gemini-2.5-pro"
                  checked={selectedModel === 'gemini-2.5-pro'}
                  onChange={(e) => setSelectedModel(e.target.value as 'gemini-2.5-flash' | 'gemini-2.5-pro')}
                  className="sr-only"
                />
                🎯 정확한 분석
              </label>
            </div>
          </div>

          <FileUpload onFileSelect={handleFileSelect} onAnalyze={handleAnalyze} isLoading={isLoading} />

          {error && (
            <div className="mt-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
              <p className="font-medium">오류가 발생했습니다: {error}</p>
            </div>
          )}

          {isLoading && (
            <div className="mt-12 flex flex-col items-center justify-center space-y-6">
                <Spinner />
                <p className="text-gray-600 text-lg">문서를 분석 중입니다...</p>
            </div>
          )}

          {analysisResult && !isLoading && (
            <div className="mt-12">
              <ResultDisplay result={analysisResult} />
            </div>
          )}

           {!isLoading && !analysisResult && !error && (
            <div className="mt-12 text-center text-gray-400 py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
              <p className="text-lg font-medium mb-2">문서를 업로드하여 시작하세요</p>
              <p className="text-sm">지원 형식: PDF, JPEG, PNG</p>
            </div>
          )}
        </main>
        
        <footer className="text-center mt-12 text-gray-400 text-sm">
          <p>Powered by AI 제조DX</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
