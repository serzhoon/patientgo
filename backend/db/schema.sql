-- ============================================================
-- Схема базы данных для веб-приложения записи пациентов на приём
-- СУБД: MySQL 8.0
-- ============================================================

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS clinic
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE clinic;

-- ------------------------------------------------------------
-- Таблица городов.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cities (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(100) NOT NULL
);

-- ------------------------------------------------------------
-- Таблица поликлиник. Каждая привязана к городу.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinics (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  city_id  INT NOT NULL,
  name     VARCHAR(200) NOT NULL,
  CONSTRAINT fk_clinic_city FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Таблица пользователей (пациенты и администраторы).
-- Пациент привязан к поликлинике (clinic_id).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  last_name    VARCHAR(80)  NOT NULL,             -- фамилия
  first_name   VARCHAR(80)  NOT NULL,             -- имя
  middle_name  VARCHAR(80),                        -- отчество (необязательно)
  birth_date   DATE         NOT NULL,             -- дата рождения
  email        VARCHAR(150) NOT NULL UNIQUE,
  phone        VARCHAR(30),
  password     VARCHAR(150) NOT NULL,              -- пароль (учебный проект, хранится как текст)
  clinic_id    INT,                                -- к какой поликлинике привязан пациент
  role         ENUM('patient', 'admin') NOT NULL DEFAULT 'patient',
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Таблица врачей. Каждый врач привязан к поликлинике.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctors (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id   INT NOT NULL,                        -- в какой поликлинике принимает
  full_name   VARCHAR(150) NOT NULL,
  specialty   VARCHAR(150) NOT NULL,
  cabinet     VARCHAR(20),
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doctor_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Таблица записей на приём.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  patient_id   INT NOT NULL,
  doctor_id    INT NOT NULL,
  appdate      DATE NOT NULL,
  apptime      TIME NOT NULL,
  status       ENUM('booked', 'cancelled', 'done') NOT NULL DEFAULT 'booked',
  comment      VARCHAR(500),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_doctor  FOREIGN KEY (doctor_id)  REFERENCES doctors(id) ON DELETE CASCADE
);

-- ============================================================
-- Демонстрационные данные
-- ============================================================

-- Город
INSERT INTO cities (id, name) VALUES (1, 'г. Ставрополь');

-- Поликлиники
INSERT INTO clinics (id, city_id, name) VALUES
  (1, 1, 'ГАУЗ СК "Городская поликлиника № 3"'),
  (2, 1, 'ГБУЗ СК "Городская клиническая поликлиника №6"'),
  (3, 1, 'ГБУЗ СК "Ставропольский краевой клинический многопрофильный центр"');

-- Врачи поликлиники №1 (ГАУЗ СК "Городская поликлиника № 3")
INSERT INTO doctors (clinic_id, full_name, specialty, cabinet) VALUES
  (1, 'Иванова Анна Сергеевна',     'Терапевт',     '101'),
  (1, 'Петров Михаил Олегович',     'Хирург',       '102'),
  (1, 'Сидорова Елена Павловна',    'Кардиолог',    '103'),
  (1, 'Кузнецов Дмитрий Игоревич',  'Невролог',     '104'),
  (1, 'Морозова Ольга Викторовна',  'Офтальмолог',  '105');

-- Врачи поликлиники №2 (ГБУЗ СК "Городская клиническая поликлиника №6")
INSERT INTO doctors (clinic_id, full_name, specialty, cabinet) VALUES
  (2, 'Васильев Андрей Николаевич', 'Терапевт',     '201'),
  (2, 'Григорьева Мария Алексеевна','Эндокринолог', '202'),
  (2, 'Соколов Павел Дмитриевич',   'Травматолог',  '203'),
  (2, 'Лебедева Татьяна Сергеевна', 'Дерматолог',   '204'),
  (2, 'Новиков Сергей Владимирович','Уролог',       '205');

-- Врачи поликлиники №3 (Ставропольский краевой клинический многопрофильный центр)
INSERT INTO doctors (clinic_id, full_name, specialty, cabinet) VALUES
  (3, 'Фёдорова Ирина Анатольевна', 'Терапевт',         '301'),
  (3, 'Михайлов Виктор Петрович',   'Кардиохирург',     '302'),
  (3, 'Алексеева Наталья Игоревна', 'Гастроэнтеролог',  '303'),
  (3, 'Захаров Олег Геннадьевич',   'Онколог',          '304'),
  (3, 'Романова Светлана Юрьевна',  'Пульмонолог',      '305');

-- Администратор регистратуры. Логин: admin@clinic.ru   Пароль: admin123
INSERT INTO users (last_name, first_name, middle_name, birth_date, email, phone, password, clinic_id, role) VALUES
  ('Администратор', 'Регистратуры', NULL, '1990-01-01', 'admin@clinic.ru', '+70000000000', 'admin123', NULL, 'admin');
