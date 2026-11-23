import { Server } from "http";
import app from "./app";
import { envVars } from "./app/config/env";
import { prisma } from "./app/lib/prisma";

let server: Server;

const bootstrap = async () => {
  try {
    server = app.listen(envVars.PORT, () => {
      console.log(`Server is running on http://localhost:${envVars.PORT}`);
    });
  } catch (error) {
    console.error("Failed to Start Server :", error);
    process.exit(1);
  }
};

let isShuttingDown = false;

const gracefulShutdown = async (signalOrReason: string, exitCode: number) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${signalOrReason} received. Initiating graceful shutdown...`);

  // Safety fallback: force exit after 10s if connections or open handles hang
  const forceExitTimeout = setTimeout(() => {
    console.error("Graceful shutdown timed out after 10s. Forcing exit.");
    process.exit(1);
  }, 10_000);
  forceExitTimeout.unref();

  if (server) {
    server.close(async (err) => {
      if (err) {
        console.error("Error while closing HTTP server:", err);
      } else {
        console.log("HTTP server closed successfully.");
      }

      try {
        await prisma.$disconnect();
        console.log("Prisma disconnected successfully.");
      } catch (dbErr) {
        console.error("Error disconnecting Prisma:", dbErr);
      }

      process.exit(exitCode);
    });
  } else {
    try {
      await prisma.$disconnect();
    } catch (dbErr) {
      console.error("Error disconnecting Prisma:", dbErr);
    }
    process.exit(exitCode);
  }
};

// OS termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM", 0));
process.on("SIGINT", () => gracefulShutdown("SIGINT", 0));

// Process exception handlers
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception Detected:", error);
  gracefulShutdown("uncaughtException", 1);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection Detected:", error);
  gracefulShutdown("unhandledRejection", 1);
});

bootstrap();