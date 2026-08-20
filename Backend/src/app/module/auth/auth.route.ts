import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { authValidation } from "./auth.validation";
import { AuthController } from "./auth.controller";

const router = Router();

router.post("/register", validateRequest(authValidation.registerZodSchema), AuthController.registerUser);
router.post("/login", validateRequest(authValidation.loginZodSchema), AuthController.loginUser);

export const AuthRoutes = router;