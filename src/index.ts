import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import http from "http";

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

/* MIDDLEWARES */
import { errorMiddleware } from "./middleware";

/* SOCKET SERVICE */
import { initializeSocket } from "./services/socket.service";

/* CONFIGURATION */
dotenv.config();

const app = express();
const httpServer = http.createServer(app);

/* LOGGING */
app.use(morgan("common"));

/* WEBHOOKS STRIPE MUST BE BEFORE bodyParser json  */
app.use("/", webhookStripeRoute);

/* MIDDLEWARES */
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

// Socket.IO
initializeSocket(httpServer);

/* SERVER START */
const port = Number(process.env.PORT) || 5000;
httpServer.listen(port, () => `Server running on port ${port}`);
