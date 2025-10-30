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
import addressBookRoute from "./routes/addressBookRoute";
import eventsRoute from "./routes/eventsRoute";
import notificationRoute from "./routes/notificationRoute";
import dashboardRoute from "./routes/dashboardRoute";
import webhookStripeRoute from "./routes/stripeWebhookRoute";
import stripeRoute from "./routes/stripeRoute";
import paymentsRoute from "./routes/paymentsRoute";
import { errorMiddleware } from "./middleware";

/* CONFIGURATION */
dotenv.config();
const app = express();
app.use(morgan("common"));

// webhooks stripe must be before bodyParser json
app.use("/", webhookStripeRoute);

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
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
app.use("/address-book", addressBookRoute);
app.use("/events", eventsRoute);
app.use("/notification", notificationRoute);
app.use("/dashboard", dashboardRoute);
app.use("/stripe", stripeRoute);
app.use("/payments", paymentsRoute);

app.use(errorMiddleware);

/* SERVER */
const port = Number(process.env.PORT) || 5000;

app.listen(port, () => `Server running on port ${port}`);
