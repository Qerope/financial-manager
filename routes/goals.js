import express from "express"
import {
  createGoal,
  getUserGoals,
  getGoal,
  updateGoal,
  deleteGoal,
  updateGoalProgress,
  getGoalStats,
} from "../controllers/goals.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

// Create a new goal
router.post("/", verifyToken, createGoal)

// Get all goals for a user
router.get("/", verifyToken, getUserGoals)

// Get a single goal
router.get("/:id", verifyToken, getGoal)

// Update a goal
router.put("/:id", verifyToken, updateGoal)

// Delete a goal
router.delete("/:id", verifyToken, deleteGoal)

// Update goal progress
router.post("/:id/progress", verifyToken, updateGoalProgress)

// Get goal statistics
router.get("/:id/stats", verifyToken, getGoalStats)

export default router

