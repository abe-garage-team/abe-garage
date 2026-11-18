// The login itself lives in an httpOnly cookie the browser manages; the frontend never
// sees or stores a token. This file only keeps the employee's public profile between
// page loads so the header can show their name before GET /profile answers.
// It is a display convenience, never evidence of being logged in: AuthContext always
// confirms with the server.
const EMPLOYEE_KEY = 'abe_garage_employee';

export function getCachedEmployee() {
  try {
    return JSON.parse(sessionStorage.getItem(EMPLOYEE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function cacheEmployee(employee) {
  try {
    if (employee) sessionStorage.setItem(EMPLOYEE_KEY, JSON.stringify(employee));
    else sessionStorage.removeItem(EMPLOYEE_KEY);
  } catch {
    // Private mode or storage disabled: the header just waits for /profile.
  }
}
