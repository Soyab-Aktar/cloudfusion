import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { FileValidation } from "./file.validation";
import { FileController } from "./file.controller";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.post(
  "/",
  checkAuth(Role.USER),
  validateRequest(FileValidation.createFileMetadataZodSchema),
  FileController.createFile
);

router.get("/", checkAuth(Role.USER), FileController.getUserFiles);
router.get("/:id", checkAuth(Role.USER), FileController.getFileDetails);

router.patch(
  "/:id",
  checkAuth(Role.USER),
  validateRequest(FileValidation.updateFileMetadataZodSchema),
  FileController.updateFile
);

router.patch("/:id/favorite", checkAuth(Role.USER), FileController.toggleFavorite);
router.patch("/:id/trash", checkAuth(Role.USER), FileController.toggleTrash);

router.delete("/:id", checkAuth(Role.USER), FileController.deleteFile);

export const FileRoutes = router;
