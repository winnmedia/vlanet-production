# Supabase 이메일 템플릿 설정 가이드

## 개요
VideoPlanet 프로젝트의 인증 시스템에서 사용할 한국어 이메일 템플릿을 설정합니다.

## 설정 방법

### 1. Supabase Dashboard 접속
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. VideoPlanet 프로젝트 선택
3. Settings → Auth → Email Templates 메뉴로 이동

### 2. 회원가입 확인 이메일 (Confirm signup)

**Subject:** VLANET 계정 확인

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>VLANET 계정 확인</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
        .content { background: #f8fafc; padding: 30px; border-radius: 8px; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">VLANET</div>
        </div>

        <div class="content">
            <h2>계정 확인을 완료해주세요</h2>
            <p>안녕하세요!</p>
            <p>VLANET에 가입해주셔서 감사합니다. 아래 버튼을 클릭하여 이메일 주소를 확인해주세요.</p>

            <a href="{{ .ConfirmationURL }}" class="button">이메일 확인하기</a>

            <p>버튼이 작동하지 않는 경우, 아래 링크를 복사하여 브라우저에 붙여넣어주세요:</p>
            <p style="word-break: break-all; color: #6366f1;">{{ .ConfirmationURL }}</p>

            <p><strong>주의:</strong> 이 링크는 24시간 동안만 유효합니다.</p>
        </div>

        <div class="footer">
            <p>AI 창작자와 투자자를 연결하는 플랫폼, VLANET</p>
            <p>이 이메일은 자동으로 발송되었습니다. 직접 답장하지 마세요.</p>
        </div>
    </div>
</body>
</html>
```

### 3. 비밀번호 재설정 이메일 (Reset password)

**Subject:** VLANET 비밀번호 재설정

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>VLANET 비밀번호 재설정</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
        .content { background: #f8fafc; padding: 30px; border-radius: 8px; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        .warning { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">VLANET</div>
        </div>

        <div class="content">
            <h2>비밀번호 재설정 요청</h2>
            <p>안녕하세요!</p>
            <p>VLANET 계정의 비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.</p>

            <a href="{{ .ConfirmationURL }}" class="button">비밀번호 재설정하기</a>

            <p>버튼이 작동하지 않는 경우, 아래 링크를 복사하여 브라우저에 붙여넣어주세요:</p>
            <p style="word-break: break-all; color: #6366f1;">{{ .ConfirmationURL }}</p>

            <div class="warning">
                <strong>⚠️ 보안 안내</strong>
                <ul>
                    <li>이 링크는 24시간 동안만 유효합니다</li>
                    <li>비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요</li>
                    <li>강력한 비밀번호를 사용하여 계정을 보호하세요</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p>AI 창작자와 투자자를 연결하는 플랫폼, VLANET</p>
            <p>이 이메일은 자동으로 발송되었습니다. 직접 답장하지 마세요.</p>
        </div>
    </div>
</body>
</html>
```

### 4. 이메일 변경 확인 (Change email)

**Subject:** VLANET 이메일 주소 변경 확인

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>VLANET 이메일 주소 변경</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
        .content { background: #f8fafc; padding: 30px; border-radius: 8px; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">VLANET</div>
        </div>

        <div class="content">
            <h2>이메일 주소 변경 확인</h2>
            <p>안녕하세요!</p>
            <p>VLANET 계정의 이메일 주소 변경을 요청하셨습니다. 아래 버튼을 클릭하여 새로운 이메일 주소를 확인해주세요.</p>

            <a href="{{ .ConfirmationURL }}" class="button">이메일 변경 확인하기</a>

            <p>버튼이 작동하지 않는 경우, 아래 링크를 복사하여 브라우저에 붙여넣어주세요:</p>
            <p style="word-break: break-all; color: #6366f1;">{{ .ConfirmationURL }}</p>

            <p><strong>주의:</strong> 이 링크는 24시간 동안만 유효합니다.</p>
        </div>

        <div class="footer">
            <p>AI 창작자와 투자자를 연결하는 플랫폼, VLANET</p>
            <p>이 이메일은 자동으로 발송되었습니다. 직접 답장하지 마세요.</p>
        </div>
    </div>
</body>
</html>
```

## 추가 설정

### SMTP 설정 (권장)
운영 환경에서는 커스텀 SMTP를 설정하는 것이 좋습니다:

1. Settings → Auth → SMTP Settings
2. 이메일 서비스 제공업체 정보 입력 (예: SendGrid, Mailgun)
3. 발신자 이메일: `noreply@vlanet.com`
4. 발신자 이름: `VLANET`

### Redirect URLs 설정
1. Settings → Auth → URL Configuration
2. Site URL: `https://vlanet.vercel.app`
3. Redirect URLs 추가:
   - `https://vlanet.vercel.app/auth/callback`
   - `http://localhost:3001/auth/callback` (개발용)

## 완료 확인
설정 완료 후 개발 환경에서 다음을 테스트:
1. 회원가입 이메일 발송
2. 비밀번호 재설정 이메일 발송
3. 이메일 링크 클릭 시 올바른 페이지로 이동하는지 확인