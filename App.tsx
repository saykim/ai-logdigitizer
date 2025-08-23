
import React, { useState, useCallback } from 'react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
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
      <div className="container mx-auto px-4 py-8 max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] xl:px-8 2xl:px-12">
        {/* 상단 인증 영역 */}
        <div className="flex justify-end mb-8">
          <SignedOut>
            <div className="flex items-center gap-3">
              <SignInButton mode="modal">
                <button className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-md hover:shadow-lg">
                  로그인
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg">
                  회원가입
                </button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-12 h-12"
                }
              }}
            />
          </SignedIn>
        </div>

        <header className="text-center mb-20">

          <div className="relative">
            {/* 배경 장식 */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] xl:w-[1200px] xl:h-[600px] bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-full blur-3xl"></div>
            </div>
            
            {/* 메인 로고 및 제목 */}
            <div className="mb-10">
              <div className="inline-flex items-center gap-6 mb-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-5 rounded-3xl shadow-xl">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                
                <div>
                  <h1 className="text-4xl md:text-6xl xl:text-7xl font-black leading-tight">
                    <span className="text-gray-900">
                      AI Report-Log
                    </span>
                    <span className="text-blue-600 ml-3">
                      Digitizer
                    </span>
                  </h1>
                </div>
              </div>
              
              {/* 장식 라인 */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-blue-400 rounded-full"></div>
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg"></div>
                <div className="w-32 h-0.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-full"></div>
                <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg"></div>
                <div className="w-16 h-0.5 bg-gradient-to-r from-purple-400 to-transparent rounded-full"></div>
              </div>
            </div>
            
            {/* 설명 텍스트 */}
            <div className="max-w-5xl xl:max-w-6xl mx-auto mb-10">
              <p className="text-xl md:text-2xl xl:text-3xl text-gray-600 leading-relaxed font-light">
                제조 리포트와 로그를 
                <span className="font-semibold text-blue-600 mx-2">구조화된 데이터</span>와
                <br className="hidden md:block" />
                <span className="font-semibold text-indigo-600 mx-2">재사용 가능한 템플릿</span>으로 
                <span className="font-bold text-gray-800 bg-gradient-to-r from-yellow-100 to-yellow-50 px-2 py-1 rounded-lg">즉시 변환</span>
              </p>
            </div>
            
            {/* 기능 배지 */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-gray-700">AI 기반 분석</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-gray-700">실시간 변환</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-gray-700">다중 포맷 지원</span>
              </div>
            </div>
          </div>
        </header>

        <main className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12 xl:p-16">
          {/* 비로그인 사용자용 안내 */}
          <SignedOut>
            <div className="text-center py-20">
              <div className="mb-8">
                <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  AI Report-Log Digitizer를 사용하려면 먼저 로그인해주세요.<br />
                  안전하고 개인화된 서비스를 제공하기 위해 계정이 필요합니다.
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <SignInButton mode="modal">
                  <button className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 border border-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
                    로그인하기
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-8 py-4 text-lg font-semibold text-blue-600 bg-white border-2 border-blue-600 rounded-xl hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl">
                    회원가입하기
                  </button>
                </SignUpButton>
              </div>
              
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="text-center p-6 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">AI 기반 분석</h3>
                  <p className="text-sm text-gray-600">최신 AI 기술로 정확한 문서 분석</p>
                </div>
                
                <div className="text-center p-6 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">빠른 처리</h3>
                  <p className="text-sm text-gray-600">실시간으로 문서를 구조화된 데이터로 변환</p>
                </div>
                
                <div className="text-center p-6 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">다중 포맷 지원</h3>
                  <p className="text-sm text-gray-600">PDF, JPEG, PNG 등 다양한 형식 지원</p>
                </div>
              </div>
            </div>
          </SignedOut>

          {/* 로그인 사용자용 기능 */}
          <SignedIn>
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
                <div className="w-full">
                  <ResultDisplay result={analysisResult} />
                </div>
              </div>
            )}

             {!isLoading && !analysisResult && !error && (
              <div className="mt-12 text-center text-gray-400 py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
                <p className="text-lg font-medium mb-2">문서를 업로드하여 시작하세요</p>
                <p className="text-sm">지원 형식: PDF, JPEG, PNG</p>
              </div>
            )}
          </SignedIn>
        </main>
        
        <footer className="text-center mt-12 text-gray-400 text-sm">
          <p>Powered by BDK AI</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
