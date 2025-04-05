import Budget from "../models/Budget.js"
import Transaction from "../models/Transaction.js"
import { createError } from "../utils/error.js"

// Create a new budget
export const createBudget = async (req, res, next) => {
  try {
    const newBudget = new Budget({
      ...req.body,
      userId: req.user.id,
    })

    const savedBudget = await newBudget.save()

    res.status(201).json({
      success: true,
      message: "Budget created successfully",
      budget: savedBudget,
    })
  } catch (err) {
    next(err)
  }
}

// Get all budgets for a user
export const getUserBudgets = async (req, res, next) => {
  try {
    const { isActive } = req.query

    const query = { userId: req.user.id }
    if (isActive !== undefined) query.isActive = isActive === "true"

    const budgets = await Budget.find(query).populate("categoryId", "name color icon type")

    res.status(200).json({
      success: true,
      count: budgets.length,
      budgets,
    })
  } catch (err) {
    next(err)
  }
}

// Get a single budget
export const getBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id).populate("categoryId", "name color icon type")

    if (!budget) {
      return next(createError(404, "Budget not found"))
    }

    // Check if the budget belongs to the user
    if (budget.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only view your own budgets"))
    }

    res.status(200).json({
      success: true,
      budget,
    })
  } catch (err) {
    next(err)
  }
}

// Update a budget
export const updateBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id)

    if (!budget) {
      return next(createError(404, "Budget not found"))
    }

    // Check if the budget belongs to the user
    if (budget.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only update your own budgets"))
    }

    const updatedBudget = await Budget.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).populate(
      "categoryId",
      "name color icon type",
    )

    res.status(200).json({
      success: true,
      message: "Budget updated successfully",
      budget: updatedBudget,
    })
  } catch (err) {
    next(err)
  }
}

// Delete a budget
export const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id)

    if (!budget) {
      return next(createError(404, "Budget not found"))
    }

    // Check if the budget belongs to the user
    if (budget.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only delete your own budgets"))
    }

    await Budget.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: "Budget deleted successfully",
    })
  } catch (err) {
    next(err)
  }
}

// Get budget progress
export const getBudgetProgress = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id).populate("categoryId", "name color icon type")

    if (!budget) {
      return next(createError(404, "Budget not found"))
    }

    // Check if the budget belongs to the user
    if (budget.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only view your own budgets"))
    }

    // Calculate date range for current period
    const now = new Date()
    let periodStart, periodEnd

    switch (budget.period) {
      case "daily":
        periodStart = new Date(now.setHours(0, 0, 0, 0))
        periodEnd = new Date(now.setHours(23, 59, 59, 999))
        break
      case "weekly":
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
        periodStart = new Date(now.setDate(diff))
        periodStart.setHours(0, 0, 0, 0)
        periodEnd = new Date(periodStart)
        periodEnd.setDate(periodStart.getDate() + 6)
        periodEnd.setHours(23, 59, 59, 999)
        break
      case "monthly":
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      case "yearly":
        periodStart = new Date(now.getFullYear(), 0, 1)
        periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
        break
      case "custom":
        periodStart = new Date(budget.startDate)
        periodEnd = budget.endDate ? new Date(budget.endDate) : new Date(now.getFullYear() + 10, 11, 31)
        break
      default:
        periodStart = new Date(budget.startDate)
        periodEnd = budget.endDate ? new Date(budget.endDate) : new Date(now.getFullYear() + 10, 11, 31)
    }

    // Get transactions for this category in the current period
    const query = {
      userId: req.user.id,
      date: { $gte: periodStart, $lte: periodEnd },
      type: "expense",
    }

    if (budget.categoryId) {
      query.categoryId = budget.categoryId
    }

    const transactions = await Transaction.find(query)

    // Calculate spent amount
    const spent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0)

    // Calculate progress percentage
    const percentage = (spent / budget.amount) * 100

    // Calculate remaining amount
    const remaining = budget.amount - spent

    // Calculate daily budget
    const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24))
    const elapsedDays = Math.ceil((now - periodStart) / (1000 * 60 * 60 * 24))
    const dailyBudget = budget.amount / totalDays
    const expectedSpending = dailyBudget * elapsedDays
    const status = spent <= expectedSpending ? "under" : "over"

    res.status(200).json({
      success: true,
      budget: {
        _id: budget._id,
        name: budget.name,
        amount: budget.amount,
        period: budget.period,
        category: budget.categoryId,
      },
      progress: {
        spent,
        remaining,
        percentage,
        periodStart,
        periodEnd,
        dailyBudget,
        expectedSpending,
        status,
        transactions: transactions.length,
      },
    })
  } catch (err) {
    next(err)
  }
}

// Get all budget progress
export const getAllBudgetsProgress = async (req, res, next) => {
  try {
    const budgets = await Budget.find({
      userId: req.user.id,
      isActive: true,
    }).populate("categoryId", "name color icon type")

    const budgetsProgress = await Promise.all(
      budgets.map(async (budget) => {
        // Calculate date range for current period
        const now = new Date()
        let periodStart, periodEnd

        switch (budget.period) {
          case "daily":
            periodStart = new Date(now.setHours(0, 0, 0, 0))
            periodEnd = new Date(now.setHours(23, 59, 59, 999))
            break
          case "weekly":
            const day = now.getDay()
            const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
            periodStart = new Date(now.setDate(diff))
            periodStart.setHours(0, 0, 0, 0)
            periodEnd = new Date(periodStart)
            periodEnd.setDate(periodStart.getDate() + 6)
            periodEnd.setHours(23, 59, 59, 999)
            break
          case "monthly":
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
            periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
            break
          case "yearly":
            periodStart = new Date(now.getFullYear(), 0, 1)
            periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
            break
          case "custom":
            periodStart = new Date(budget.startDate)
            periodEnd = budget.endDate ? new Date(budget.endDate) : new Date(now.getFullYear() + 10, 11, 31)
            break
          default:
            periodStart = new Date(budget.startDate)
            periodEnd = budget.endDate ? new Date(budget.endDate) : new Date(now.getFullYear() + 10, 11, 31)
        }

        // Get transactions for this category in the current period
        const query = {
          userId: req.user.id,
          date: { $gte: periodStart, $lte: periodEnd },
          type: "expense",
        }

        if (budget.categoryId) {
          query.categoryId = budget.categoryId
        }

        const transactions = await Transaction.find(query)

        // Calculate spent amount
        const spent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0)

        // Calculate progress percentage
        const percentage = (spent / budget.amount) * 100

        // Calculate remaining amount
        const remaining = budget.amount - spent

        // Calculate daily budget
        const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24))
        const elapsedDays = Math.ceil((now - periodStart) / (1000 * 60 * 60 * 24))
        const dailyBudget = budget.amount / totalDays
        const expectedSpending = dailyBudget * elapsedDays
        const status = spent <= expectedSpending ? "under" : "over"

        return {
          _id: budget._id,
          name: budget.name,
          amount: budget.amount,
          period: budget.period,
          category: budget.categoryId,
          progress: {
            spent,
            remaining,
            percentage,
            periodStart,
            periodEnd,
            dailyBudget,
            expectedSpending,
            status,
          },
        }
      }),
    )

    res.status(200).json({
      success: true,
      count: budgetsProgress.length,
      budgets: budgetsProgress,
    })
  } catch (err) {
    next(err)
  }
}

