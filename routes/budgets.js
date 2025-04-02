import express from "express"
import {
  createBudget,
  getUserBudgets,
  getBudget,
  updateBudget,
  deleteBudget,
  getBudgetProgress,
  getAllBudgetsProgress,
} from "../controllers/budgets.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

// Create a new budget
router.post("/", verifyToken, createBudget)

// Get all budgets for a user
router.get("/", verifyToken, getUserBudgets)

// Get a single budget
router.get("/:id", verifyToken, getBudget)

// Update a budget
router.put("/:id", verifyToken, updateBudget)

// Delete a budget
router.delete("/:id", verifyToken, deleteBudget)

// Get budget progress
router.get("/:id/progress", verifyToken, getBudgetProgress)

// Get all budgets progress
router.get("/progress/all", verifyToken, getAllBudgetsProgress)

export default router

