# 3D Artist Portfolio

Персональное двуязычное портфолио 3D-художника на Next.js 16. Русская версия доступна по `/ru`, английская — по `/`.

## Локальная разработка

```bash
npm install
npm run dev
```

Сайт: `http://localhost:3000`

Локальная админка: `http://localhost:3000/admin`

Админка намеренно доступна только в development-режиме. Она сохраняет проекты, изображения, GLB, ссылки YouTube и информацию «Обо мне» в исходные файлы проекта. После редактирования контента production-сайт нужно опубликовать заново.

## Проверка перед публикацией

```bash
npm run lint
npm run build
```

## Публикация на Vercel

Первый preview можно создать прямо из папки проекта:

```bash
npx vercel@latest
```

После проверки preview:

```bash
npx vercel@latest --prod
```

На Vercel канонический адрес определяется автоматически через `VERCEL_PROJECT_PRODUCTION_URL`. Для собственного домена можно дополнительно установить `NEXT_PUBLIC_SITE_URL=https://example.com` и выполнить повторную публикацию.
