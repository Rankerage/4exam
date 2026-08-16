#!/bin/bash
# Ollama 방화벽 — 부팅 시 자동 적용 (systemd)
# 허용: 로컬 + Tailscale(100.x) + SSH(22)
# 차단: 인터넷에서 11434 직접 접근 (SSH 터널로만)

# 기존 규칙 제거 (멱등성)
sudo iptables -D INPUT -p tcp --dport 11434 -j DROP ! -s 100.0.0.0/8 2>/dev/null
sudo iptables -D INPUT -p tcp --dport 11434 -j DROP ! -s 127.0.0.0/8 2>/dev/null
sudo iptables -D INPUT -p tcp --dport 11434 -j DROP ! -s 10.0.0.0/8 2>/dev/null

# 새 규칙: Tailscale + 로컬 + 사설만 11434 허용, 나머지 DROP
sudo iptables -A INPUT -p tcp --dport 11434 -s 100.0.0.0/8 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 11434 -s 127.0.0.0/8 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 11434 -s 10.0.0.0/8 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 11434 -j DROP

echo "[$(date '+%Y-%m-%d %H:%M')] Ollama 방화벽 적용 완료"
