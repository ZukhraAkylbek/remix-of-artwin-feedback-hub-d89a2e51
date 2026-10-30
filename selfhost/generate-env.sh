#!/usr/bin/env bash
# Создаёт selfhost/server.env со всеми ключами для своего сервера.
# Использование: ./selfhost/generate-env.sh feedback.artwin.kg api.artwin.kg
set -euo pipefail
cd "$(dirname "$0")"
SITE=${1:-feedback.artwin.kg}; API=${2:-api.artwin.kg}
[ -f server.env ] && { echo "server.env уже есть — не перезаписываю"; exit 1; }
JWT=$(openssl rand -hex 32)
sign() { node -e '
const c=require("crypto"),b=x=>Buffer.from(JSON.stringify(x)).toString("base64url");
const now=Math.floor(Date.now()/1000),h=b({alg:"HS256",typ:"JWT"}),p=b({role:process.argv[2],iss:"supabase",iat:now,exp:now+10*365*86400});
console.log(h+"."+p+"."+c.createHmac("sha256",process.argv[1]).update(h+"."+p).digest("base64url"))' "$JWT" "$1"; }
cat > server.env <<ENV
POSTGRES_PASSWORD=$(openssl rand -hex 24)
JWT_SECRET=$JWT
ANON_KEY=$(sign anon)
SERVICE_ROLE_KEY=$(sign service_role)
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=$(openssl rand -hex 12)
SITE_URL=https://$SITE
API_EXTERNAL_URL=https://$API
SUPABASE_PUBLIC_URL=https://$API
ENABLE_EMAIL_AUTOCONFIRM=false
DISABLE_SIGNUP=true
ENV
chmod 600 server.env
echo "Готово: selfhost/server.env. Храните его только на сервере."
