import express, { Request, Response } from "express";
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
import postRoute from "./routes/postRoute";

/* MIDDLEWARES */
import { errorMiddleware } from "./middleware";

/* SOCKET SERVICE */
import { initializeSocket } from "./services/socket.service";
import helmet from "helmet";

/* CONFIGURATION */
dotenv.config();

const app = express();
const httpServer = http.createServer(app);

app.set("trust proxy", 1);

/* Security middlewears to set various http headers */
app.use(helmet());

const allowedOrigins = [process.env.FRONTEND_URL, process.env.WEB_URL].filter(Boolean);
console.log("Allowed origins:", allowedOrigins);

const corsOptions = {
  origin: (origin: string | undefined, callback: any) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    console.log("Blocked CORS origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

/* LOGGING */
app.use(morgan("common"));

app.use(cors(corsOptions));

/* WEBHOOKS STRIPE MUST BE BEFORE bodyParser json  */
app.use("/", webhookStripeRoute);

/* MIDDLEWARES */
app.use(express.json());
//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Socket.IO
initializeSocket(httpServer);

/* ROUTES */
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", message: "Servis is healthy" });
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
app.use("/posts", postRoute);

app.use(errorMiddleware);

/* SERVER START */
const port = Number(process.env.PORT) || 5000;
httpServer.listen(port, () => console.log(`Server running on port ${port}`));
