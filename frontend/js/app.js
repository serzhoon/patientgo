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
// Считает полный возраст по дате рождения и проверяет границы 18..120.
function isValidAge(birthDate) {
  if (!birthDate) return false;
  const today = new Date();
  const bd = new Date(birthDate);
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age >= 18 && age <= 120;
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
    if (!isValidAge($('regBirthDate').value)) {
      return showMsg('registerMsg', 'Регистрация доступна с 18 лет (и не старше 120).', false);
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
     showModal('Регистрация успешна! Сейчас вы перейдёте на страницу входа.', () => {
      resetUiState();
      $('tabLogin').click();
    });
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
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
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
  localStorage.removeItem('currentUser');
  $('appSection').classList.add('hidden');
  $('authSection').classList.remove('hidden');
  $('logoutBtn').classList.add('hidden');
  $('userInfo').textContent = '';
  resetUiState();
});

// ============================================================
// Вход в приложение после авторизации
// ============================================================
async function enterApp() {
  $('authSection').classList.add('hidden');
  $('appSection').classList.remove('hidden');
  $('logoutBtn').classList.remove('hidden');
  $('bookMsg').className = 'message';

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
  select.innerHTML = '<option value="">Выберите врача</option>';
  doctors.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = `${d.full_name} — ${d.specialty} (каб. ${d.cabinet || '—'})`;
    select.appendChild(opt);
  });
}
// Загрузка свободных слотов времени для выбранного врача и даты.
async function loadFreeSlots() {
  const doctorId = $('doctorSelect').value;
  const date = $('appdate').value;
  const timeSelect = $('apptime');

  // Пока не выбраны врач и дата — список пуст.
  if (!doctorId || !date) {
    timeSelect.innerHTML = '<option value="">Сначала выберите врача и дату</option>';
    return;
  }

  // Проверка на выходной.
  const day = new Date(date).getDay(); // 0 = воскресенье, 6 = суббота
  if (day === 0 || day === 6) {
    timeSelect.innerHTML = '<option value="">Запись только в будни</option>';
    showModal('Запись возможна только в будние дни.');
    $('appdate').value = '';
    return;
  }

  try {
    const slots = await api('/appointments/free-slots?doctor_id=' + doctorId + '&appdate=' + date);
    if (slots.length === 0) {
      timeSelect.innerHTML = '<option value="">Свободного времени нет</option>';
    } else {
      timeSelect.innerHTML = '<option value="">Выберите время</option>';
      slots.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        timeSelect.appendChild(opt);
      });
    }
  } catch (e) {
    showModal(e.message);
  }
}

// При смене врача или даты — обновляем свободное время.
$('doctorSelect').addEventListener('change', loadFreeSlots);
$('appdate').addEventListener('change', loadFreeSlots);

// ============================================================
// Создание записи на приём
// ============================================================
$('bookBtn').addEventListener('click', async () => {
 try {
    if (!$('doctorSelect').value) {
      return showModal('Выберите врача.');
    }
    if (!$('appdate').value) {
      return showModal('Выберите дату.');
    }
    if (!$('apptime').value) {
      return showModal('Выберите время.');
    }
    await api('/appointments', 'POST', {
      doctor_id: $('doctorSelect').value,
      appdate: $('appdate').value,
      apptime: $('apptime').value,
      comment: $('comment').value.trim()
    });
    $('doctorSelect').selectedIndex = 0;
    $('appdate').value = '';
    $('apptime').selectedIndex = 0;
    $('comment').value = '';
    $('bookMsg').className = 'message';
    await loadAppointments();
    showModal('Вы успешно записаны на приём!');
  } catch (e) {
    showMsg('bookMsg', e.message, false);
  }
});

// ============================================================
// Загрузка и отрисовка списка записей
// ============================================================
// Состояние поиска/сортировки и последний полученный список (чтобы фильтровать без перезапроса).
let apptSearch = '';
let apptSortNewFirst = false;
let apptCache = [];

// Загружает записи с сервера и запоминает их, затем отрисовывает.
async function loadAppointments() {
  apptCache = await api('/appointments');
  renderAppointments();
}

// Отрисовывает записи из кэша с учётом поиска и сортировки (без обращения к серверу).
function renderAppointments() {
  const container = $('apptList');
  const isAdmin = currentUser.role === 'admin';
  const isDoctor = currentUser.role === 'doctor';
  const showPatient = isAdmin || isDoctor;
  const showControls = isAdmin || isDoctor;

  if (apptCache.length === 0) {
    container.innerHTML = '<p class="empty">Записей пока нет.</p>';
    return;
  }

  let rows = apptCache.slice();
  if (showControls && apptSearch.trim()) {
    const q = apptSearch.trim().toLowerCase();
    rows = rows.filter(a =>
      (a.patient_name || '').toLowerCase().includes(q) ||
      (a.patient_phone || '').toLowerCase().includes(q)
    );
  }

  rows.sort((a, b) => {
    const da = (a.appdate || '') + (a.apptime || '');
    const db = (b.appdate || '') + (b.apptime || '');
    return apptSortNewFirst ? db.localeCompare(da) : da.localeCompare(db);
  });

  let html = '';
  if (showControls) {
    html += '<div class="appt-controls">';
    html += `<input type="text" id="apptSearchInput" placeholder="Поиск по ФИО или телефону" value="${apptSearch.replace(/"/g, '&quot;')}">`;
    html += `<button class="btn-sort" id="apptSortBtn">${apptSortNewFirst ? 'Сначала новые' : 'Сначала старые'}</button>`;
    html += '</div>';
  }

  if (rows.length === 0) {
    html += '<p class="empty">Ничего не найдено.</p>';
  } else {
    html += '<table><thead><tr>';
    html += '<th>Дата</th><th>Время</th><th>' + (isDoctor ? 'Симптомы' : 'Врач') + '</th>';
    if (showPatient) html += '<th>Пациент</th>';
    if (isAdmin) html += '<th>Симптомы</th><th>Записан</th>';
    html += '<th>Статус</th><th></th></tr></thead><tbody>';
    rows.forEach(a => {
      const dateStr = formatDate(a.appdate);
      const timeStr = (a.apptime || '').slice(0, 5);
      const statusText = { booked: 'активна', cancelled: 'отменена', done: 'завершена', no_show: 'неявка' }[a.status] || a.status;
      html += '<tr>';
      html += `<td>${dateStr}</td>`;
      html += `<td>${timeStr}</td>`;
      if (isDoctor) {
        const symptoms = (a.comment && a.comment.trim()) ? a.comment : '<span style="color:var(--muted)">Симптомы не указаны</span>';
        html += `<td>${symptoms}</td>`;
      } else {
        html += `<td>${a.doctor_name} <small style="color:var(--muted)">(${a.specialty})</small></td>`;
      }
      if (showPatient) html += `<td>${a.patient_name || ''}<br><small style="color:var(--muted)">${a.patient_phone || ''}</small></td>`;
      if (isAdmin) {
        const symptoms = (a.comment && a.comment.trim()) ? a.comment : '<span style="color:var(--muted)">не указаны</span>';
        html += `<td>${symptoms}</td>`;
        html += `<td><small>${formatDateTime(a.created_at)}</small></td>`;
      }
      html += `<td><span class="badge ${a.status}">${statusText}</span></td>`;
      if (a.status === 'booked' && isDoctor) {
        html += `<td>
          <button class="btn-primary" style="margin-top:0;width:auto;padding:6px 12px;font-size:13px;margin-right:6px;" data-complete="${a.id}">Приём состоялся</button>
          <button class="btn-danger" style="padding:6px 12px;font-size:13px;" data-noshow="${a.id}">Пациент не явился</button>
        </td>`;
      } else if (a.status === 'booked') {
        html += `<td><button class="btn-danger" data-cancel="${a.id}">Отменить</button></td>`;
      } else {
        html += '<td></td>';
      }
      html += '</tr>';
    });
    html += '</tbody></table>';
  }

  container.innerHTML = html;

  const input = document.getElementById('apptSearchInput');
  if (input) {
    input.addEventListener('input', (e) => {
      apptSearch = e.target.value;
      const pos = e.target.selectionStart;
      renderAppointments();
      const again = document.getElementById('apptSearchInput');
      if (again) { again.focus(); again.setSelectionRange(pos, pos); }
    });
  }

  const sortBtn = document.getElementById('apptSortBtn');
  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      apptSortNewFirst = !apptSortNewFirst;
      renderAppointments();
    });
  }

  container.querySelectorAll('[data-cancel]').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (!await showConfirm('Отменить эту запись?')) return;
      try {
        await api('/appointments/' + btn.dataset.cancel + '/cancel', 'PATCH');
        await loadAppointments();
      } catch (e) {
         showModal(e.message);
      }
    });
  });

  container.querySelectorAll('[data-complete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!await showConfirm('Отметить, что приём состоялся?')) return;
      try {
        await api('/appointments/' + btn.dataset.complete + '/complete', 'PATCH');
        await loadAppointments();
      } catch (e) {
         showModal(e.message);
      }
    });
  });

  container.querySelectorAll('[data-noshow]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!await showConfirm('Отметить, что пациент не явился?')) return;
      try {
        await api('/appointments/' + btn.dataset.noshow + '/noshow', 'PATCH');
        await loadAppointments();
      } catch (e) {
         showModal(e.message);
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

// Дата и время (для столбца "Записан"): ДД.ММ.ГГГГ ЧЧ:ММ
function formatDateTime(d) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date)) return d;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${date.getFullYear()} ${hh}:${mi}`;
}
// Минимальная дата записи — сегодня (нельзя записаться в прошлое).
// Дата записи: от сегодня до +14 дней.
(function () {
  const today = new Date();
  const max = new Date();
  max.setDate(today.getDate() + 14);
  $('appdate').min = today.toISOString().split('T')[0];
  $('appdate').max = max.toISOString().split('T')[0];
})();

// Дата рождения: от 120 лет назад (min) до 18 лет назад (max).
(function () {
  const today = new Date();
  const maxBirth = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const minBirth = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
  $('regBirthDate').min = minBirth.toISOString().split('T')[0];
  $('regBirthDate').max = maxBirth.toISOString().split('T')[0];
})();

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
// ============================================================
// Универсальные модальные окна (заменяют alert и confirm).
// ============================================================

// Уведомление с кнопкой ОК. onOk — что сделать после нажатия (необязательно).
function showModal(message, onOk) {
  const overlay = $('uiModal');
  $('uiModalText').textContent = message;
  $('uiModalCancel').style.display = 'none';
  const okBtn = $('uiModalOk');
  okBtn.textContent = 'ОК';
  overlay.classList.remove('hidden');
  okBtn.onclick = () => {
    overlay.classList.add('hidden');
    if (typeof onOk === 'function') onOk();
  };
}

// Подтверждение (Да / Отмена). Возвращает промис: true если "Да".
function showConfirm(message) {
  return new Promise((resolve) => {
    const overlay = $('uiModal');
    $('uiModalText').textContent = message;
    const cancelBtn = $('uiModalCancel');
    cancelBtn.style.display = '';
    const okBtn = $('uiModalOk');
    okBtn.textContent = 'Да';
    overlay.classList.remove('hidden');
    okBtn.onclick = () => { overlay.classList.add('hidden'); resolve(true); };
    cancelBtn.onclick = () => { overlay.classList.add('hidden'); resolve(false); };
  });
}
// ============================================================
// Очистка полей форм входа и регистрации.
// ============================================================
// ============================================================
// Полный сброс пользовательского состояния (при входе/выходе).
// ============================================================
function resetUiState() {
  // Поля входа.
  $('loginEmail').value = '';
  $('loginPassword').value = '';
  $('loginMsg').className = 'message';

  // Поля регистрации.
  ['regLastName', 'regFirstName', 'regMiddleName', 'regBirthDate',
   'regEmail', 'regPhone', 'regPassword'].forEach(id => {
    const el = $(id);
    if (el) el.value = '';
  });
  $('regConsent').checked = false;
  $('registerMsg').className = 'message';

  // Форма записи на приём.
  const doctorSel = $('doctorSelect');
  if (doctorSel) doctorSel.selectedIndex = 0;
  $('appdate').value = '';
  $('apptime').selectedIndex = 0;
  const comment = $('comment');
  if (comment) comment.value = '';
  $('bookMsg').className = 'message';

  // Окно "Забыли пароль".
  const forgotInput = $('forgotInput');
  if (forgotInput) forgotInput.value = '';
  $('forgotMsg').className = 'message';

  // Поиск и сортировка списка записей.
  apptSearch = '';
  apptSortNewFirst = false;
}
// ============================================================
// Восстановление входа при обновлении страницы.
// ============================================================
(function () {
  const saved = localStorage.getItem('currentUser');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      enterApp();
    } catch (e) {
      localStorage.removeItem('currentUser');
    }
  }
})();
