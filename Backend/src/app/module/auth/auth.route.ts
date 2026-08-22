import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { authValidation } from "./auth.validation";
import { AuthController } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post("/register", validateRequest(authValidation.registerZodSchema), AuthController.registerUser);
router.post("/login", validateRequest(authValidation.loginZodSchema), AuthController.loginUser);
router.get("/me", checkAuth(Role.ADMIN, Role.USER), AuthController.getMe);
router.post("/refresh-token", AuthController.getNewToken);

export const AuthRoutes = router;