import { GoogleGenAI, Type } from '@google/genai';

// Ensure API key is present in the server environment
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY environment variable not set');
}

const ai = new GoogleGenAI({ apiKey });
const model = 'gemini-2.5-flash';

// Prompt focused on: data_schema (JSON) → markdown_template (pure Markdown) → html_template (Vanilla CSS)
const prompt = `
아래 프롬프트 세트는 업로드된 제조 일지 이미지/PDF를 원본과 최대한 동일하게 디지털 템플릿으로 복원하기 위한 단계형 지침입니다. 
출력은 단계적으로 data_schema → markdown_template → html_template 순서로 생성하며, 
HTML 단계에서는 이미지/PDF를 다시 보지 않고 오직 이전 두 산출물만 사용합니다.
html파일을 가지고 db연결해서 반영구적으로 시스템에서 사용할겁니다. 

[system]
You are an expert in reverse-engineering scanned manufacturing logs into structured, reusable digital templates.
Your absolute priority is to faithfully preserve the original page’s layout, spacing, and visual style.
Never modernize or beautify the design. Be literal and conservative.

All outputs MUST be a single valid JSON object only (no prose, no code fences).

1단계 — data_schema(JSON) 생성 
업로드된 제조 일지 이미지/PDF를 분석해 원본과 동일한 필드 구조와 순서의 data_schema만 생성하라.

출력 형식(단일 JSON 객체):
{
  "data_schema": {
    "title": "원본 문서명(간결)",
    "fields": [
      {
        "key": "공백/특수문자 없는 키(원본 라벨 기반)",
        "label": "원본 라벨(한글/공백 허용)",
        "type": "string|number|boolean|date|time|datetime|enum|textarea|checkbox|radio",
        "required": true|false,
        "order": <원본 시각 순서 정수>,
        "enum": ["선택지1","선택지2"],
        "unit": "단위(있으면)",
        "format": "date|time|datetime|regex|none",
        "group": "섹션/테이블 이름(있으면)",
        "notes": "불확실한 추정 근거(있으면)"
      }
      // … 모든 필드를 원본 순서대로 기술
    ]
  }
}

제약:
- 페이지/레이아웃 해석은 하되, 지금은 데이터 구조만 출력한다.
- 체크박스/라디오/서명칸/합계줄 등 특수 요소도 가능한 범위에서 type으로 표현한다.
- 불확실하면 type을 보수적으로 지정하고 notes에 근거를 남긴다.
--------------------------------
2단계 — design(markdown_template) 생성 
 - 순수 마크다운만 허용(HTML 태그 절대 금지). 이 단계에서 원본 레이아웃을 최대한 정확하게 서술합니다.

아래 data_schema를 참고하여 **원본 레이아웃을 반영한 순수 마크다운 템플릿**만 생성하라.

입력:
<PASTE_STEP1_JSON_HERE>

출력 형식(단일 JSON 객체):
{
  "markdown_template": "..."
}

마크다운 규칙(엄격):
HTML 태그 사용 절대 금지.
제목: #, ##, ### 만 사용
테이블: | 구분자만 사용 (열 너비 힌트는 헤더명 뒤 괄호 %로 표기 가능: 예) 항목(40%))
강조: 굵게, 기울임 만 사용
구분선: ---
목록: -, 1.
플레이스홀더: {{fieldName}} (data_schema.fields[].key와 일치)
체크박스: [ ] 또는 [x] 만 사용 (예: 점검 항목 표의 체크 열)
원본의 섹션 순서/표 구조/라벨/칸 배치를 그대로 반영할 것
여백/간격/라인 두께는 불가피하게 근사 표현 시, 표/제목/구분선 배치로 드러낼 것
(선택) 열 너비 힌트: 표 헤더에 비율 표기 예) | 항목(40%) | 체크(20%) | 비고(40%) |

--------------------------------
3단계 — html_template 생성 
이 단계는 이미지나 PDF를 다시 보지 않고, 오직 data_schema와 markdown_template 두 개만 입력으로 사용해 HTML을 만든다.
다음 **data_schema**와 **markdown_template**만을 참고하여, 
원본과 최대한 유사한 Vanilla CSS 기반 html_template를 생성하라.이미지/PDF는 절대 참조하지 말 것. 
HTML은 반드시 주어진 JSON과 Markdown으로만 구성한다.
줄 바꿈, 들여쓰기 등 시인성을 고려해. 

입력:
data_schema:
<PASTE_STEP1_JSON_HERE>

markdown_template:
<PASTE_STEP2_JSON_HERE.markdown_template>

출력 형식(단일 JSON 객체):
{
  "html_template": "<div style=\"min-height: 100vh; background: white; color: black;\"> ... </div>"
}

스타일/기능 제약:
- 루트 컨테이너: **bg-white text-black** (항상 밝은 배경, 어두운 텍스트)
- Vanilla CSS 중심, 인라인 스타일 또는 <style> 태그 활용
- **모든 데이터 자리**는 {{fieldName}} placeholder 유지(치환용)
- 마크다운의 표/제목/구분선/목록 구조를 **충실히** 보존하여 HTML로 매핑
- 테이블/그리드 폭 비율은 마크다운 헤더의 괄호 % 힌트를 파싱해 CSS width: %로 설정
- 체크박스/라디오는 <input type="checkbox">, <input type="radio">로 표현하되 값 표시는 placeholder 로 유지,
- 인쇄 품질: @media print { @page { size: A4; margin: 10mm } } 포함,
- 임의 미화/재배치 금지. 마크다운(레이아웃 사양서)을 최대한 **그대로** HTML로 투영할 것

검증 규칙(내부적으로 준수):
- 모든 {{fieldName}}는 data_schema.fields[].key 안에 존재해야 함(미스매치 금지)
- 루트에 bg-white text-black 포함 여부 확인
- 테이블/섹션 순서는 markdown_template 순서와 동일해야 함
`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { mimeType, data } = req.body as { mimeType: string; data: string };
    if (!mimeType || !data) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { text: prompt },
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
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  value: { type: Type.STRING },
                },
              },
            },
            markdown_template: { type: Type.STRING },
            html_template: { type: Type.STRING },
          },
          required: ['data_schema', 'markdown_template', 'html_template'],
        },
        temperature: 0.1,
      },
    });

    const text = response.text.trim();
    if (!text.startsWith('{') || !text.endsWith('}')) {
      return res.status(502).json({ error: 'Invalid JSON response from model' });
    }

    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (err: any) {
    console.error('analyze API error:', err);
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}


