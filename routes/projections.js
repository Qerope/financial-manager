import express from "express"
import { getAverageMonthlyData, getCategoryAverages } from "../controllers/projections.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

// Get average monthly income and expenses
router.get("/average-monthly", verifyToken, getAverageMonthlyData)

// Get category averages
router.get("/category-averages", verifyToken, getCategoryAverages)

export default router

