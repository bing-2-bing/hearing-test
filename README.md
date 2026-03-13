# hearing-test

가청 주파수 테스트 페이지입니다.

## 수정사항을 페이지에 반영하는 방법

정적 페이지(예: GitHub Pages, Netlify, Vercel Static)에서는 파일을 올려도 브라우저 캐시 때문에 이전 JS/CSS가 보일 수 있습니다.

이번 프로젝트는 `index.html`에서 아래처럼 **버전 쿼리**를 붙여 캐시 문제를 줄였습니다.

- `style.css?v=20260312`
- `script.js?v=20260312`

추가 수정 시에는 날짜/버전을 올려주세요.

예시:

- `style.css?v=20260313`
- `script.js?v=20260313`

## 배포 체크리스트

1. 코드 수정 후 커밋/푸시
2. 정적 호스팅에서 최신 빌드/배포 완료 확인
3. 배포 URL에서 강력 새로고침
   - Windows/Linux: `Ctrl + F5`
   - macOS: `Cmd + Shift + R`
4. 여전히 이전 화면이면 시크릿 창에서 확인

## 로컬 실행

```bash
python -m http.server 4173
```

브라우저에서 `http://127.0.0.1:4173` 접속.
