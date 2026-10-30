#!/usr/bin/env bash
# Полный локальный запуск: база, вход, хранилище, realtime, функции и сайт.
# Требуется: Docker (запущен), Node.js 20+. Linux/macOS/WSL.
set -euo pipefail
cd "$(dirname "$0")/.."

command -v docker >/dev/null || { echo "Установите Docker: https://docs.docker.com/get-docker/"; exit 1; }
command -v node   >/dev/null || { echo "Установите Node.js 20+: https://nodejs.org"; exit 1; }
docker info >/dev/null 2>&1 || { echo "Запустите Docker и повторите."; exit 1; }

echo "==> Зависимости сайта"
npm install

echo "==> Локальный бэкенд (первый запуск ~5 мин)"
npx -y supabase@latest start

DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
echo "==> Права доступа и realtime"
docker exec -i "$(docker ps --filter name=supabase_db --format '{{.Names}}' | head -1)" \
  psql -U postgres -d postgres -v ON_ERROR_STOP=0 < selfhost/grants.sql

if [ -f selfhost/data.sql ]; then
  echo "==> Загрузка данных из selfhost/data.sql"
  docker exec -i "$(docker ps --filter name=supabase_db --format '{{.Names}}' | head -1)" \
    psql -U postgres -d postgres -c 'SET session_replication_role = replica' -f - < selfhost/data.sql
fi

echo "==> .env.local для сайта"
ANON=$(npx -y supabase@latest status -o env | grep '^ANON_KEY=' | cut -d= -f2- | tr -d '"')
cat > .env.local <<ENV
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=$ANON
VITE_SUPABASE_PROJECT_ID=local
ENV

echo "==> Серверные функции (в фоне)"
[ -f selfhost/functions.env ] || cp selfhost/functions.env.example selfhost/functions.env
nohup npx -y supabase@latest functions serve --env-file selfhost/functions.env > selfhost/functions.log 2>&1 &

echo "==> Учётки отделов"
sleep 5
curl -s -X POST http://127.0.0.1:54321/functions/v1/create-department-users || true
echo

echo "Готово. Сайт:  npm run dev  ->  http://localhost:8080"
echo "Панель базы:   http://127.0.0.1:54323"
