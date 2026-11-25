import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerStep from '../components/NewOrderSteps/CustomerStep.jsx';
import OrderStepper from '../components/NewOrderSteps/OrderStepper.jsx';
import SelectedCustomer from '../components/NewOrderSteps/SelectedCustomer.jsx';
import SelectedVehicle from '../components/NewOrderSteps/SelectedVehicle.jsx';
import ServiceStep from '../components/NewOrderSteps/ServiceStep.jsx';
import VehicleStep from '../components/NewOrderSteps/VehicleStep.jsx';
import '../../../styles/orders.css';


export default function NewOrder() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [vehicle, setVehicle] = useState(null);

  const step = !customer ? 1 : !vehicle ? 2 : 3;

  function chooseCustomer(chosen) {
    setCustomer(chosen);
    setVehicle(null);
  }

  function clearCustomer() {
    setCustomer(null);
    setVehicle(null);
  }

  function handleCreated(order) {
    navigate(`/admin/order/${order.order_id}`, {
      state: {
        flash: `Order #${order.order_id} was created and is awaiting the customer’s approval.`,
      },
    });
  }

  return (
    <div>
      <h1 className="page-title">Create a new order</h1>
      <OrderStepper current={step} />

      {!customer && <CustomerStep onSelect={chooseCustomer} />}

      {customer && <SelectedCustomer customer={customer} onClear={clearCustomer} />}
      {customer && !vehicle && <VehicleStep customer={customer} onSelect={setVehicle} />}

      {customer && vehicle && (
        <>
          <SelectedVehicle vehicle={vehicle} onClear={() => setVehicle(null)} />
          <ServiceStep customer={customer} vehicle={vehicle} onCreated={handleCreated} />
        </>
      )}
    </div>
  );
}

