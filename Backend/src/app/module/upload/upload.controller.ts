import { Request, Response } from "express";
import busboy from "busboy";
import { PassThrough, Transform } from "stream";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../shared/catchAsync";
import { UploadService } from "./upload.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const FILE_SIZE_LIMIT_BYTES = 500 * 1024 * 1024; // 500 MB

// Counts actual file bytes flowing through the pipeline
class ByteCounter extends Transform {
  public byteCount = 0;

  _transform(chunk: Buffer, _enc: BufferEncoding, cb: () => void) {
    this.byteCount += chunk.length;
    this.push(chunk);
    cb();
  }
}

// Parses multipart/form-data — resolves immediately when file stream is ready
const parseUploadStream = (
  req: Request, res: Response
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
        fileSize: FILE_SIZE_LIMIT_BYTES,
        files: 1,
      },
    });

    const fields: Record<string, string> = {};
    let fileHandled = false;

    bb.on("field", (name, value) => {
      fields[name] = value;
    });

    bb.on("file", (_fieldName, file, info) => {
      if (fileHandled) {
        file.resume();
        return;
      }
      fileHandled = true;

      const counter = new ByteCounter();
      const passThrough = new PassThrough({ highWaterMark: 64 * 1024 });

      passThrough.on("error", () => { });

      let rejected = false;
      const rejectOnce = (err: unknown) => {
        if (!rejected) {
          rejected = true;
          reject(err);
        }
      };

      file.on("error", (err) => {
        passThrough.destroy(err);
        rejectOnce(err);
      });

      file.on("limit", () => {
        const err = new AppError(
          status.REQUEST_ENTITY_TOO_LARGE,
          `File exceeds the maximum allowed size of ${FILE_SIZE_LIMIT_BYTES / (1024 * 1024)}MB`
        );
        file.resume();
        passThrough.destroy(err);
        rejectOnce(err);
      });

      res.on("close", () => {
        if (!res.writableFinished && !passThrough.writableEnded) {
          passThrough.destroy();
        }
      });

      file.pipe(counter).pipe(passThrough);

      resolve({
        stream: passThrough,
        fileName: info.filename,
        mimeType: info.mimeType,
        fields,
        counter,
      });
    });

    bb.on("finish", () => {
      if (!fileHandled) {
        reject(new AppError(status.BAD_REQUEST, "No file was included in the request"));
      }
    });

    bb.on("error", reject);
    req.pipe(bb);
  });
};

const uploadFile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const { stream, fileName, mimeType, fields, counter } = await parseUploadStream(req, res);

  // Allow query parameter fallback so client field ordering never drops metadata
  const query = req.query as Record<string, string | undefined>;
  const policy = (fields.policy || query.policy) === "manual" ? "manual" : "auto";
  const folderId = fields.folderId || query.folderId;
  const parentProviderFolderId = fields.parentProviderFolderId || query.parentProviderFolderId;
  const targetAccountId = fields.targetAccountId || query.targetAccountId;

  let streamConsumed = false;

  try {
    const result = await UploadService.uploadFile({
      userId,
      fileName,
      mimeType,
      stream,
      folderId,
      parentProviderFolderId,
      policy,
      targetAccountId,
      getByteCount: () => counter.byteCount,
      onStreamStart: () => {
        streamConsumed = true;
      },
    });

    sendResponse(res, {
      httpStatusCode: status.CREATED,
      success: true,
      message: "File uploaded successfully",
      data: result,
    });
  } catch (err) {
    if (!streamConsumed) {
      stream.resume(); // drain stream to avoid unhandled backpressure / hanging socket
    }
    throw err;
  }
});

export const UploadController = {
  uploadFile,
};