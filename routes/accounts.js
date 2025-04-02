import express from "express"
import {
  createAccount,
  getUserAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
  getAccountBalanceHistory,
} from "../controllers/accounts.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

// Create a new account
router.post("/", verifyToken, createAccount)

// Get all accounts for a user
router.get("/", verifyToken, getUserAccounts)

// Get a single account
router.get("/:id", verifyToken, getAccount)

// Update an account
router.put("/:id", verifyToken, updateAccount)

// Delete an account
router.delete("/:id", verifyToken, deleteAccount)

// Get account balance history
router.get("/:id/balance-history", verifyToken, getAccountBalanceHistory)

export default router

