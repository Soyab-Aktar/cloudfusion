import express, { Application, Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth";
import { IndexRoutes } from "./app/routes";
import cookieParser from "cookie-parser";
import path from "path";
import qs from "qs";
import cors from "cors";

import { envVars } from "./app/config/env";
import { notfound } from "./app/middleware/notFound";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";

// Global BigInt JSON serialization fix for Prisma BigInt fields
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app: Application = express();

app.set("query parser", (str: string) => qs.parse(str));
app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/template`));
app.use("/api/auth", toNodeHandler(auth));

app.use(
  cors({
    origin: [envVars.FRONTEND_URL, envVars.BETTER_AUTH_URL],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Content-Disposition", "Authorization"]
  })
)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/api/v1", IndexRoutes);


app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Welcome to CloudFusion');
});


app.use(notfound);
app.use(globalErrorHandler);

export default app;