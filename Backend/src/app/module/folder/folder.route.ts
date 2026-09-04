import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { FolderController } from "./folder.controller";
import { FolderValidation } from "./folder.validation";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

// Apply auth middleware to all folder routes
router.use(checkAuth());

router.post(
  "/",
  checkAuth(Role.USER),
  validateRequest(FolderValidation.createFolderZodSchema),
  FolderController.createFolder
);
router.get("/", checkAuth(Role.USER), FolderController.getUserFolders);
router.get("/:id", checkAuth(Role.USER), FolderController.getFolderDetails);
router.patch(
  "/:id",
  checkAuth(Role.USER),
  validateRequest(FolderValidation.renameFolderZodSchema),
  FolderController.renameFolder
);
router.delete("/:id", checkAuth(Role.USER), FolderController.deleteFolder);

export const FolderRoutes = router;

