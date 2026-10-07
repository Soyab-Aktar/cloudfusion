import { Server } from "http";
import app from "./app";
import { envVars } from "./app/config/env";

let server: Server;
const bootstarp = async () => {
  try {
    server = app.listen(envVars.PORT, () => {
      console.log(`Server is running on http://localhost:${envVars.PORT}`);
    })
  } catch (error) {
    console.error('Failed to Start Server :', error);
  }
}

// SIGTERM Signal error
process.on('SIGTERM', (error) => {
  console.log("SIGTERM Signal Received, Server Shuting down ....: ", error);
  if (server) {
    server.close(() => {
      process.exit(0);
    })
  }
  process.exit(0);
})

// SIGINT signal handler
process.on("SIGINT", () => {
  console.log("SIGINT signal received. Shutting down server...");
  if (server) {
    server.close(() => {
      console.log("Server closed gracefully.");
      process.exit(1);
    });
  }
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.log("Uncaught Exception Detected, Server Shuting down ....: ", error);
  if (server) {
    server.close(() => {
      process.exit(1);
    })
  }
  process.exit(1);
})

// Uncaught rejection handler
process.on('unhandledRejection', (error) => {
  console.log("Unhandled Rejection Detected, Server Shuting down ....: ", error);
  if (server) {
    server.close(() => {
      process.exit(1);
    })
  }
  process.exit(1);
})

bootstarp()