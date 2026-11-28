import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { FileValidation } from "./file.validation";
import { FileController } from "./file.controller";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.post(
  "/",
  checkAuth(Role.ADMIN, Role.USER),
  validateRequest(FileValidation.createFileMetadataZodSchema),
  FileController.createFile,
);

// Search endpoint must be placed before /:id to prevent route collision
router.get(
  "/search",
  checkAuth(Role.ADMIN, Role.USER),
  FileController.searchFiles,
);
router.get("/", checkAuth(Role.ADMIN, Role.USER), FileController.getUserFiles);
router.get(
  "/:id/download",
  checkAuth(Role.ADMIN, Role.USER),
  FileController.downloadFile,
);
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.USER),
  FileController.getFileDetails,
);

router.patch(
  "/:id",
  checkAuth(Role.ADMIN, Role.USER),
  validateRequest(FileValidation.updateFileMetadataZodSchema),
  FileController.updateFile,
);

router.patch(
  "/:id/favorite",
  checkAuth(Role.ADMIN, Role.USER),
  FileController.toggleFavorite,
);
router.patch(
  "/:id/trash",
  checkAuth(Role.ADMIN, Role.USER),
  FileController.toggleTrash,
);

router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.USER),
  FileController.deleteFile,
);

export const FileRoutes = router;
