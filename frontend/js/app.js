// ============================================================
// Логика фронтенда 
// Общается с бэкендом через fetch к API_BASE (см. config.js).
// После входа запоминаем пользователя в памяти страницы и
// присылаем его id и роль в заголовках запросов.
// ============================================================

// --- Функции проверки введённых данных (валидация) ---
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
});

// ============================================================
// Регистрация
// ============================================================
$('registerBtn').addEventListener('click', async () => {
  try {
    // Проверяем введённые данные перед отправкой.
    if (!isValidEmail($('regEmail').value.trim())) {
      return showMsg('registerMsg', 'Введите корректный email (например ivan@mail.ru).', false);
    }
    if (!isValidPhone($('regPhone').value.trim())) {
      return showMsg('registerMsg', 'Телефон должен содержать 11 цифр и начинаться с 7 или 8.', false);
    }
    if (!isValidPassword($('regPassword').value)) {
      return showMsg('registerMsg', 'Пароль: минимум 8 символов, хотя бы одна буква и одна цифра.', false);
    }

    await api('/auth/register', 'POST', {
      full_name: $('regName').value.trim(),
      email: $('regEmail').value.trim(),
      phone: $('regPhone').value.trim(),
      password: $('regPassword').value
    });
    showMsg('registerMsg', 'Регистрация успешна! Теперь войдите.', true);
  } catch (e) {
    showMsg('registerMsg', e.message, false);
  }
});
// Кнопка "Войти через Госуслуги" — демонстрационная, функция не реализована
$('gosuslugiBtn').addEventListener('click', () => {
  showMsg('loginMsg', 'Вход через Госуслуги: функция находится в разработке.', false);
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

  const roleText = currentUser.role === 'admin' ? 'регистратура' : 'пациент';
  $('userInfo').textContent = `${currentUser.full_name} (${roleText})`;

  // Админу не нужна форма записи — он только смотрит все записи.
  if (currentUser.role === 'admin') {
    $('bookingCard').classList.add('hidden');
    $('apptTitle').textContent = 'Все записи пациентов';
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
  const doctors = await api('/doctors');
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

  // Заголовок таблицы (для админа добавляем колонку пациента).
  let html = '<table><thead><tr>';
  html += '<th>Дата</th><th>Время</th><th>Врач</th>';
  if (isAdmin) html += '<th>Пациент</th>';
  html += '<th>Статус</th><th></th></tr></thead><tbody>';

  list.forEach(a => {
    const dateStr = formatDate(a.appdate);
    const timeStr = (a.apptime || '').slice(0, 5);
    const statusText = { booked: 'активна', cancelled: 'отменена', done: 'завершена' }[a.status] || a.status;

    html += '<tr>';
    html += `<td>${dateStr}</td>`;
    html += `<td>${timeStr}</td>`;
    html += `<td>${a.doctor_name} <small style="color:var(--muted)">(${a.specialty})</small></td>`;
    if (isAdmin) html += `<td>${a.patient_name || ''}<br><small style="color:var(--muted)">${a.patient_phone || ''}</small></td>`;
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
