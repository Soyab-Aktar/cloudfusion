import app from "./app";

const bootstarp = () => {
  try {
    app.listen(process.env.port, () => {
      console.log(`Server is running on http://localhost:${process.env.port}`);
    })
  } catch (err) {
    console.error("Failed to start server: ", err);
  }
}

bootstarp()