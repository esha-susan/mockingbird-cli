import { Router } from "express";

const router = Router();

router.get("/products", getProducts);
router.get("/products/:id", getProductById);
router.post("/products", authMiddleware, createProduct);

export default router;
