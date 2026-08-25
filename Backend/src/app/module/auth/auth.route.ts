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
router.post("/verify-email", validateRequest(authValidation.verifyEmailZodSchema), AuthController.verifyEmail);
router.post("/logout", checkAuth(Role.ADMIN, Role.USER), AuthController.logOutUser);

router.post("/change-password", checkAuth(Role.ADMIN, Role.USER), validateRequest(authValidation.changePasswordZodSchema), AuthController.changePassword);

router.post("/forgot-password", validateRequest(authValidation.forgotPasswordZodSchema), AuthController.forgotPassword);

router.post("/reset-password", validateRequest(authValidation.resetPasswordZodSchema), AuthController.resetPassword);

export const AuthRoutes = router;