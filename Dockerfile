# ./ShnurAA_214371_RIOPK_Server/Dockerfile
# Простой Dockerfile для Node.js/TypeScript сервера

# 1. Выбираем базовый образ Node.js (не Alpine, чтобы избежать SSL проблем)
# Можно node:18, node:20 и т.д.
FROM node:18

# 2. Устанавливаем рабочую директорию в контейнере
WORKDIR /usr/src/app

# 3. Копируем package.json и package-lock.json (или yarn.lock)
# Это кэшируется, если файлы не менялись
COPY package*.json ./
# COPY yarn.lock ./ # Если используешь Yarn

# 4. Устанавливаем ВСЕ зависимости (включая devDependencies, так как компиляция тут же)
# Используй 'npm ci' если есть package-lock.json, это надежнее
# RUN npm ci
RUN npm install # Старый добрый install, если с 'ci' проблемы

# 5. Копируем ВЕСЬ остальной код приложения
COPY . .

# 6. Компилируем TypeScript в JavaScript
# Убедись, что скрипт 'build' в package.json выполняет 'tsc' и кладет результат в папку 'dist'
RUN npm run build

# 7. Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV PORT=3001

# 8. Открываем порт (информативно)
EXPOSE ${PORT}

# 9. Запускаем скомпилированное приложение
# Убедись, что 'dist/server.js' - правильный путь к твоему главному файлу
CMD ["node", "dist/server.js"]