import express from "express"
import {
  createLinkTokenController,
  exchangePublicTokenController,
  getPlaidItems,
  getPlaidItem,
  deletePlaidItem,
  linkPlaidAccount,
  unlinkPlaidAccount,
  syncTransactionsController,
} from "../controllers/plaid.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

// Create a link token
router.post("/create-link-token", verifyToken, createLinkTokenController)

// Exchange public token
router.post("/exchange-public-token", verifyToken, exchangePublicTokenController)

// Get all Plaid items for a user
router.get("/items", verifyToken, getPlaidItems)

// Get a single Plaid item
router.get("/items/:id", verifyToken, getPlaidItem)

// Delete a Plaid item
router.delete("/items/:id", verifyToken, deletePlaidItem)

// Link a Plaid account to a local account
router.post("/link-account", verifyToken, linkPlaidAccount)

// Unlink a Plaid account from a local account
router.post("/unlink-account", verifyToken, unlinkPlaidAccount)

// Sync transactions for a Plaid item
router.post("/sync/:id", verifyToken, syncTransactionsController)

export default router
