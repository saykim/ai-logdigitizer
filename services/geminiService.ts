import type { AnalysisResult } from '../types';

// 프론트엔드에서는 직접 Gemini를 호출하지 않고, Vercel Serverless API를 호출합니다.
// 아래 프롬프트는 서버의 api/analyze.ts에 있습니다.

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
3단계 — html_template 생성 (완전한 데모 웹페이지)
이 단계는 이미지나 PDF를 다시 보지 않고, 오직 data_schema와 markdown_template 두 개만 입력으로 사용해 HTML을 만든다.
다음 **data_schema**와 **markdown_template**만을 참고하여, 
데모용 완전한 웹 애플리케이션 형태의 html_template를 생성하라.

입력:
data_schema:
<PASTE_STEP1_JSON_HERE>

markdown_template:
<PASTE_STEP2_JSON_HERE.markdown_template>

출력 형식(단일 JSON 객체):
{
  "html_template": "<!DOCTYPE html><html>...</html>"
}

완전한 데모 웹페이지 요구사항:
1. **완전한 HTML 문서 구조**: <!DOCTYPE html>, <html>, <head>, <body> 포함
2. **로컬 데이터 관리**: localStorage를 사용한 데이터 저장/불러오기
3. **CRUD 기능**: 데이터 저장, 불러오기, 수정, 삭제 기능 (로컬 기반)
4. **폼 검증**: 필드별 유효성 검사 및 에러 표시
5. **상태 관리**: 저장 상태, 로딩 상태 표시
6. **사용자 경험**: 성공/에러 메시지, 확인 다이얼로그
7. **반응형 디자인**: 모바일/데스크톱 대응
8. **데이터 목록**: 저장된 항목 목록 및 관리 기능

JavaScript 기능 포함사항:
- 폼 데이터 수집 및 검증
- localStorage 기반 데이터 저장/조회
- 저장된 데이터 목록 표시
- 데이터 편집/삭제 기능
- JSON 데이터 내보내기/가져오기
- 폼 초기화 및 자동 저장

스타일/기능 제약:
- 루트 컨테이너: **bg-white text-black** (항상 밝은 배경, 어두운 텍스트)
- Vanilla CSS + JavaScript만 사용 (외부 라이브러리 없이)
- **모든 데이터 입력 필드**는 data-id 속성으로 식별
- 마크다운의 표/제목/구분선/목록 구조를 **충실히** 보존하여 HTML로 매핑
- 테이블/그리드 폭 비율은 마크다운 헤더의 괄호 % 힌트를 파싱해 CSS width: %로 설정
- 인쇄 품질: @media print { @page { size: A4; margin: 10mm } } 포함
- 임의 미화/재배치 금지. 마크다운(레이아웃 사양서)을 최대한 **그대로** HTML로 투영

데모 웹페이지 구조:
1. **헤더 섹션**: 제목과 간단한 설명
2. **폼 섹션** (중앙): 원본 레이아웃 기반 데이터 입력 폼
3. **제어 버튼** (하단): 저장, 불러오기, 초기화, 내보내기 버튼
4. **데이터 목록** (사이드바 또는 하단): 저장된 데이터 목록 및 관리
5. **상태 표시**: 저장 상태, 메시지 표시 영역

검증 규칙:
- 모든 data-id는 data_schema.fields[].key와 일치해야 함
- 완전한 HTML 문서 구조 포함
- localStorage 기반 JavaScript 기능이 모두 동작해야 함
- 루트에 bg-white text-black 포함
- 테이블/섹션 순서는 markdown_template 순서와 동일해야 함
- DB 연결 코드 없이 완전한 데모로 동작해야 함
`;

export const analyzeDocument = async (file: { mimeType: string; data: string }, opts?: { model?: 'gemini-2.5-flash' | 'gemini-2.5-pro' }): Promise<AnalysisResult> => {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...file, model: opts?.model }),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Analyze failed: ${res.status} ${msg}`);
  }
  const parsed = await res.json();
  // 최소 검증
  if (!parsed?.data_schema || !parsed?.markdown_template || !parsed?.html_template) {
    throw new Error('Invalid analyze response shape');
  }
  return parsed as AnalysisResult;
};
