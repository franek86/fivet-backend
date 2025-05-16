import express from "express";
import { createAddressBook, getAddressBook } from "../controllers/addressBookController";
import { authenticateUser } from "../middleware";

const router = express.Router();

router.get("/", authenticateUser, getAddressBook);
router.post("/create", authenticateUser, createAddressBook);

export default router;
