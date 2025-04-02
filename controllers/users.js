import User from "../models/User.js"
import { createError } from "../utils/error.js"
import bcrypt from "bcrypt"

// Get user profile
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password")
    if (!user) {
      return next(createError(404, "User not found"))
    }

    res.status(200).json({
      success: true,
      user,
    })
  } catch (err) {
    next(err)
  }
}

// Update user profile
export const updateUser = async (req, res, next) => {
  try {
    // Ensure user can only update their own profile
    if (req.user.id !== req.params.id) {
      return next(createError(403, "You can only update your own profile"))
    }

    // If password is being updated, hash it
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10)
      req.body.password = await bcrypt.hash(req.body.password, salt)
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).select(
      "-password",
    )

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    })
  } catch (err) {
    next(err)
  }
}

// Delete user
export const deleteUser = async (req, res, next) => {
  try {
    // Ensure user can only delete their own account
    if (req.user.id !== req.params.id) {
      return next(createError(403, "You can only delete your own account"))
    }

    await User.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (err) {
    next(err)
  }
}

// Update user preferences
export const updatePreferences = async (req, res, next) => {
  try {
    // Ensure user can only update their own preferences
    if (req.user.id !== req.params.id) {
      return next(createError(403, "You can only update your own preferences"))
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { preferences: req.body } },
      { new: true },
    ).select("-password")

    res.status(200).json({
      success: true,
      message: "Preferences updated successfully",
      user: updatedUser,
    })
  } catch (err) {
    next(err)
  }
}

