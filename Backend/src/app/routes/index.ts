import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route";
import { ConnectedAccountRoutes } from "../module/connectedAccount/connectedAccount.route";
import { FolderRoutes } from "../module/folder/folder.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/accounts", ConnectedAccountRoutes);
router.use("/folders", FolderRoutes);

export const IndexRoutes = router;