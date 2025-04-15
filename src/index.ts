import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

/* ROUTES IMPORT*/
import authRoute from "./routes/authRoute";
import shipRoute from "./routes/shipRoute";
import shipTypeRoute from "./routes/shipTypeRoute";
import profileRouter from "./routes/profileRoute";

/* CONFIGURATION */
dotenv.config();
const app = express();
app.use(express.json());
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

/* ROUTES */
app.get("/", (req, res) => {
  res.send("This is a home route");
  console.log("home route");
});

app.use("/auth", authRoute);
app.use("/ships", shipRoute);
app.use("/shipType", shipTypeRoute);
app.use("/profile", profileRouter);

/* SERVER */
const port = Number(process.env.PORT) || 5000;

app.listen(port, () => `Server running on port ${port}`);
