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
-- Таблица пользователей (пациенты и администраторы).
-- Пациент привязан к поликлинике (clinic_id).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  last_name    VARCHAR(80)  NOT NULL,             -- фамилия
  first_name   VARCHAR(80)  NOT NULL,             -- имя
  middle_name  VARCHAR(80),                        -- отчество (необязательно)
  birth_date   DATE,                               -- дата рождения (для пациентов)
  email        VARCHAR(150) NOT NULL UNIQUE,
  phone        VARCHAR(30),
  password     VARCHAR(150) NOT NULL,              -- пароль (учебный проект, хранится как текст)
  clinic_id    INT,                                -- к какой поликлинике привязан пациент
  doctor_id    INT,                                -- если это аккаунт врача — ссылка на его карточку
  role         ENUM('patient', 'admin', 'doctor') NOT NULL DEFAULT 'patient',
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL,
  CONSTRAINT fk_user_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
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
  status       ENUM('booked', 'cancelled', 'done', 'no_show') NOT NULL DEFAULT 'booked',
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
  ('Администратор', 'Регистратуры', NULL, NULL, 'admin@clinic.ru', '+70000000000', 'admin123', NULL, 'admin');

-- ------------------------------------------------------------
-- Аккаунты врачей (заводит системный администратор).
-- doctor_id ссылается на карточку врача в таблице doctors (id 1..15
-- в порядке вставки выше). Логин: фамилия@clinic.ru, пароль: Фамилия2025.
-- ------------------------------------------------------------
INSERT INTO users (last_name, first_name, middle_name, email, phone, password, doctor_id, role) VALUES
  -- Поликлиника №1
  ('Иванова',  'Анна',    'Сергеевна',   'ivanova@clinic.ru',  NULL, 'Ivanova2025',  1,  'doctor'),
  ('Петров',   'Михаил',  'Олегович',    'petrov@clinic.ru',   NULL, 'Petrov2025',   2,  'doctor'),
  ('Сидорова', 'Елена',   'Павловна',    'sidorova@clinic.ru', NULL, 'Sidorova2025', 3,  'doctor'),
  ('Кузнецов', 'Дмитрий', 'Игоревич',    'kuznetsov@clinic.ru',NULL, 'Kuznetsov2025',4,  'doctor'),
  ('Морозова', 'Ольга',   'Викторовна',  'morozova@clinic.ru', NULL, 'Morozova2025', 5,  'doctor'),
  -- Поликлиника №2
  ('Васильев', 'Андрей',  'Николаевич',  'vasilev@clinic.ru',  NULL, 'Vasilev2025',  6,  'doctor'),
  ('Григорьева','Мария',  'Алексеевна',  'grigoreva@clinic.ru',NULL, 'Grigoreva2025',7,  'doctor'),
  ('Соколов',  'Павел',   'Дмитриевич',  'sokolov@clinic.ru',  NULL, 'Sokolov2025',  8,  'doctor'),
  ('Лебедева', 'Татьяна', 'Сергеевна',   'lebedeva@clinic.ru', NULL, 'Lebedeva2025', 9,  'doctor'),
  ('Новиков',  'Сергей',  'Владимирович','novikov@clinic.ru',  NULL, 'Novikov2025',  10, 'doctor'),
  -- Поликлиника №3
  ('Фёдорова', 'Ирина',   'Анатольевна', 'fedorova@clinic.ru', NULL, 'Fedorova2025', 11, 'doctor'),
  ('Михайлов', 'Виктор',  'Петрович',    'mihaylov@clinic.ru', NULL, 'Mihaylov2025', 12, 'doctor'),
  ('Алексеева','Наталья', 'Игоревна',    'alekseeva@clinic.ru',NULL, 'Alekseeva2025',13, 'doctor'),
  ('Захаров',  'Олег',    'Геннадьевич', 'zaharov@clinic.ru',  NULL, 'Zaharov2025',  14, 'doctor'),
  ('Романова', 'Светлана','Юрьевна',     'romanova@clinic.ru', NULL, 'Romanova2025', 15, 'doctor');
