
import { createOrderService } from "../service/order.service.js";


// BE-029 — Create Order Controller
export const createOrderController = async (req, res, next) => {
  try {
    const result = await createOrderService(
      req.body,
      req.user.employee_id
    );

    return res.status(201).json({
      status: "success",
      message: "Create repair order and estimate successful",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
