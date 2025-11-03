"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = __importDefault(require("http"));
/* ROUTES IMPORT*/
const authRoute_1 = __importDefault(require("./routes/authRoute"));
const shipRoute_1 = __importDefault(require("./routes/shipRoute"));
const shipTypeRoute_1 = __importDefault(require("./routes/shipTypeRoute"));
const profileRoute_1 = __importDefault(require("./routes/profileRoute"));
const addressBookRoute_1 = __importDefault(require("./routes/addressBookRoute"));
const eventsRoute_1 = __importDefault(require("./routes/eventsRoute"));
const notificationRoute_1 = __importDefault(require("./routes/notificationRoute"));
const dashboardRoute_1 = __importDefault(require("./routes/dashboardRoute"));
const stripeWebhookRoute_1 = __importDefault(require("./routes/stripeWebhookRoute"));
const stripeRoute_1 = __importDefault(require("./routes/stripeRoute"));
const paymentsRoute_1 = __importDefault(require("./routes/paymentsRoute"));
/* MIDDLEWARES */
const middleware_1 = require("./middleware");
/* SOCKET SERVICE */
const socket_service_1 = require("./services/socket.service");
/* CONFIGURATION */
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
/* LOGGING */
app.use((0, morgan_1.default)("common"));
/* WEBHOOKS STRIPE MUST BE BEFORE bodyParser json  */
app.use("/", stripeWebhookRoute_1.default);
/* MIDDLEWARES */
app.use(express_1.default.json());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
/* ROUTES */
app.get("/", (req, res) => {
    res.send("This is a home route");
    console.log("home route");
});
app.use("/auth", authRoute_1.default);
app.use("/ships", shipRoute_1.default);
app.use("/shipType", shipTypeRoute_1.default);
app.use("/profile", profileRoute_1.default);
app.use("/address-book", addressBookRoute_1.default);
app.use("/events", eventsRoute_1.default);
app.use("/notification", notificationRoute_1.default);
app.use("/dashboard", dashboardRoute_1.default);
app.use("/stripe", stripeRoute_1.default);
app.use("/payments", paymentsRoute_1.default);
app.use(middleware_1.errorMiddleware);
// Socket.IO
(0, socket_service_1.initializeSocket)(httpServer);
/* SERVER START */
const port = Number(process.env.PORT) || 5000;
httpServer.listen(port, () => `Server running on port ${port}`);
