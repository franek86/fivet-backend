import express from "express";
import {
  createAddressBook,
  deleteAddressBook,
  getAddressBook,
  getSingleAddressBook,
  updateAddressBook,
} from "../controllers/addressBookController";
import { authenticateUser } from "../middleware";

const router = express.Router();

router.get("/", authenticateUser, getAddressBook);
router.post("/create", authenticateUser, createAddressBook);
router.delete("/:id", authenticateUser, deleteAddressBook);
router.patch("/:id", authenticateUser, updateAddressBook);
router.get("/:id", authenticateUser, getSingleAddressBook);

export default router;
