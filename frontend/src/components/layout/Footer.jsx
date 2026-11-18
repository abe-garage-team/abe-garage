import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { GARAGE, telHref } from '../../constants/garage.js';
import Brand from './Brand.jsx';
import { Mail, MapPin, Phone } from 'lucide-react';

// Navy footer: the address, email and phone strip, then four columns, then the copyright bar.
export default function Footer() {
  const { employee } = useAuth();
  return (
    <footer className="site-footer">
      <div className="foot-strip">
        <div className="wrap strip-grid">
          <div>
            <MapPin size={30} strokeWidth={1.5} aria-hidden="true" />
            <span>
              {GARAGE.address || 'Visit the garage'}
              <br />
              <small>Walk-ins welcome</small>
            </span>
          </div>
          <div>
            <Mail size={30} strokeWidth={1.5} aria-hidden="true" />
            <span>
              Email us
              <br />
              {GARAGE.email ? (
                <a href={`mailto:${GARAGE.email}`}>{GARAGE.email}</a>
              ) : (
                'Ask at the desk'
              )}
            </span>
          </div>
          <div>
            <Phone size={30} strokeWidth={1.5} aria-hidden="true" />
            <span>
              Call us
              <br />
              {GARAGE.phone ? (
                <a href={telHref(GARAGE.phone)}>{GARAGE.phone}</a>
              ) : (
                'See the Contact page'
              )}
            </span>
          </div>
        </div>
      </div>
      <div className="wrap foot-grid">
        <div className="foot-about">
          <Brand light />
          <p>
            Mechanical repair and servicing for everyday cars. Clear answers, and we always ask
            before any extra work.
          </p>
        </div>
        <div>
          <h4>Useful links</h4>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About us</Link>
            </li>
            <li>
              <Link to="/services">Services</Link>
            </li>
            <li>
              <Link to="/contact">Contact us</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>Opening hours</h4>
          <ul>
            <li>{GARAGE.hours || 'See the Contact page'}</li>
            <li>Cash payments only, at pick-up</li>
            <li>We give you a price after we check your car</li>
          </ul>
        </div>
        <div>
          <h4>Staff</h4>
          <ul>
            <li>
              {employee ? (
                <Link to="/admin">Go to the workspace</Link>
              ) : (
                <Link to="/login">Staff sign in</Link>
              )}
            </li>
            <li>
              <Link to="/forgot-password">Forgot your password?</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="wrap foot-bar">
        © {new Date().getFullYear()} {GARAGE.name}. Mechanical repair and maintenance.
      </div>
    </footer>
  );
}
