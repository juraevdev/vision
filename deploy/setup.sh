#!/usr/bin/env bash
# Ubuntu/Debian serverda root sifatida ishga tushiriladi. Qayta ishga tushirish = yangilash.
set -euo pipefail

DOMAIN="${DOMAIN:-vision.buildup.uz}"
REPO="${REPO:-https://github.com/juraevdev/vision.git}"
BRANCH="${BRANCH:-master}"
APP_DIR="${APP_DIR:-/opt/vision}"
APP_USER="${APP_USER:-vision}"
API_PORT="${API_PORT:-8005}"
WEB_PORT="${WEB_PORT:-3005}"
COOKIE_SECURE="${COOKIE_SECURE:-false}"

[ "$(id -u)" -eq 0 ] || { echo "Skriptni root sifatida ishga tushiring." >&2; exit 1; }

log() { printf '\n==> %s\n' "$*"; }
as_app() { runuser -u "$APP_USER" -- "$@"; }

log "Tizim paketlari"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git nginx python3 python3-venv python3-pip curl ca-certificates

node_major() { command -v node >/dev/null 2>&1 && node -p 'process.versions.node.split(".")[0]' || echo 0; }
if [ "$(node_major)" -lt 20 ]; then
  log "Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
NODE_BIN="$(command -v node)"

log "Foydalanuvchi va kod ($APP_DIR)"
id -u "$APP_USER" >/dev/null 2>&1 ||
  useradd --system --create-home --home-dir "/var/lib/$APP_USER" --shell /usr/sbin/nologin "$APP_USER"
if [ -d "$APP_DIR/.git" ]; then
  chown -R "$APP_USER:$APP_USER" "$APP_DIR"
  as_app git -C "$APP_DIR" fetch --quiet origin "$BRANCH"
  as_app git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
  install -d -o "$APP_USER" -g "$APP_USER" "$APP_DIR"
  as_app git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
fi

if [ ! -f "$APP_DIR/backend/.env" ]; then
  cat > "$APP_DIR/backend/.env" <<EOF
CORS_ORIGINS=http://$DOMAIN,https://$DOMAIN
EOF
  chown "$APP_USER:$APP_USER" "$APP_DIR/backend/.env"
  chmod 600 "$APP_DIR/backend/.env"
fi

log "Backend (FastAPI)"
as_app python3 -m venv "$APP_DIR/backend/.venv"
as_app "$APP_DIR/backend/.venv/bin/pip" install --quiet --upgrade pip
as_app "$APP_DIR/backend/.venv/bin/pip" install --quiet -r "$APP_DIR/backend/requirements.txt"

log "Frontend (Next.js build)"
as_app bash -c "cd '$APP_DIR' && npm ci --no-audit --no-fund && npm run build"

log "systemd xizmatlari"
cat > /etc/systemd/system/vision-api.service <<EOF
[Unit]
Description=Vision API (FastAPI)
After=network.target

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR/backend
ExecStart=$APP_DIR/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port $API_PORT
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/vision-web.service <<EOF
[Unit]
Description=Vision web (Next.js)
After=network.target vision-api.service
Wants=vision-api.service

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=API_URL=http://127.0.0.1:$API_PORT
Environment=COOKIE_SECURE=$COOKIE_SECURE
ExecStart=$NODE_BIN $APP_DIR/node_modules/next/dist/bin/next start -H 127.0.0.1 -p $WEB_PORT
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable vision-api vision-web >/dev/null
systemctl restart vision-api vision-web

log "nginx ($DOMAIN)"
cat > /etc/nginx/sites-available/vision <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:$WEB_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
ln -sf /etc/nginx/sites-available/vision /etc/nginx/sites-enabled/vision
nginx -t
systemctl enable nginx >/dev/null
systemctl reload nginx || systemctl restart nginx

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow 'Nginx Full' >/dev/null
fi

log "Tekshiruv"
for _ in $(seq 1 30); do
  curl -fsS "http://127.0.0.1:$API_PORT/api/health" >/dev/null 2>&1 &&
    curl -fsS -o /dev/null "http://127.0.0.1:$WEB_PORT/login" 2>/dev/null && break
  sleep 1
done
echo "API:   $(curl -fsS "http://127.0.0.1:$API_PORT/api/health")"
echo "nginx: $(curl -s -o /dev/null -w '%{http_code}' -H "Host: $DOMAIN" http://127.0.0.1/login)"
echo
echo "Tayyor: http://$DOMAIN"
