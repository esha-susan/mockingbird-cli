import { Router } from "express";

const router = Router();

router.post("/auth/login", login);
router.post("/auth/register", register);
router.post("/auth/logout", authMiddleware, logout);

export default router;
