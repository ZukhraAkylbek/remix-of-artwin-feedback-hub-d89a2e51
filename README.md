# ARTWIN Feedback

## Локальный запуск (весь проект на своём компьютере)

Нужно: **Docker** (запущен) и **Node.js 20+**. На Windows — через WSL.

```bash
git clone <репозиторий> && cd <папка>
./selfhost/setup-local.sh   # ставит всё, поднимает базу, функции, создаёт учётки отделов
npm run dev                 # сайт: http://localhost:8080
```

Панель базы: http://127.0.0.1:54323

### Перенести реальные данные
```bash
OLD_DB_URL='postgresql://postgres:<пароль>@<хост>:5432/postgres' ./selfhost/export-data.sh
npx supabase db reset && ./selfhost/setup-local.sh
```

### Настройки
- `.env.local` — адрес базы и публичный ключ для сайта (создаётся скриптом).
- `selfhost/functions.env` — секреты функций. Шаблон: `selfhost/functions.env.example`. Сюда вписывается ключ для голосового ввода (`OPENAI_API_KEY` на своём сервере): файл подхватывается автоматически при запуске `setup-local.sh`, пока ключ пуст — голосовой ввод просто выключен.
- Ссылки Google Таблиц и Bitrix24 задаются в админке → Настройки отдела.

Полная инструкция для сервера: `self-hosting-guide.md` (в Files).
