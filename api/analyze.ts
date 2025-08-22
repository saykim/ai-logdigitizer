import { GoogleGenAI, Type } from '@google/genai';
import { getAnalysisPrompt, validatePromptIntegrity } from '../lib/prompts';

// 환경변수 검증 강화
const apiKey = process.env.GEMINI_API_KEY;
const nodeEnv = process.env.NODE_ENV || 'development';
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'];

if (!apiKey) {
  throw new Error('🚨 GEMINI_API_KEY environment variable not configured');
}

// 프롬프트 무결성 검증
if (!validatePromptIntegrity()) {
  throw new Error('🚨 프롬프트 무결성 검증 실패 - 서버 시작 중단');
}

const ai = new GoogleGenAI({ apiKey });


export default async function handler(req: any, res: any) {
  // CORS 보안 검증
  const origin = req.headers.origin;
  if (nodeEnv === 'production' && origin && !allowedOrigins.includes(origin)) {
    console.warn(`🚨 차단된 Origin 접근 시도: ${origin}`);
    return res.status(403).json({ error: 'Forbidden' });
  }

  // HTTP 메서드 검증
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 요청 크기 제한 (보안)
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 50 * 1024 * 1024) { // 50MB 제한
    console.warn(`🚨 요청 크기 초과: ${contentLength} bytes`);
    return res.status(413).json({ error: 'Request too large' });
  }

  try {
    const { mimeType, data, model, userTier = 'free' } = req.body as { 
      mimeType: string; 
      data: string; 
      model?: string;
      userTier?: 'free' | 'premium' | 'enterprise';
    };
    
    // 입력 데이터 검증 강화
    if (!mimeType || !data) {
      console.error('❌ 필수 필드 누락:', { mimeType: !!mimeType, data: !!data });
      return res.status(400).json({ error: '필수 데이터가 누락되었습니다' });
    }

    if (typeof mimeType !== 'string' || typeof data !== 'string') {
      console.error('❌ 잘못된 데이터 타입:', { mimeType: typeof mimeType, data: typeof data });
      return res.status(400).json({ error: '잘못된 데이터 형식입니다' });
    }

    // 파일 타입 검증
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimeTypes.includes(mimeType)) {
      console.warn(`🚨 허용되지 않은 파일 타입: ${mimeType}`);
      return res.status(400).json({ error: '지원하지 않는 파일 형식입니다' });
    }

    // Base64 데이터 크기 검증 (약 10MB 제한)
    if (data.length > 13 * 1024 * 1024) { // Base64는 원본보다 약 33% 큼
      console.warn(`🚨 파일 크기 초과: ${Math.round(data.length / 1024 / 1024)}MB`);
      return res.status(413).json({ error: '파일 크기가 너무 큽니다 (최대 10MB)' });
    }

    // 모델 선택 및 검증
    const chosenModel = model === 'gemini-2.5-pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    
    // 보안 로깅 (민감 정보 제외)
    console.log(`📊 분석 요청: ${chosenModel}, ${mimeType}, 사용자 티어: ${userTier}`);

    // 서버사이드에서만 접근 가능한 프롬프트 가져오기
    const analysisPrompt = getAnalysisPrompt(userTier);

    let response;
    try {
      response = await ai.models.generateContent({
        model: chosenModel,
        contents: {
          parts: [
            { text: analysisPrompt }, // 보안 프롬프트 사용
            {
              inlineData: {
                mimeType,
                data,
              },
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              data_schema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  fields: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING },
                        label: { type: Type.STRING },
                        type: { type: Type.STRING },
                        required: { type: Type.BOOLEAN },
                        order: { type: Type.NUMBER }
                      },
                      required: ['key', 'label', 'type', 'order']
                    }
                  }
                },
                required: ['title', 'fields']
              },
              markdown_template: { type: Type.STRING },
              html_template: { type: Type.STRING },
            },
            required: ['data_schema', 'markdown_template', 'html_template'],
          },
          temperature: 0.1,
        },
      });
    } catch (apiError: any) {
      console.error('🚨 Gemini API 호출 실패:', apiError?.message || apiError);
      
      // 프로덕션에서는 상세한 에러 정보 숨김
      const errorMessage = nodeEnv === 'production' 
        ? 'AI 서비스가 일시적으로 이용할 수 없습니다' 
        : `AI API 오류: ${apiError?.message || '알 수 없는 오류'}`;
        
      return res.status(503).json({ error: errorMessage });
    }

    // 응답 검증 및 안전한 텍스트 추출
    if (!response?.text) {
      console.error('❌ AI 응답이 비어있음:', response);
      return res.status(502).json({ error: 'AI 모델로부터 응답을 받지 못했습니다' });
    }

    const text = response.text.trim();
    if (!text) {
      console.error('❌ 빈 텍스트 응답');
      return res.status(502).json({ error: 'AI 분석 결과가 비어있습니다' });
    }

    // JSON 형식 검증
    if (!text.startsWith('{') || !text.endsWith('}')) {
      console.error('❌ 잘못된 JSON 형식:', text.substring(0, 100) + '...');
      return res.status(502).json({ error: 'AI 응답 형식이 올바르지 않습니다' });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseError: any) {
      console.error('❌ JSON 파싱 오류:', parseError?.message);
      
      // 프로덕션에서는 상세 오류 숨김
      const errorMessage = nodeEnv === 'production'
        ? 'AI 분석 결과를 처리할 수 없습니다'
        : `JSON 파싱 오류: ${parseError?.message}`;
        
      return res.status(502).json({ error: errorMessage });
    }

    // 응답 구조 검증
    if (!parsed?.data_schema || !parsed?.markdown_template || !parsed?.html_template) {
      console.error('❌ 불완전한 분석 결과:', Object.keys(parsed || {}));
      return res.status(502).json({ error: '분석 결과가 불완전합니다' });
    }

    console.log('✅ 분석 완료');
    return res.status(200).json(parsed);

  } catch (err: any) {
    console.error('🚨 서버 오류:', err?.message || err);
    
    // 프로덕션에서는 일반적인 오류 메시지만 반환
    const errorMessage = nodeEnv === 'production'
      ? '서버에서 오류가 발생했습니다'
      : `서버 오류: ${err?.message || '알 수 없는 오류'}`;
      
    return res.status(500).json({ error: errorMessage });
  }
}


