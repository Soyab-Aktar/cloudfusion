import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { FolderController } from "./folder.controller";
import { FolderValidation } from "./folder.validation";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/",
  checkAuth(Role.USER, Role.ADMIN),
  validateRequest(FolderValidation.createFolderZodSchema),
  FolderController.createFolder,
);
router.get(
  "/",
  checkAuth(Role.USER, Role.ADMIN),
  FolderController.getUserFolders,
);
router.get(
  "/:id",
  checkAuth(Role.USER, Role.ADMIN),
  FolderController.getFolderDetails,
);
router.patch(
  "/:id",
  checkAuth(Role.USER, Role.ADMIN),
  validateRequest(FolderValidation.renameFolderZodSchema),
  FolderController.renameFolder,
);
router.delete(
  "/:id",
  checkAuth(Role.USER, Role.ADMIN),
  FolderController.deleteFolder,
);

export const FolderRoutes = router;
