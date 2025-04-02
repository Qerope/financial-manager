import express from "express"
import { register, login, verifyEmail, forgotPassword, resetPassword } from "../controllers/auth.js"

const router = express.Router()

// Register a new user
router.post("/register", register)

// Login user
router.post("/login", login)

// Verify email
router.get("/verify-email/:token", verifyEmail)

// Forgot password
router.post("/forgot-password", forgotPassword)

// Reset password
router.post("/reset-password", resetPassword)

export default router

