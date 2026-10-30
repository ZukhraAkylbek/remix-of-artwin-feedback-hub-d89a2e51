#!/usr/bin/env bash
# Выгрузка всех данных (обращения, комментарии, пользователи) из текущей базы.
# Использование: OLD_DB_URL='postgresql://...' ./selfhost/export-data.sh
set -euo pipefail
cd "$(dirname "$0")"
: "${OLD_DB_URL:?Укажите OLD_DB_URL (строка подключения к текущей базе)}"
npx -y supabase@latest db dump --db-url "$OLD_DB_URL" --data-only --use-copy -f data.sql
npx -y supabase@latest db dump --db-url "$OLD_DB_URL" --data-only --use-copy --schema auth -f auth.sql
cat auth.sql >> data.sql && rm auth.sql
echo "Сохранено в selfhost/data.sql — теперь запустите ./selfhost/setup-local.sh"
