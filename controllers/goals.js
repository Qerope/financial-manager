import Goal from "../models/Goal.js"
import { createError } from "../utils/error.js"

// Create a new goal
export const createGoal = async (req, res, next) => {
  try {
    const newGoal = new Goal({
      ...req.body,
      userId: req.user.id,
    })

    const savedGoal = await newGoal.save()

    res.status(201).json({
      success: true,
      message: "Goal created successfully",
      goal: savedGoal,
    })
  } catch (err) {
    next(err)
  }
}

// Get all goals for a user
export const getUserGoals = async (req, res, next) => {
  try {
    const { isCompleted, type } = req.query

    const query = { userId: req.user.id }
    if (isCompleted !== undefined) query.isCompleted = isCompleted === "true"
    if (type) query.type = type

    const goals = await Goal.find(query).populate("linkedAccountId", "name type")

    res.status(200).json({
      success: true,
      count: goals.length,
      goals,
    })
  } catch (err) {
    next(err)
  }
}

// Get a single goal
export const getGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id).populate("linkedAccountId", "name type")

    if (!goal) {
      return next(createError(404, "Goal not found"))
    }

    // Check if the goal belongs to the user
    if (goal.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only view your own goals"))
    }

    res.status(200).json({
      success: true,
      goal,
    })
  } catch (err) {
    next(err)
  }
}

// Update a goal
export const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id)

    if (!goal) {
      return next(createError(404, "Goal not found"))
    }

    // Check if the goal belongs to the user
    if (goal.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only update your own goals"))
    }

    // Check if goal is being marked as completed
    if (!goal.isCompleted && req.body.isCompleted) {
      req.body.currentAmount = req.body.targetAmount || goal.targetAmount
    }

    const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).populate(
      "linkedAccountId",
      "name type",
    )

    res.status(200).json({
      success: true,
      message: "Goal updated successfully",
      goal: updatedGoal,
    })
  } catch (err) {
    next(err)
  }
}

// Delete a goal
export const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id)

    if (!goal) {
      return next(createError(404, "Goal not found"))
    }

    // Check if the goal belongs to the user
    if (goal.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only delete your own goals"))
    }

    await Goal.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: "Goal deleted successfully",
    })
  } catch (err) {
    next(err)
  }
}

// Update goal progress
export const updateGoalProgress = async (req, res, next) => {
  try {
    const { amount } = req.body

    if (!amount) {
      return next(createError(400, "Amount is required"))
    }

    const goal = await Goal.findById(req.params.id)

    if (!goal) {
      return next(createError(404, "Goal not found"))
    }

    // Check if the goal belongs to the user
    if (goal.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only update your own goals"))
    }

    // Update current amount
    goal.currentAmount += Number(amount)

    // Check if goal is completed
    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true
      goal.currentAmount = goal.targetAmount // Cap at target amount
    }

    // Check for milestone notifications
    if (goal.notifications && goal.notifications.enabled && goal.notifications.milestones) {
      const percentage = (goal.currentAmount / goal.targetAmount) * 100

      goal.notifications.milestones.forEach((milestone, index) => {
        if (!milestone.reached && percentage >= milestone.percentage) {
          goal.notifications.milestones[index].reached = true
        }
      })
    }

    await goal.save()

    res.status(200).json({
      success: true,
      message: "Goal progress updated successfully",
      goal,
    })
  } catch (err) {
    next(err)
  }
}

// Get goal progress statistics
export const getGoalStats = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id)

    if (!goal) {
      return next(createError(404, "Goal not found"))
    }

    // Check if the goal belongs to the user
    if (goal.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only view your own goals"))
    }

    // Calculate progress percentage
    const percentage = (goal.currentAmount / goal.targetAmount) * 100

    // Calculate remaining amount
    const remaining = goal.targetAmount - goal.currentAmount

    // Calculate time statistics
    const now = new Date()
    const startDate = new Date(goal.startDate)
    const targetDate = new Date(goal.targetDate)

    const totalDays = Math.ceil((targetDate - startDate) / (1000 * 60 * 60 * 24))
    const elapsedDays = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24))
    const remainingDays = Math.max(0, Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24)))

    // Calculate daily target
    const dailyTarget = remaining / (remainingDays || 1)

    // Calculate if on track
    const expectedProgress = (elapsedDays / totalDays) * goal.targetAmount
    const onTrack = goal.currentAmount >= expectedProgress

    res.status(200).json({
      success: true,
      goal: {
        _id: goal._id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        type: goal.type,
        startDate: goal.startDate,
        targetDate: goal.targetDate,
        isCompleted: goal.isCompleted,
      },
      stats: {
        percentage,
        remaining,
        totalDays,
        elapsedDays,
        remainingDays,
        dailyTarget,
        onTrack,
        expectedProgress,
      },
    })
  } catch (err) {
    next(err)
  }
}

