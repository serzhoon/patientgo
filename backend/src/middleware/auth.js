// ============================================================
// Упрощённая проверка пользователя (без токенов).
// После входа фронтенд присылает в заголовках, кто он:
//   x-user-id   — номер пользователя
//   x-user-role — роль (patient или admin)
// Здесь мы просто читаем эти заголовки и кладём в req.user.
//
// ВНИМАНИЕ: это учебный, нестрогий способ. В реальном приложении
// так не делают (заголовки можно подделать), но для курсовой
// он нагляден и прост.
// ============================================================

// Требует, чтобы пользователь был "залогинен" (прислал id в заголовке).
function authRequired(req, res, next) {
  const id = req.headers['x-user-id'];
  const role = req.headers['x-user-role'];

  if (!id) {
    return res.status(401).json({ error: 'Требуется вход' });
  }

  req.user = { id: Number(id), role: role || 'patient' };
  next();
}

// Требует роль администратора.
function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ только для администратора' });
  }
  next();
}

module.exports = { authRequired, adminRequired };
