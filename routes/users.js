import express from "express"
import { getUser, updateUser, deleteUser, updatePreferences } from "../controllers/users.js"
import { verifyToken, verifyUser } from "../middleware/auth.js"

const router = express.Router()

// Get user profile
router.get("/:id", verifyToken, getUser)

// Update user profile
router.put("/:id", verifyUser, updateUser)

// Delete user
router.delete("/:id", verifyUser, deleteUser)

// Update user preferences
router.put("/:id/preferences", verifyUser, updatePreferences)

export default router

