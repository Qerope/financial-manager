import express from "express"
import {
  createCategory,
  getUserCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
} from "../controllers/categories.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

// Create a new category
router.post("/", verifyToken, createCategory)

// Get all categories for a user
router.get("/", verifyToken, getUserCategories)

// Get a single category
router.get("/:id", verifyToken, getCategory)

// Update a category
router.put("/:id", verifyToken, updateCategory)

// Delete a category
router.delete("/:id", verifyToken, deleteCategory)

// Get category statistics
router.get("/stats/overview", verifyToken, getCategoryStats)

export default router

