import { Router } from "express";
import { create, getOrder, getOrders, updateOrder } from "../controllers/order.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyUser);

router.route("/").get(getOrders).post(create);
router.route("/:id").get(getOrder).patch(updateOrder);

export default router;