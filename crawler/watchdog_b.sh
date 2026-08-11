#!/bin/bash
# HermesB 감시탑 — 30분마다: A 사이트 + 크롤러 상태 체크 → 문제 시 알림
LOG="/tmp/watchdog.log"

# 1. 4exam.study 사이트 체크
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 https://4exam.study/ 2>/dev/null)

# 2. A의 Ollama 체크
OLLAMA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://100.115.250.84:11434/api/tags 2>/dev/null)

# 3. 크롤러 최근 활동 체크 (A에서 로그 확인)
LAST_LOG=$(ssh -i /home/opc/.ssh/id_ed25519 -o ConnectTimeout=5 -o BatchMode=yes ubuntu@100.115.250.84 "tail -1 /tmp/textbook_crawler.log 2>/dev/null" 2>/dev/null)

TIME=$(date '+%Y-%m-%d %H:%M')
echo "[$TIME] site=$SITE_STATUS ollama=$OLLAMA_STATUS" >> $LOG

# 문제 감지 시 텔레그램 알림 (B에 봇 설정 시)
if [ "$SITE_STATUS" != "200" ]; then
  echo "[$TIME] ⚠️ 4exam.study 다운!" >> $LOG
fi
if [ "$OLLAMA_STATUS" != "200" ]; then
  echo "[$TIME] ⚠️ HermesA Ollama 응답 없음!" >> $LOG
fi

# 마지막 5줄만 유지
tail -5 $LOG > $LOG.tmp && mv $LOG.tmp $LOG
