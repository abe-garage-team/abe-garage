import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { fetchVehiclesByCustomerId } from '../../../../services/vehicle.service.js';
import AddVehicleModal from '../../../vehicles/components/AddVehicleModal.jsx';
import ErrorMessage from '../../../../components/common/ErrorMessage.jsx';

export default function VehicleStep({ customer, onSelect }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchVehiclesByCustomerId(customer.customer_id);
      setVehicles(data?.vehicles ?? []);
    } catch (err) {
      setError(err.message || 'Could not load this customer’s vehicles.');
    } finally {
      setLoading(false);
    }
  }, [customer.customer_id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="ag-card" aria-labelledby="vehicle-step-title">
      <div className="card-title-row">
        <h2 id="vehicle-step-title">Choose a vehicle</h2>
        {!adding && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setAdding(true)}
          >
            <Plus size={16} aria-hidden="true" />
            Add a vehicle
          </button>
        )}
      </div>

      <ErrorMessage message={error} />

      <AddVehicleModal
        show={adding}
        customerId={customer.customer_id}
        onClose={() => setAdding(false)}
        onSuccess={load}
      />

      {loading && (
        <p className="ord-empty" role="status">
          Loading vehicles…
        </p>
      )}
      {!loading && !error && vehicles.length === 0 && (
        <p className="ord-empty">{customer.first_name} has no vehicles yet. Add one to continue.</p>
      )}
      {!loading && vehicles.length > 0 && (
        <div className="table-responsive">
          <table className="table align-middle ord-table">
            <caption className="visually-hidden">Vehicles owned by {customer.first_name}</caption>
            <thead>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">Make</th>
                <th scope="col">Model</th>
                <th scope="col">Tag</th>
                <th scope="col">Serial</th>
                <th scope="col">Color</th>
                <th scope="col" className="text-end">
                  Mileage
                </th>
                <th scope="col" className="text-end">
                  Choose
                </th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.vehicle_id}>
                  <td>{vehicle.year}</td>
                  <td>{vehicle.make}</td>
                  <td>{vehicle.model}</td>
                  <td className="mono">{vehicle.plate}</td>
                  <td className="mono">{vehicle.vin || '—'}</td>
                  <td>{vehicle.color}</td>
                  <td className="text-end ord-num">
                    {Number(vehicle.mileage).toLocaleString('en-US')}
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-ink"
                      onClick={() => onSelect(vehicle)}
                      aria-label={`Choose ${vehicle.year} ${vehicle.make} ${vehicle.model}, plate ${vehicle.plate}`}
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
