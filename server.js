import "dotenv/config";
import { connectDB } from "./src/config/db.js";
import { runInitialSeed } from "./src/config/seed.js";
import app from "./src/app.js";

const PORT = process.env.PORT || 4000;

connectDB().then(async () => {
  await runInitialSeed();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
});
