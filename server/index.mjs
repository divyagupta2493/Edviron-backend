import express from "express";
import cors from "cors";
import "./loadEnvironment.mjs";
import "express-async-errors";
import dashboards from "./routes/dashboards.mjs";

const PORT = process.env.PORT || 5150;
const app = express();

app.use(cors());
app.use(express.json());

// Dashboard routes
app.use("/dashboards", dashboards);

// Global error handling
app.use((err, _req, res, next) => {
  res.status(500).send("Uh oh! An unexpected error occured.")
})

// start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
