import express from "express"
import { getIncomeVsExpense, getExpenseByCategory, getNetWorth, getCashFlow } from "../controllers/reports.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

// Get income vs expense report
router.get("/income-vs-expense", verifyToken, getIncomeVsExpense)

// Get expense by category report
router.get("/expense-by-category", verifyToken, getExpenseByCategory)

// Get net worth report
router.get("/net-worth", verifyToken, getNetWorth)

// Get cash flow report
router.get("/cash-flow", verifyToken, getCashFlow)

export default router

