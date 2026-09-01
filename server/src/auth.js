const jwt = require('jsonwebtoken');
const config = require('./config');
const { ApiError } = require('./util');

function signTokens(user) {
  const payload = { id: user.id, role: user.role };
  const access = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: `${config.jwt.accessMinutes}m`,
  });
  const refresh = jwt.sign({ id: user.id, role: user.role, t: 'r' }, config.jwt.refreshSecret, {
    expiresIn: `${config.jwt.refreshDays}d`,
  });
  return { access, refresh };
}

function setAuthCookies(res, tokens) {
  const common = {
    httpOnly: true,
    secure: config.jwt.cookieSecure,
    sameSite: 'lax',
    path: '/',
  };
  res.cookie('nf_access', tokens.access, {
    ...common,
    maxAge: config.jwt.accessMinutes * 60 * 1000,
  });
  res.cookie('nf_refresh', tokens.refresh, {
    ...common,
    maxAge: config.jwt.refreshDays * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res) {
  res.clearCookie('nf_access', { path: '/' });
  res.clearCookie('nf_refresh', { path: '/' });
}

function verifyAccess(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

function verifyRefresh(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

function readToken(req) {
  const h = req.headers.authorization;
  if (h && h.startsWith('Bearer ')) return h.slice(7);
  if (req.cookies && req.cookies.nf_access) return req.cookies.nf_access;
  return null;
}

function optionalAuth(req, _res, next) {
  const token = readToken(req);
  if (!token) return next();
  try {
    req.user = verifyAccess(token);
  } catch {
    /* invalid/expired -> treat as guest */
  }
  next();
}

function authRequired(req, res, next) {
  const token = readToken(req);
  if (!token) return next(new ApiError(401, 'Please sign in to continue.'));
  try {
    req.user = verifyAccess(token);
    next();
  } catch {
    next(new ApiError(401, 'Your session has expired. Please sign in again.'));
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return next(new ApiError(401, 'Please sign in to continue.'));
  if (req.user.role !== 'admin') return next(new ApiError(403, 'Admins only'));
  next();
}

module.exports = {
  signTokens,
  setAuthCookies,
  clearAuthCookies,
  verifyAccess,
  verifyRefresh,
  optionalAuth,
  authRequired,
  requireAdmin,
};