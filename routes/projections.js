import express from "express"
import { getAverageMonthlyData, getCategoryAverages } from "../controllers/projections.js"
import { protect } from "../middleware/auth.js"

const router = express.Router()

// Apply auth middleware to all routes
router.use(protect)

// Get average monthly income and expenses
router.get("/average-monthly", getAverageMonthlyData)

// Get category averages
router.get("/category-averages", getCategoryAverages)

export default router

