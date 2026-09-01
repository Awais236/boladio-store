let accessToken = null;

export function setAccessToken(t) {
  accessToken = t;
}
export function getAccessToken() {
  return accessToken;
}

export async function api(path, opts = {}) {
  const isForm = opts.body instanceof FormData;
  const headers = { ...(opts.headers || {}) };
  if (!isForm) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let body = opts.body;
  if (body && !isForm && typeof body !== 'string') body = JSON.stringify(body);

  const res = await fetch('/api' + path, {
    ...opts,
    headers,
    body,
    credentials: 'include',
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || 'Something went wrong.');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const qs = (obj) =>
  Object.entries(obj || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');