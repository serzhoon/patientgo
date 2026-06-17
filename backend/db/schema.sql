-- ============================================================
-- Схема базы данных для веб-приложения записи пациентов на приём
-- СУБД: MySQL 8.0
-- ============================================================

-- Создаём базу данных, если её ещё нет, и выбираем её.
SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS clinic
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE clinic;

-- ------------------------------------------------------------
-- Таблица пользователей.
-- Хранит и пациентов, и администраторов (регистратуру).
-- Роль различается полем role.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(150) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  phone       VARCHAR(30),
  password    VARCHAR(150) NOT NULL,              -- пароль (учебный проект, хранится как текст)
  role        ENUM('patient', 'admin') NOT NULL DEFAULT 'patient',
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Таблица врачей.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctors (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(150) NOT NULL,
  specialty   VARCHAR(150) NOT NULL,              -- специальность: терапевт, хирург и т.д.
  cabinet     VARCHAR(20),                         -- номер кабинета
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Таблица записей на приём.
-- Одна строка = один приём конкретного пациента к конкретному врачу.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  patient_id   INT NOT NULL,
  doctor_id    INT NOT NULL,
  appdate      DATE NOT NULL,                      -- дата приёма
  apptime      TIME NOT NULL,                      -- время приёма
  status       ENUM('booked', 'cancelled', 'done') NOT NULL DEFAULT 'booked',
  comment      VARCHAR(500),                       -- жалоба / комментарий пациента
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Внешние ключи: связываем записи с пользователями и врачами.
  CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_doctor  FOREIGN KEY (doctor_id)  REFERENCES doctors(id) ON DELETE CASCADE,

  -- Один и тот же врач не может быть занят дважды в одно и то же время.
  UNIQUE KEY uniq_doctor_slot (doctor_id, appdate, apptime)
);

-- ------------------------------------------------------------
-- Демонстрационные данные (чтобы приложение не было пустым).
-- ------------------------------------------------------------

-- Врачи
INSERT INTO doctors (full_name, specialty, cabinet) VALUES
  ('Иванова Анна Сергеевна',   'Терапевт',    '101'),
  ('Петров Михаил Олегович',   'Хирург',      '205'),
  ('Сидорова Елена Павловна',  'Кардиолог',   '310'),
  ('Кузнецов Дмитрий Игоревич','Невролог',    '112');

-- Администратор регистратуры.
-- Логин: admin@clinic.ru   Пароль: admin123
INSERT INTO users (full_name, email, phone, password, role) VALUES
  ('Администратор Регистратуры', 'admin@clinic.ru', '+70000000000', 'admin123', 'admin');
