import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route";
import { ConnectedAccountRoutes } from "../module/connectedAccount/connectedAccount.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/accounts", ConnectedAccountRoutes);

export const IndexRoutes = router;