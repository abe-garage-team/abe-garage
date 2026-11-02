import * as vehicleService from '../service/vehicle.service.js';
import { asyncHandler } from '../../../utils/async-handler.js';
import { respond } from '../../../utils/respond.js';

// Controller to handle adding a new vehicle to a customer (BE-020)
export const createVehicle = asyncHandler(async (req, res) => {
  const { customer_id, year, make, model, type, mileage, plate, vin, color } = req.body;

  const vehicle = await vehicleService.createVehicle({
    customer_id,
    year,
    make,
    model,
    type,
    mileage,
    plate,
    vin,
    color,
  });

  return respond(res, vehicle, 'Add vehicle to customer successful', 201);
});

// Controller to handle viewing a single vehicle (BE-022)
export const getVehicle = asyncHandler(async (req, res) => {
  const { vehicle_id } = req.params;

  const vehicle = await vehicleService.getVehicle(vehicle_id);

  return respond(res, vehicle, 'View vehicle successful', 200);
});

// Aliases for compatibility
export const createVehicleController = createVehicle;
export const getVehicleController = getVehicle;