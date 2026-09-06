import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route";
import { ConnectedAccountRoutes } from "../module/connectedAccount/connectedAccount.route";
import { FolderRoutes } from "../module/folder/folder.route";
import { FileRoutes } from "../module/file/file.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/accounts", ConnectedAccountRoutes);
router.use("/folders", FolderRoutes);
router.use("/files", FileRoutes);

export const IndexRoutes = router;