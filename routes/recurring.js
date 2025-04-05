import express from "express"
import {
  createRecurringTransaction,
  getUserRecurringTransactions,
  getRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  generateTransaction,
} from "../controllers/recurring.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

// Create a new recurring transaction
router.post("/", verifyToken, createRecurringTransaction)

// Get all recurring transactions for a user
router.get("/", verifyToken, getUserRecurringTransactions)

// Get a single recurring transaction
router.get("/:id", verifyToken, getRecurringTransaction)

// Update a recurring transaction
router.put("/:id", verifyToken, updateRecurringTransaction)

// Delete a recurring transaction
router.delete("/:id", verifyToken, deleteRecurringTransaction)

// Generate a transaction from a recurring transaction
router.post("/:id/generate", verifyToken, generateTransaction)

export default router

