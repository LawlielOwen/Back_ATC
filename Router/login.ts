import {AuthController} from "../Controller/AuthController";
import {Router} from "express";

const router = Router();

router.post("/login", AuthController);

export default router;