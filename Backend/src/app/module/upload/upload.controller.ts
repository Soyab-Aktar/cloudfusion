import { Request, Response } from "express";
import busboy from "busboy";
import { PassThrough, Transform } from "stream";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../shared/catchAsync";
import { UploadService } from "./upload.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const FILE_SIZE_LIMIT_BYTES = 500 * 1024 * 1024; // 500 MB

// Counts actual file bytes flowing through the pipeline (Content-Length is inaccurate)
class ByteCounter extends Transform {
  public byteCount = 0;

  _transform(chunk: Buffer, _enc: BufferEncoding, cb: () => void) {
    this.byteCount += chunk.length;
    this.push(chunk);
    cb();
  }
}

// Parses multipart/form-data — resolves only after ALL parts received
const parseUploadStream = (
  req: Request
): Promise<{
  stream: PassThrough;
  fileName: string;
  mimeType: string;
  fields: Record<string, string>;
  counter: ByteCounter;
}> => {
  return new Promise((resolve, reject) => {
    const bb = busboy({
      headers: req.headers,
      limits: {
        fileSize: FILE_SIZE_LIMIT_BYTES, // reject files > 500MB
        files: 1,                        // single file per request
      },
    });

    const fields: Record<string, string> = {};
    let fileReceived = false;
    let pending: {
      stream: PassThrough;
      fileName: string;
      mimeType: string;
      counter: ByteCounter;
    } | null = null;

    bb.on("field", (name, value) => {
      fields[name] = value;
    });

    bb.on("file", (_fieldName, file, info) => {
      fileReceived = true;

      const counter = new ByteCounter();
      const passThrough = new PassThrough({ highWaterMark: 10 * 1024 * 1024 }); // 10MB buffer

      passThrough.on("error", () => { });

      // Guard: ensure we only call reject() once
      let rejected = false;
      const rejectOnce = (err: unknown) => {
        if (!rejected) { rejected = true; reject(err); }
      };

      // Propagate file stream errors to passThrough
      file.on("error", (err) => {
        passThrough.destroy(err);
        rejectOnce(err);
      });

      // File size limit hit — return 413
      file.on("limit", () => {
        const err = new AppError(
          status.REQUEST_ENTITY_TOO_LARGE,
          `File exceeds the maximum allowed size of ${FILE_SIZE_LIMIT_BYTES / (1024 * 1024)}MB`
        );
        file.resume(); // drain so busboy doesn't hang
        passThrough.destroy(err);
        rejectOnce(err);
      });

      // Client disconnected — destroy stream silently (no error arg)
      // Passing an error arg emits 'error' even after our listener is attached,
      // which can still propagate up through pipe chains and crash the server.
      req.on("close", () => {
        if (!passThrough.writableEnded) {
          passThrough.destroy(); // silent destroy — no error event emitted
        }
      });

      // file → count bytes → passThrough → Google Drive
      file.pipe(counter).pipe(passThrough);

      pending = { stream: passThrough, fileName: info.filename, mimeType: info.mimeType, counter };
    });

    // Resolve after ALL parts received — fields guaranteed complete
    bb.on("finish", () => {
      if (!fileReceived || !pending) {
        reject(new AppError(status.BAD_REQUEST, "No file was included in the request"));
        return;
      }
      resolve({ ...pending, fields });
    });

    bb.on("error", reject);
    req.pipe(bb);
  });
};

const uploadFile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const { stream, fileName, mimeType, fields, counter } = await parseUploadStream(req);

  const policy = fields.policy === "manual" ? "manual" : "auto";

  // Track if service started consuming stream — drain on early failure to prevent hang
  let streamConsumed = false;

  try {
    streamConsumed = true;

    const result = await UploadService.uploadFile({
      userId,
      fileName,
      mimeType,
      size: counter.byteCount,
      stream,
      folderId: fields.folderId,
      parentProviderFolderId: fields.parentProviderFolderId,
      policy,
      targetAccountId: fields.targetAccountId,
    });

    sendResponse(res, {
      httpStatusCode: status.CREATED,
      success: true,
      message: "File uploaded successfully",
      data: result,
    });
  } catch (err) {
    if (!streamConsumed) stream.resume(); // drain unconsumed stream
    throw err;
  }
});

export const UploadController = {
  uploadFile,
};
