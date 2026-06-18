// ============================================================
// Логика фронтенда 
// Общается с бэкендом через fetch к API_BASE (см. config.js).
// После входа запоминаем пользователя в памяти страницы и
// присылаем его id и роль в заголовках запросов.
// ============================================================

// Функции проверки введённых данных (валидация)  
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidPassword(pwd) {
  return pwd.length >= 8 && /[a-zA-Zа-яА-Я]/.test(pwd) && /[0-9]/.test(pwd);
}
function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 11 && (digits[0] === '7' || digits[0] === '8');
}

// Функция проверки ФИО
function isValidName(name) {
  const trimmed = name.trim();
  if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/).filter(w => w.length >= 2);
  return words.length >= 2;
}

// Текущий вошедший пользователь (в памяти страницы).
let currentUser = null;

// Короткая функция поиска элемента по id.
const $ = (id) => document.getElementById(id);

//  Универсальный запрос к API 
async function api(path, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };

  // Если пользователь вошёл — сообщаем серверу, кто он.
 if (currentUser) {
    headers['x-user-id'] = currentUser.id;
    headers['x-user-role'] = currentUser.role;
    if (currentUser.doctor_id) {
      headers['x-doctor-id'] = currentUser.doctor_id;
    }
  }

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Ошибка запроса');
  }
  return data;
}

// --- Показать сообщение ---
function showMsg(elId, text, ok) {
  const el = $(elId);
  el.textContent = text;
  el.className = 'message ' + (ok ? 'ok' : 'error');
}

// ============================================================
// Переключение вкладок вход / регистрация
// ============================================================
$('tabLogin').addEventListener('click', () => {
  $('tabLogin').classList.add('active');
  $('tabRegister').classList.remove('active');
  $('loginForm').classList.remove('hidden');
  $('registerForm').classList.add('hidden');
});
$('tabRegister').addEventListener('click', () => {
  $('tabRegister').classList.add('active');
  $('tabLogin').classList.remove('active');
  $('registerForm').classList.remove('hidden');
  $('loginForm').classList.add('hidden');
   loadCitiesAndClinics();
});

// Загружаем города и поликлиники для формы регистрации (один раз).
let clinicsLoaded = false;
async function loadCitiesAndClinics() {
  if (clinicsLoaded) return;
  try {
    // Города
    const cities = await api('/cities');
    const citySelect = $('regCity');
    citySelect.innerHTML = '';
    cities.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      citySelect.appendChild(opt);
    });

    // Поликлиники выбранного города
    await loadClinicsForCity();

    // При смене города — перезагрузить поликлиники
    citySelect.addEventListener('change', loadClinicsForCity);

    clinicsLoaded = true;
  } catch (e) {
    showMsg('registerMsg', 'Не удалось загрузить список поликлиник.', false);
  }
}

async function loadClinicsForCity() {
  const cityId = $('regCity').value;
  const clinics = await api('/clinics?city_id=' + cityId);
  const clinicSelect = $('regClinic');
  clinicSelect.innerHTML = '';
  clinics.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    clinicSelect.appendChild(opt);
  });
}

// ============================================================
// Регистрация
// ============================================================
$('registerBtn').addEventListener('click', async () => {
  try {
    const lastName = $('regLastName').value.trim();
    const firstName = $('regFirstName').value.trim();
    const middleName = $('regMiddleName').value.trim();

    // Проверка фамилии и имени (только буквы, минимум 2 символа).
    const namePattern = /^[a-zA-Zа-яА-ЯёЁ-]{2,}$/;
    if (!namePattern.test(lastName)) {
      return showMsg('registerMsg', 'Введите корректную фамилию (только буквы).', false);
    }
    if (!namePattern.test(firstName)) {
      return showMsg('registerMsg', 'Введите корректное имя (только буквы).', false);
    }
    // Отчество необязательно, но если введено — тоже только буквы.
    if (middleName && !namePattern.test(middleName)) {
      return showMsg('registerMsg', 'Отчество должно содержать только буквы.', false);
    }
    if (!$('regBirthDate').value) {
      return showMsg('registerMsg', 'Укажите дату рождения.', false);
    }
    if (!isValidEmail($('regEmail').value.trim())) {
      return showMsg('registerMsg', 'Введите корректный email (например ivan@mail.ru).', false);
    }
    if (!isValidPhone($('regPhone').value.trim())) {
      return showMsg('registerMsg', 'Введите телефон полностью: +7 (___) ___-__-__', false);
    }
    if (!isValidPassword($('regPassword').value)) {
      return showMsg('registerMsg', 'Пароль: минимум 8 символов, хотя бы одна буква и одна цифра.', false);
    }
    // Проверка галочки согласия.
    if (!$('regConsent').checked) {
      return showMsg('registerMsg', 'Необходимо согласие на обработку персональных данных.', false);
    }

    await api('/auth/register', 'POST', {
      last_name: lastName,
      first_name: firstName,
      middle_name: middleName,
      birth_date: $('regBirthDate').value,
      email: $('regEmail').value.trim(),
      phone: $('regPhone').value.trim(),
      password: $('regPassword').value,
      clinic_id: $('regClinic').value
    });
    showMsg('registerMsg', 'Регистрация успешна! Теперь войдите.', true);
  } catch (e) {
    showMsg('registerMsg', e.message, false);
  }
});
// Кнопка "Войти через Госуслуги" — демонстрационная, функция не реализована
$('gosuslugiBtn').addEventListener('click', () => {
  showMsg('loginMsg', 'Функция находится в разработке.', false);
});
// ============================================================
// Вход
// ============================================================
$('loginBtn').addEventListener('click', async () => {
  try {
    const data = await api('/auth/login', 'POST', {
      email: $('loginEmail').value.trim(),
      password: $('loginPassword').value
    });
    currentUser = data.user;
    enterApp();
  } catch (e) {
    showMsg('loginMsg', e.message, false);
  }
});

// ============================================================
// Выход
// ============================================================
$('logoutBtn').addEventListener('click', () => {
  currentUser = null;
  $('appSection').classList.add('hidden');
  $('authSection').classList.remove('hidden');
  $('logoutBtn').classList.add('hidden');
  $('userInfo').textContent = '';
});

// ============================================================
// Вход в приложение после авторизации
// ============================================================
async function enterApp() {
  $('authSection').classList.add('hidden');
  $('appSection').classList.remove('hidden');
  $('logoutBtn').classList.remove('hidden');

  const roleText = currentUser.role === 'admin' ? 'регистратура'
                 : currentUser.role === 'doctor' ? 'врач'
                 : 'пациент';
  $('userInfo').textContent = `${currentUser.full_name} (${roleText})`;

  // Распределяем, что показывать по ролям.
  if (currentUser.role === 'admin') {
    $('bookingCard').classList.add('hidden');
    $('apptTitle').textContent = 'Все записи пациентов';
  } else if (currentUser.role === 'doctor') {
    $('bookingCard').classList.add('hidden');
    $('apptTitle').textContent = 'Записи на приём ко мне';
  } else {
    $('bookingCard').classList.remove('hidden');
    $('apptTitle').textContent = 'Мои записи';
    await loadDoctors();
  }

  await loadAppointments();
}

// ============================================================
// Загрузка списка врачей в выпадающий список
// ============================================================
async function loadDoctors() {
  const doctors = await api('/doctors?clinic_id=' + currentUser.clinic_id);
  const select = $('doctorSelect');
  select.innerHTML = '';
  doctors.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = `${d.full_name} — ${d.specialty} (каб. ${d.cabinet || '—'})`;
    select.appendChild(opt);
  });
}

// ============================================================
// Создание записи на приём
// ============================================================
$('bookBtn').addEventListener('click', async () => {
  try {
    await api('/appointments', 'POST', {
      doctor_id: $('doctorSelect').value,
      appdate: $('appdate').value,
      apptime: $('apptime').value,
      comment: $('comment').value.trim()
    });
    showMsg('bookMsg', 'Вы успешно записаны!', true);
    $('comment').value = '';
    await loadAppointments();
  } catch (e) {
    showMsg('bookMsg', e.message, false);
  }
});

// ============================================================
// Загрузка и отрисовка списка записей
// ============================================================
async function loadAppointments() {
  const list = await api('/appointments');
  const container = $('apptList');

  if (list.length === 0) {
    container.innerHTML = '<p class="empty">Записей пока нет.</p>';
    return;
  }

  const isAdmin = currentUser.role === 'admin';
  const isDoctor = currentUser.role === 'doctor';
  const showPatient = isAdmin || isDoctor;

  // Заголовок таблицы (для админа добавляем колонку пациента).
  let html = '<table><thead><tr>';
  html += '<th>Дата</th><th>Время</th><th>Врач</th>';
  if (showPatient) html += '<th>Пациент</th>';
  html += '<th>Статус</th><th></th></tr></thead><tbody>';

  list.forEach(a => {
    const dateStr = formatDate(a.appdate);
    const timeStr = (a.apptime || '').slice(0, 5);
    const statusText = { booked: 'активна', cancelled: 'отменена', done: 'завершена' }[a.status] || a.status;

    html += '<tr>';
    html += `<td>${dateStr}</td>`;
    html += `<td>${timeStr}</td>`;
    html += `<td>${a.doctor_name} <small style="color:var(--muted)">(${a.specialty})</small></td>`;
    if (showPatient) html += `<td>${a.patient_name || ''}<br><small style="color:var(--muted)">${a.patient_phone || ''}</small></td>`;
    html += `<td><span class="badge ${a.status}">${statusText}</span></td>`;

    // Кнопку отмены показываем только для активных записей.
    if (a.status === 'booked') {
      html += `<td><button class="btn-danger" data-cancel="${a.id}">Отменить</button></td>`;
    } else {
      html += '<td></td>';
    }
    html += '</tr>';
  });

  html += '</tbody></table>';
  container.innerHTML = html;

  // Навешиваем обработчики на кнопки отмены.
  container.querySelectorAll('[data-cancel]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Отменить эту запись?')) return;
      try {
        await api('/appointments/' + btn.dataset.cancel + '/cancel', 'PATCH');
        await loadAppointments();
      } catch (e) {
        alert(e.message);
      }
    });
  });
}

// Преобразование даты из формата БД (2025-06-20T00:00:00...) в ДД.ММ.ГГГГ.
function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date)) return d;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${date.getFullYear()}`;
}

// Минимальная дата записи — сегодня (нельзя записаться в прошлое).
$('appdate').min = new Date().toISOString().split('T')[0];

// ============================================================
// Модальное окно "Забыли пароль" (демонстрационное)
// ============================================================

// Открыть окно по клику на ссылку.
$('forgotLink').addEventListener('click', (e) => {
  e.preventDefault();
  $('forgotModal').classList.remove('hidden');
});

// Закрыть окно крестиком.
$('forgotClose').addEventListener('click', () => {
  $('forgotModal').classList.add('hidden');
  $('forgotMsg').className = 'message';
});

// Закрыть окно кликом по затемнённому фону (но не по самому окну).
$('forgotModal').addEventListener('click', (e) => {
  if (e.target.id === 'forgotModal') {
    $('forgotModal').classList.add('hidden');
    $('forgotMsg').className = 'message';
  }
});

// Кнопка "Восстановить" — функция демонстрационная.
$('forgotSubmit').addEventListener('click', () => {
  const val = $('forgotInput').value.trim();
  if (!val) {
    return showMsg('forgotMsg', 'Введите email.', false);
  }
  showMsg('forgotMsg', 'Функция находится в разработке.', false);
});

// ============================================================
// Маска телефона: +7 (___) ___-__-__
// ============================================================
function formatPhone(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.length > 0) {
    if (digits[0] === '8') digits = '7' + digits.slice(1);
    else if (digits[0] !== '7') digits = '7' + digits;
  }
  digits = digits.slice(0, 11);

  let result = '+7';
  if (digits.length > 1) result += ' (' + digits.slice(1, 4);
  if (digits.length >= 4) result += ') ' + digits.slice(4, 7);
  if (digits.length >= 7) result += '-' + digits.slice(7, 9);
  if (digits.length >= 9) result += '-' + digits.slice(9, 11);
  return result;
}

// Применяем маску, пока пользователь печатает в поле телефона.
$('regPhone').addEventListener('input', (e) => {
  e.target.value = formatPhone(e.target.value);
});
