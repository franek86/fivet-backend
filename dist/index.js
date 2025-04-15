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
/* ROUTES IMPORT*/
const authRoute_1 = __importDefault(require("./routes/authRoute"));
const shipRoute_1 = __importDefault(require("./routes/shipRoute"));
const shipTypeRoute_1 = __importDefault(require("./routes/shipTypeRoute"));
const profileRoute_1 = __importDefault(require("./routes/profileRoute"));
/* CONFIGURATION */
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, morgan_1.default)("common"));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
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
/* SERVER */
const port = Number(process.env.PORT) || 5000;
app.listen(port, () => `Server running on port ${port}`);
