import { useEffect, useState } from 'react';
import { fetchRoles } from '../services/employee.service.js';

// The three fixed roles from GET /roles, loaded once per page that needs a role dropdown.
export function useRoles() {
  const [roles, setRoles] = useState([]);
  useEffect(() => {
    let cancelled = false;
    fetchRoles()
      .then((list) => {
        if (!cancelled) setRoles(list);
      })
      .catch(() => {
        // The form still works: the select just stays empty until the next load.
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return roles;
}
