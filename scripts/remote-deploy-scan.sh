#!/usr/bin/env bash
set -euo pipefail

echo "=== System Info ==="
echo "Host: $(hostname)" || true
echo "Uptime:" && uptime || true
echo "Date: $(date)" || true
echo

echo "=== Node & PM2 ==="
command -v node && node -v || echo "node: not found"
command -v pm2 && pm2 -v || echo "pm2: not found"
if command -v pm2 >/dev/null 2>&1; then
  pm2 status || true
  echo
  pm2 show summer-vacation-backend || true
fi
echo

echo "=== Backend Process & Ports ==="
BACKEND_PORTS="80|443|5000|3001"
if command -v ss >/dev/null 2>&1; then
  ss -ltnp | egrep -E ":(${BACKEND_PORTS})\b" || true
elif command -v netstat >/dev/null 2>&1; then
  netstat -ltnp | egrep -E ":(${BACKEND_PORTS})\b" || true
else
  echo "No ss/netstat available"
fi
echo

echo "=== Backend Health Check ==="
for url in \
  "http://127.0.0.1:5000/health" \
  "http://127.0.0.1:3001/health" \
  "http://localhost/health"; do
  echo "curl --max-time 3 -fsSL $url"; curl --max-time 3 -fsSL "$url" || true; echo; echo
done

echo "=== Nginx (if present) ==="
if command -v nginx >/dev/null 2>&1; then
  nginx -t || true
  systemctl status nginx -l --no-pager || true
fi
echo

echo "=== PM2 Logs (tail) ==="
LOG_DIR="/root/projects/SummerVacationPlanning/logs"
if [ -d "$LOG_DIR" ]; then
  ls -lh "$LOG_DIR" || true
  for f in backend-error.log backend-out.log backend-combined.log; do
    [ -f "$LOG_DIR/$f" ] && { echo "--- tail -n 80 $LOG_DIR/$f"; tail -n 80 "$LOG_DIR/$f"; echo; } || true
  done
else
  echo "Log dir not found: $LOG_DIR"
fi
echo

echo "=== Disk & Memory ==="
df -h || true
free -h || true
echo

echo "=== Backend CWD Check ==="
BACKEND_CWD="/root/projects/SummerVacationPlanning/backend"
if [ -d "$BACKEND_CWD" ]; then
  echo "Found backend at $BACKEND_CWD"
  ls -lh "$BACKEND_CWD/dist" || true
else
  echo "Backend path not found: $BACKEND_CWD"
fi

echo "=== Done ==="

