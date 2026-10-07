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
SSL="${SSL:-true}"

[ "$(id -u)" -eq 0 ] || { echo "Skriptni root sifatida ishga tushiring." >&2; exit 1; }

log() { printf '\n==> %s\n' "$*"; }
as_app() { runuser -u "$APP_USER" -- "$@"; }
reload_nginx() { nginx -t && { systemctl reload nginx || systemctl restart nginx; }; }

log "Tizim paketlari"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git nginx python3 python3-venv python3-pip curl ca-certificates
if [ "$SSL" = "true" ] && ! command -v certbot >/dev/null 2>&1; then
  apt-get install -y certbot python3-certbot-nginx
fi

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

log "nginx ($DOMAIN)"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
SITE=/etc/nginx/sites-available/vision
PROXY="    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:$WEB_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
    }"

if [ ! -f "$CERT_DIR/fullchain.pem" ]; then
  cat > "$SITE" <<EOF
server {
    listen 80;
    server_name $DOMAIN;
$PROXY
}
EOF
  ln -sf "$SITE" /etc/nginx/sites-enabled/vision
  systemctl enable nginx >/dev/null
  reload_nginx
  if [ "$SSL" = "true" ]; then
    log "SSL sertifikat (Let's Encrypt)"
    certbot certonly --nginx -d "$DOMAIN" --non-interactive --agree-tos \
      --register-unsafely-without-email --deploy-hook "systemctl reload nginx" ||
      echo "Sertifikat olinmadi: $DOMAIN DNS yozuvi shu serverga qaratilganini tekshiring."
  fi
fi

if [ -f "$CERT_DIR/fullchain.pem" ]; then
  SSL_EXTRA=""
  [ -f /etc/letsencrypt/options-ssl-nginx.conf ] &&
    SSL_EXTRA+="    include /etc/letsencrypt/options-ssl-nginx.conf;"$'\n'
  [ -f /etc/letsencrypt/ssl-dhparams.pem ] &&
    SSL_EXTRA+="    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;"$'\n'
  cat > "$SITE" <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    ssl_certificate $CERT_DIR/fullchain.pem;
    ssl_certificate_key $CERT_DIR/privkey.pem;
${SSL_EXTRA}
$PROXY
}
EOF
  ln -sf "$SITE" /etc/nginx/sites-enabled/vision
  reload_nginx
  SCHEME=https
else
  SCHEME=http
fi
COOKIE_SECURE="${COOKIE_SECURE:-$([ "$SCHEME" = https ] && echo true || echo false)}"

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow 'Nginx Full' >/dev/null
fi

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

log "Tekshiruv"
for _ in $(seq 1 30); do
  curl -fsS "http://127.0.0.1:$API_PORT/api/health" >/dev/null 2>&1 &&
    curl -fsS -o /dev/null "http://127.0.0.1:$WEB_PORT/login" 2>/dev/null && break
  sleep 1
done
echo "API:   $(curl -fsS "http://127.0.0.1:$API_PORT/api/health")"
if [ "$SCHEME" = https ]; then
  echo "nginx: $(curl -s -o /dev/null -w '%{http_code}' --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/login")"
else
  echo "nginx: $(curl -s -o /dev/null -w '%{http_code}' -H "Host: $DOMAIN" http://127.0.0.1/login)"
fi
echo "Cookie secure: $COOKIE_SECURE"
echo
echo "Tayyor: $SCHEME://$DOMAIN"
