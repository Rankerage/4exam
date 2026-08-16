@echo off
chcp 65001 >nul
title Ollama SSH 터널 (4exam ARM 서버)
color 0A

echo ============================================
echo   Ollama SSH 터널 - 4exam ARM 서버 연결
echo   로컬 11434 -^> 오라클 서버 11434 (암호화)
echo ============================================
echo.

REM ---- 1. SSH 키 확인 (없으면 자동 생성) ----
if not exist "%USERPROFILE%\.ssh\id_ed25519" (
    echo [1/3] SSH 키가 없습니다. 생성합니다...
    ssh-keygen -t ed25519 -N "" -f "%USERPROFILE%\.ssh\id_ed25519" >nul 2>&1
    echo      키 생성 완료!
)

REM ---- 2. 공개키를 서버에 등록 (첫 1회만) ----
echo [2/3] 서버에 키 등록 확인 중...
type "%USERPROFILE%\.ssh\id_ed25519.pub" | ssh -o StrictHostKeyChecking=accept-new ubuntu@138.2.58.224 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys" 2>nul
if %errorlevel% neq 0 (
    echo      첫 연결 시 비밀번호를 1번 입력하세요.
    echo      (다음부터는 자동 연결)
    type "%USERPROFILE%\.ssh\id_ed25519.pub" | ssh ubuntu@138.2.58.224 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
)

REM ---- 3. 터널 유지 (무한) ----
echo [3/3] SSH 터널 시작!
echo.
echo    연결됨! 이제 http://127.0.0.1:11434 로 접속 가능
echo    (OpenAI 규격: http://127.0.0.1:11434/v1)
echo    종료하려면 이 창을 닫으세요.
echo.
ssh -N -L 11434:127.0.0.1:11434 ubuntu@138.2.58.224

pause
