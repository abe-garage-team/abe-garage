import { pool } from '../src/config/db.js';
import { hashPassword } from '../src/shared/auth/passwords.js';
import { ROLES } from '../src/constants/roles.js';

export const DEVELOPMENT_PASSWORD = 'Password123!';

const employees = [
  {
    email: 'manager@abegarage.com',
    firstName: 'Sara',
    lastName: 'Tesfaye',
    phone: '0911000002',
    roleId: ROLES.MANAGER,
  },
  {
    email: 'tech1@abegarage.com',
    firstName: 'Dawit',
    lastName: 'Bekele',
    phone: '0911000003',
    roleId: ROLES.TECHNICIAN,
  },
  {
    email: 'tech2@abegarage.com',
    firstName: 'Hana',
    lastName: 'Girma',
    phone: '0911000004',
    roleId: ROLES.TECHNICIAN,
  },
];

const customers = [
  {
    firstName: 'Abebe',
    lastName: 'Kebede',
    email: 'abebe.kebede@example.com',
    phone: '0912000001',
  },
  { firstName: 'Marta', lastName: 'Alemu', email: 'marta.alemu@example.com', phone: '0912000002' },
  { firstName: 'Yonas', lastName: 'Haile', email: 'yonas.haile@example.com', phone: '0912000003' },
];

const vehicles = [
  {
    customerEmail: 'abebe.kebede@example.com',
    year: 2018,
    make: 'Toyota',
    model: 'Corolla',
    type: 'Sedan',
    mileage: 85000,
    plate: 'AA-12345',
    vin: 'JTDBR32E180012345',
    color: 'White',
  },
  {
    customerEmail: 'abebe.kebede@example.com',
    year: 2015,
    make: 'Toyota',
    model: 'Hilux',
    type: 'Pickup',
    mileage: 142000,
    plate: 'AA-67890',
    vin: null,
    color: 'Silver',
  },
  {
    customerEmail: 'marta.alemu@example.com',
    year: 2020,
    make: 'Hyundai',
    model: 'Tucson',
    type: 'SUV',
    mileage: 41000,
    plate: 'AA-24680',
    vin: 'KM8J3CA46LU123456',
    color: 'Blue',
  },
  {
    customerEmail: 'yonas.haile@example.com',
    year: 2012,
    make: 'Suzuki',
    model: 'Alto',
    type: 'Hatchback',
    mileage: 198000,
    plate: 'AA-13579',
    vin: null,
    color: 'Red',
  },
];

const services = [
  {
    name: 'Oil change',
    description: 'Drain and replace engine oil and filter.',
    price: 1500.0,
    hours: 0.5,
  },
  {
    name: 'Brake pad replacement',
    description: 'Replace front or rear brake pads and inspect discs.',
    price: 4200.0,
    hours: 1.5,
  },
  {
    name: 'Wheel alignment',
    description: 'Four-wheel alignment and tyre pressure check.',
    price: 2000.0,
    hours: 1.0,
  },
  {
    name: 'Engine diagnostic',
    description: 'OBD scan and fault report.',
    price: 1200.0,
    hours: 1.0,
  },
];

export async function seedDevelopmentData(connection) {
  const [existing] = await connection.execute(
    'SELECT customer_id FROM customers WHERE email = ? LIMIT 1',
    [customers[0].email],
  );
  if (existing.length) return { created: false };

  const [admins] = await connection.execute(
    'SELECT employee_id FROM employees WHERE role_id = ? AND active = 1 ORDER BY employee_id LIMIT 1',
    [ROLES.ADMIN],
  );
  if (!admins.length) throw new Error('Seed the Admin first (npm run seed:admin)');
  const adminId = admins[0].employee_id;

  const passwordHash = await hashPassword(DEVELOPMENT_PASSWORD);
  for (const employee of employees) {
    await connection.execute(
      `INSERT IGNORE INTO employees (email, first_name, last_name, phone, password_hash, role_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        employee.email,
        employee.firstName,
        employee.lastName,
        employee.phone,
        passwordHash,
        employee.roleId,
      ],
    );
  }

  const customerIds = new Map();
  for (const customer of customers) {
    const [result] = await connection.execute(
      'INSERT INTO customers (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)',
      [customer.firstName, customer.lastName, customer.email, customer.phone],
    );
    customerIds.set(customer.email, result.insertId);
  }

  for (const vehicle of vehicles) {
    await connection.execute(
      `INSERT INTO vehicles (customer_id, year, make, model, vehicle_type, mileage, plate, vin, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerIds.get(vehicle.customerEmail),
        vehicle.year,
        vehicle.make,
        vehicle.model,
        vehicle.type,
        vehicle.mileage,
        vehicle.plate,
        vehicle.vin,
        vehicle.color,
      ],
    );
  }

  for (const service of services) {
    const [result] = await connection.execute('INSERT INTO services () VALUES ()');
    await connection.execute(
      `INSERT INTO service_versions (service_id, version_number, name, description, default_price, labor_hours, created_by)
       VALUES (?, 1, ?, ?, ?, ?, ?)`,
      [result.insertId, service.name, service.description, service.price, service.hours, adminId],
    );
  }

  return { created: true };
}

const runDirectly = process.argv[1] && process.argv[1].endsWith('seed-development.js');
if (runDirectly) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Development seed is disabled in production');
  }
  const connection = await pool.getConnection();
  try {
    await connection.query("SET time_zone = '+00:00'");
    await connection.beginTransaction();
    const result = await seedDevelopmentData(connection);
    await connection.commit();
    console.log(
      result.created ? 'Development fixtures added' : 'Development fixtures already present',
    );
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}
