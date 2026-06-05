import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
    res.status(200).json({ message: "El server ta jalando. Teamo Reze." });
});

export default router;