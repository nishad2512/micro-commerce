import { Router } from "express";
import { UserController } from "../controllers/auth.controller.js";
import { adminOnly, verifyUser } from "../middlewares/auth.middleware.js";
import { UserService } from "../services/user.service.js";
import { UserRepo } from "../repositories/user.repository.js";

const router = Router();

const repository = new UserRepo();
const service = new UserService(repository)
const controller = new UserController(service);

router.post("/auth/register", controller.register);
router.post("/auth/login", controller.login);
router.post("/auth/refresh", controller.refresh);
router.post("/auth/logout", controller.logout);
router.get("/users/me", verifyUser, controller.me);
router.get("/users/me/wallet", verifyUser, controller.wallet);
router.post("/users/me/wallet/top-up", verifyUser, controller.topUpWallet);
router.get("/users/:id", verifyUser, adminOnly, controller.userData);

export default router;
