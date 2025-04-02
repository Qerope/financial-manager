import User from "../models/User.js"
import { createError } from "../utils/error.js"
import jwt from "jsonwebtoken"
import crypto from "crypto"

// Register a new user
export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return next(createError(400, "User already exists with this email"))
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      verificationToken,
    })

    await newUser.save()

    // Send verification email
    // This is a simplified version - in production, use a proper email service
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser._doc

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please verify your email.",
      user: userWithoutPassword,
    })
  } catch (err) {
    next(err)
  }
}

// Login user
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return next(createError(404, "User not found"))
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password)
    if (!isPasswordCorrect) {
      return next(createError(400, "Wrong password or email"))
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user._doc

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
      token,
    })
  } catch (err) {
    next(err)
  }
}

// Verify email
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params

    const user = await User.findOne({ verificationToken: token })
    if (!user) {
      return next(createError(400, "Invalid or expired verification token"))
    }

    user.isVerified = true
    user.verificationToken = undefined
    await user.save()

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    })
  } catch (err) {
    next(err)
  }
}

// Forgot password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return next(createError(404, "User not found"))
    }

    // Create reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = Date.now() + 3600000 // 1 hour
    await user.save()

    // Send reset email
    // This is a simplified version - in production, use a proper email service
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    })
  } catch (err) {
    next(err)
  }
}

// Reset password
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return next(createError(400, "Invalid or expired reset token"))
    }

    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    })
  } catch (err) {
    next(err)
  }
}

