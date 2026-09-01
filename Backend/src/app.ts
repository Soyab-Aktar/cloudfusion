import express, { Application, Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth";
import { IndexRoutes } from "./app/routes";
import cookieParser from "cookie-parser";
import path from "path";
import qs from "qs";

// Global BigInt JSON serialization fix for Prisma BigInt fields
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app: Application = express();

app.set("query parser", (str: string) => qs.parse(str));
app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/template`));
app.use("/api/auth", toNodeHandler(auth));


app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(cookieParser());

app.use("/api/v1", IndexRoutes);

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript + Express!');
});

export default app;