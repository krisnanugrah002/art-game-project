export function isDuplicateError(e: any): boolean {
  // MySQL duplicate entry error
  if (e?.code === 'ER_DUP_ENTRY' || e?.errno === 1062) {
    return true;
  }
  // Postgres duplicate key error
  if (e?.code === '23505') {
    return true;
  }
  return false;
}
