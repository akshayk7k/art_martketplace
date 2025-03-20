import express from "express";
import { getAllArt, uploadArt } from "../controllers/artController.js";

const router = express.Router();

router.get("/", getAllArt);
router.post("/upload", uploadArt);

export default router;
