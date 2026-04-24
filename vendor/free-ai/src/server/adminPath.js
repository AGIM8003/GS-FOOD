/**
 * True when the request path is the admin HTTP surface (/admin or /admin/*).
 * Does not match /administrator or other /admin* prefixes (query string stripped).
 * @param {string} [reqUrl] req.url
 */
export function isProtectedAdminPath(reqUrl) {
  const pathname = String(reqUrl || '').split('?')[0];
  return pathname === '/admin' || pathname.startsWith('/admin/');
}
