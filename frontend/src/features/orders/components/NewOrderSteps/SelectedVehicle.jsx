import { Link } from 'react-router-dom';
import { Pencil, X } from 'lucide-react';

// The vehicle chosen in step 2. The red X goes back to the vehicle list.
export default function SelectedVehicle({ vehicle, onClear }) {
  return (
    <section className="ag-card ord-selected" aria-label="Chosen vehicle">
      <div>
        <h2>
          {vehicle.make} {vehicle.model}
        </h2>
        <dl className="ord-facts">
          <div>
            <dt>Vehicle color</dt>
            <dd>{vehicle.color}</dd>
          </div>
          <div>
            <dt>Vehicle tag</dt>
            <dd className="mono">{vehicle.plate}</dd>
          </div>
          <div>
            <dt>Vehicle year</dt>
            <dd>{vehicle.year}</dd>
          </div>
          <div>
            <dt>Vehicle mileage</dt>
            <dd>{Number(vehicle.mileage).toLocaleString('en-US')}</dd>
          </div>
          {vehicle.vin && (
            <div>
              <dt>Vehicle serial</dt>
              <dd className="mono">{vehicle.vin}</dd>
            </div>
          )}
        </dl>
        <Link
          to={`/admin/vehicle/${vehicle.vehicle_id}/edit`}
          target="_blank"
          rel="noopener noreferrer"
          className="ord-edit-link"
        >
          Edit vehicle info <Pencil size={14} aria-hidden="true" />
          <span className="visually-hidden"> (opens in a new tab)</span>
        </Link>
      </div>
      <button
        type="button"
        className="ord-remove"
        onClick={onClear}
        aria-label="Choose a different vehicle"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </section>
  );
}
