// The only logging helper. It accepts a plain object and prints it as one JSON line.
// Never pass request bodies, headers, cookies, passwords or tokens into these functions.
// Allowed fields: request_id, method, route, status_code, employee_id, error_name, code, event.

function writeLine(level, fields) {
  const line = { level, time: new Date().toISOString(), ...fields };
  if (level === 'error') {
    console.error(JSON.stringify(line));
  } else {
    console.log(JSON.stringify(line));
  }
}

export function logInfo(fields) {
  writeLine('info', fields);
}

export function logWarning(fields) {
  writeLine('warn', fields);
}

export function logError(fields) {
  writeLine('error', fields);
}
