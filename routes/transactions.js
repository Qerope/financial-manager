import express from "express"
import {
  createTransaction,
  getUserTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
} from "../controllers/transactions.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

// Create a new transaction
router.post("/", verifyToken, createTransaction)

// Get all transactions for a user
router.get("/", verifyToken, getUserTransactions)

// Get a single transaction
router.get("/:id", verifyToken, getTransaction)

// Update a transaction
router.put("/:id", verifyToken, updateTransaction)

// Delete a transaction
router.delete("/:id", verifyToken, deleteTransaction)

// Get transaction statistics
router.get("/stats/overview", verifyToken, getTransactionStats)

export default router

