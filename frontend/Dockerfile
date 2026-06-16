# Dockerfile для фронтенда.
# Берём лёгкий веб-сервер Nginx и кладём в него файлы сайта.

FROM nginx:alpine

# Удаляем стандартный конфиг Nginx и кладём наш.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем файлы сайта в папку, откуда Nginx их отдаёт.
COPY index.html /usr/share/nginx/html/
COPY config.js  /usr/share/nginx/html/
COPY css        /usr/share/nginx/html/css
COPY js         /usr/share/nginx/html/js

EXPOSE 80
