# 🚀 Vercel 배포 가이드

## 환경변수 설정 (Vercel Dashboard)

Vercel 프로젝트 설정에서 다음 환경변수들을 설정하세요:

### 필수 환경변수
```
GEMINI_API_KEY=your_actual_gemini_api_key
NODE_ENV=production
```

### 권장 환경변수
```
ALLOWED_ORIGINS=https://your-domain.vercel.app
PROMPT_VERSION=standard
LOG_LEVEL=error
```

## 배포 전 체크리스트

### ✅ 보안 체크
- [x] 프론트엔드에서 프롬프트 제거 완료
- [x] 서버사이드 프롬프트 분리 완료  
- [x] .env 파일들 Git 무시 설정 완료
- [x] API 에러 메시지 일반화 완료

### ✅ 기능 체크
- [x] 로컬에서 정상 작동 확인
- [x] TypeScript 컴파일 오류 없음
- [x] 빌드 성공 확인

## 배포 후 확인사항

1. **기능 테스트**
   - 파일 업로드 및 분석 기능
   - HTML/JSON/Markdown 다운로드

2. **보안 테스트**
   - 개발자도구에서 프롬프트 노출 여부
   - Network 탭에서 민감 정보 확인

3. **성능 테스트**
   - API 응답 시간
   - 파일 업로드 제한 작동 여부

## 문제 해결

### 환경변수 관련
- Vercel Dashboard → Settings → Environment Variables에서 설정
- 배포 후 Function Logs에서 오류 확인

### API 관련
- Vercel Functions 로그 확인
- Gemini API 할당량 및 권한 확인

## 보안 모니터링

정기적으로 확인할 사항:
- [ ] API 키 로테이션 (월 1회)
- [ ] 접근 로그 모니터링
- [ ] 에러 로그 분석
- [ ] 사용량 추적
