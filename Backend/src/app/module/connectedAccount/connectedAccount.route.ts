import { Router } from "express";
import { ConnectedAccountController } from "./connectedAccount.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get(
  "/google/connect",
  checkAuth(Role.ADMIN, Role.USER),
  ConnectedAccountController.connectGoogleAccount
);

router.get("/google/callback", ConnectedAccountController.googleOAuthCallback);

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.USER),
  ConnectedAccountController.getUserConnectedAccounts
);

router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.USER),
  ConnectedAccountController.disconnectAccount
);

export const ConnectedAccountRoutes = router;
