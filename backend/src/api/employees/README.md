# employees

Routes are mounted at /api/employees. Every route requires a logged-in employee.

- BE-009 · `POST /api/employees` · Admin only · creates a staff account
- BE-010 · `GET /api/employees` · Admin and Manager · Managers see only active technicians (id and names)
- BE-011 · `GET /api/employees/:employee_id` · Admin only · one staff record, including inactive ones
