import app from "./app";
import { envVars } from "./app/config/env";

const bootstarp = () => {
  try {
    app.listen(envVars.PORT, () => {
      console.log(`Server is running on http://localhost:${envVars.PORT}`);
    })
  } catch (err) {
    console.error("Failed to start server: ", err);
  }
}

bootstarp()