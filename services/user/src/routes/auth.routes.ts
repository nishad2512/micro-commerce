import { Router } from "express";
import { UserController } from "../controllers/auth.controller.js";
import { adminOnly, verifyUser } from "../middlewares/auth.middleware.js";
import { UserService } from "../services/user.service.js";
import { UserRepo } from "../repositories/user.repository.js";

const router = Router();

const repository = new UserRepo();
const service = new UserService(repository)
const controller = new UserController(service);

router.post("/auth/register", (req, res) => controller.register(req, res));
router.post("/auth/login", (req, res) => controller.login(req, res));
router.get("/users/me", verifyUser, (req, res) => controller.me(req, res));
router.get("/users/:id", verifyUser, adminOnly, (req, res) => controller.userData(req, res));

export default router;