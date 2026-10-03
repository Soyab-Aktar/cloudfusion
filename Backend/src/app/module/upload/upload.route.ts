import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { UploadController } from "./upload.controller";

const router = Router();

// Chunks flow: HTTP request → busboy → PassThrough stream → Google Drive
router.post("/", checkAuth(Role.USER), UploadController.uploadFile);

export const UploadRoutes = router;
