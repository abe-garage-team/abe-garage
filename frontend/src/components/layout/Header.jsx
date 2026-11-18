import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { GARAGE, telHref } from '../../constants/garage.js';
import Brand from './Brand.jsx';
import Icon from '../common/Icon.jsx';

const PAGES = [
  ['/', 'Home'],
  ['/about', 'About us'],
  ['/services', 'Services'],
  ['/contact', 'Contact us'],
];

// Navy top bar with the red slogan, then the white bar with the brand, the page links
// and Sign in / Log out. Used by the public pages and the staff area alike.
export default function Header() {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pages = employee ? [...PAGES, ['/admin', 'Workspace']] : PAGES;

  const onLogout = async () => {
    await logout();
    navigate('/');
  };

  const account = employee ? (
    <button type="button" className="btn btn-ink" onClick={onLogout}>
      Log out
    </button>
  ) : (
    <Link to="/login" className="btn btn-brand">
      Sign in
    </Link>
  );

  return (
    <>
      <div className="top-bar">
        <span className="top-red">Enjoy the beso while we fix your car</span>
        {GARAGE.hours && <span className="top-mid">{GARAGE.hours}</span>}
        <span className="top-right">
          {employee ? (
            <>
              Welcome <b>{employee.first_name}</b>
            </>
          ) : (
            GARAGE.phone && (
              <>
                Call us: <a href={telHref(GARAGE.phone)}>{GARAGE.phone}</a>
              </>
            )
          )}
        </span>
      </div>
      <header className="site-header">
        <nav aria-label="Main navigation">
          <Brand />
          <div className="site-links">
            {pages.map(([to, label]) => (
              <NavLink key={to} to={to} end={to !== '/admin'}>
                {label}
              </NavLink>
            ))}
          </div>
          <div className="site-actions">
            <span className="divider" aria-hidden="true" />
            {account}
            {/* The key closes the menu after each page change. */}
            <details className="site-menu" key={pathname}>
              <summary aria-label="Open menu">
                <Icon name="menu" size={22} />
              </summary>
              <div className="panel">
                {pages.map(([to, label]) => (
                  <Link key={to} to={to}>
                    {label}
                  </Link>
                ))}
                {employee ? (
                  <button type="button" onClick={onLogout}>
                    Log out
                  </button>
                ) : (
                  <Link to="/login">Sign in</Link>
                )}
              </div>
            </details>
          </div>
        </nav>
      </header>
    </>
  );
}
