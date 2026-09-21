import { Router } from "express";
import { getOrder, getOrders, updateOrder } from "../controllers/order.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyUser);

router.get("/", getOrders);
router.route("/:id").get(getOrder).patch(updateOrder);

export default router;