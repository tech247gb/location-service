import express from "express";
import { addDatas, getAllDatas } from "../controller/controller.js";

const router = express.Router();
router.post("/datas", addDatas);
router.get("/datas", getAllDatas);

export default router;
