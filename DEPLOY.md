# Развёртывание
 
Приложение состоит из трёх контейнеров Docker (Nginx + фронтенд, бэкенд на
Node.js, база данных MySQL) и разворачивается на сервере с Docker одной командой.
 
## Требования
 
- Сервер с Linux (проект развёрнут на Ubuntu 22.04, SberCloud).
- Установленные Docker и Docker Compose.
- Открытый порт 80 (веб-интерфейс).
## Установка Docker (если не установлен)
 
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo systemctl enable --now docker
```
 
## Запуск
 
Склонировать репозиторий и поднять контейнеры:
 
```bash
git clone https://github.com/serzhoon/patientgo.git
cd patientgo
sudo docker compose up --build -d
```
 
При первом запуске база данных, таблицы и начальные данные создаются
автоматически из файла `backend/db/schema.sql`.
 
После старта приложение доступно в браузере по адресу сервера:
 
```
http://АДРЕС_СЕРВЕРА
```
 
## Проверка состояния
 
```bash
sudo docker compose ps          # список запущенных контейнеров
sudo docker compose logs -f     # просмотр логов
```
 
## Обновление версии
 
```bash
git pull
sudo docker compose up --build -d
```
 
## Полное пересоздание базы данных
 
Если изменилась структура базы (например, схема таблиц), нужно пересоздать
тома, иначе изменения не применятся:
 
```bash
sudo docker compose down -v
sudo docker compose up --build -d
```
 
## Остановка
 
```bash
sudo docker compose down
```
