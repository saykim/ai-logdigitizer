import type { AnalysisResult } from '../types';

/**
 * 🔒 보안 강화된 클라이언트 서비스
 * 
 * 주요 보안 개선사항:
 * - 프롬프트 완전 제거: 모든 프롬프트 로직은 서버사이드에서만 처리
 * - 에러 메시지 일반화: 상세한 기술 정보 노출 방지
 * - 요청 검증 강화: 클라이언트 사이드 기본 검증
 * 
 * ⚠️ 중요: 이 파일은 브라우저에서 실행되므로 민감한 정보를 포함하지 않습니다.
 */

/**
 * 파일 타입 및 크기 검증 (클라이언트 사이드 1차 검증)
 */
function validateFileInput(file: { mimeType: string; data: string }): void {
  // 허용된 파일 타입 검증
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.mimeType)) {
    throw new Error('지원하지 않는 파일 형식입니다. (지원: JPG, PNG, WebP, PDF)');
  }

  // 파일 크기 검증 (클라이언트 사이드 기본 체크)
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB
  const estimatedSize = (file.data.length * 3) / 4; // Base64 디코딩 후 예상 크기
  
  if (estimatedSize > maxSizeBytes) {
    throw new Error('파일 크기가 너무 큽니다. (최대 10MB)');
  }

  // Base64 형식 기본 검증
  if (!file.data || typeof file.data !== 'string') {
    throw new Error('올바르지 않은 파일 데이터입니다.');
  }
}

/**
 * 서버 응답 구조 검증
 */
function validateAnalysisResult(result: any): result is AnalysisResult {
  return (
    result &&
    typeof result === 'object' &&
    result.data_schema &&
    typeof result.markdown_template === 'string' &&
    typeof result.html_template === 'string' &&
    result.data_schema.title &&
    Array.isArray(result.data_schema.fields)
  );
}

/**
 * 문서 분석 요청 함수
 * 
 * @param file 분석할 파일 정보 (mimeType, base64 data)
 * @param opts 옵션 (모델 선택 등)
 * @returns 분석 결과 (data_schema, markdown_template, html_template)
 */
export const analyzeDocument = async (
  file: { mimeType: string; data: string }, 
  opts?: { model?: 'gemini-2.5-flash' | 'gemini-2.5-pro' }
): Promise<AnalysisResult> => {
  
  // 1차 클라이언트 사이드 검증
  try {
    validateFileInput(file);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '파일 검증 실패');
  }

  // 서버 요청 준비
  const requestBody = {
    mimeType: file.mimeType,
    data: file.data,
    model: opts?.model || 'gemini-2.5-flash',
    // 향후 사용자 인증 정보 추가 예정
    // userTier: 'free' // 기본값
  };

  let response: Response;
  
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // 향후 인증 헤더 추가
        // 'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify(requestBody),
    });
  } catch (networkError) {
    console.error('네트워크 오류:', networkError);
    throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
  }

  // HTTP 상태 코드별 에러 처리
  if (!response.ok) {
    let errorMessage = '분석 중 오류가 발생했습니다.';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // JSON 파싱 실패 시 상태 코드 기반 메시지
      switch (response.status) {
        case 400:
          errorMessage = '잘못된 요청입니다. 파일을 다시 확인해주세요.';
          break;
        case 403:
          errorMessage = '접근이 거부되었습니다.';
          break;
        case 413:
          errorMessage = '파일 크기가 너무 큽니다.';
          break;
        case 429:
          errorMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
          break;
        case 500:
          errorMessage = '서버 오류가 발생했습니다.';
          break;
        case 503:
          errorMessage = 'AI 서비스가 일시적으로 이용할 수 없습니다.';
          break;
        default:
          errorMessage = `서버 오류 (${response.status})`;
      }
    }
    
    throw new Error(errorMessage);
  }

  // 응답 데이터 파싱
  let parsed: any;
  try {
    parsed = await response.json();
  } catch (parseError) {
    console.error('응답 파싱 오류:', parseError);
    throw new Error('서버 응답을 처리할 수 없습니다.');
  }

  // 응답 구조 검증
  if (!validateAnalysisResult(parsed)) {
    console.error('잘못된 응답 구조:', parsed);
    throw new Error('분석 결과가 올바르지 않습니다.');
  }

  return parsed as AnalysisResult;
};
