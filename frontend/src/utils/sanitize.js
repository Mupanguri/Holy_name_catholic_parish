export function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>"'`]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .slice(0, 200);
}
