import { Router } from "express";
import { login, me, userData } from "../controllers/auth.controller.js";
import { adminOnly, verifyUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/auth/login", login);
router.get("/users/me", verifyUser, me);
router.get("/users/:id", verifyUser, adminOnly, userData);

export default router;