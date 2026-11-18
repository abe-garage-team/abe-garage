import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ROLES, ROLE_NAMES } from '../../constants/roles.js';
import Icon from '../common/Icon.jsx';

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

// Only the links the role may use. Each module adds its own line here.
export const LINKS = [
  { to: '/admin', label: 'Dashboard', roles: [M, A], end: true },
  { to: '/admin/my-jobs', label: 'My jobs', roles: [T] },
  { to: '/admin/orders', label: 'Orders', roles: [T, M, A] },
  { to: '/admin/order/new', label: 'New order', roles: [M, A] },
  { to: '/admin/customers', label: 'Customers', roles: [T, M, A] },
  { to: '/admin/customer/new', label: 'Add customer', roles: [M, A] },
  { to: '/admin/services', label: 'Services', roles: [A] },
  { to: '/admin/employees', label: 'Employees', roles: [A] },
  { to: '/admin/employee/new', label: 'Add employee', roles: [A] },
  { to: '/admin/settings', label: 'Settings', roles: [A] },
  { to: '/admin/profile', label: 'My account', roles: [T, M, A] },
];

export default function AdminMenu() {
  const { employee } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const title = employee.role_id === T ? 'Workshop menu' : 'Admin menu';
  return (
    <aside className={`admin-menu${open ? ' open' : ''}`}>
      <h2>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="admin-links"
        >
          {title}
          <Icon name="menu" size={20} />
        </button>
        <span>{title}</span>
      </h2>
      <nav id="admin-links" aria-label="Staff navigation">
        {LINKS.filter((link) => link.roles.includes(employee.role_id)).map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <p className="admin-who">
        Signed in as{' '}
        <b>
          {employee.first_name} {employee.last_name}
        </b>
        <br />
        {ROLE_NAMES[employee.role_id]}
      </p>
    </aside>
  );
}
