import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo.svg';
import logoLight from '../../assets/images/logo-light.svg';

// The Abe Garage logo, linking to the home page. `light` is the white version for the navy footer.
// To change the logo, replace the two files in src/assets/images.
export default function Brand({ light = false }) {
  return (
    <Link to="/" className="brand" aria-label="Abe Garage home">
      <img src={light ? logoLight : logo} alt="Abe Garage" width="214" height="50" />
    </Link>
  );
}
