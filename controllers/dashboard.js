const Transaction = require("../models/Transaction")
const Account = require("../models/Account")
const Budget = require("../models/Budget")
const Category = require("../models/Category")
const RecurringTransaction = require("../models/RecurringTransaction")
const { ErrorResponse } = require("../utils/error")

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardData = async (req, res, next) => {
  try {
    const userId = req.user.id
    const today = new Date()

    // Get start of current month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Get accounts
    const accounts = await Account.find({ user: userId })

    // Calculate total balance
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

    // Get monthly income and expenses
    const monthlyTransactions = await Transaction.find({
      user: userId,
      date: { $gte: startOfMonth, $lte: today },
    })

    const monthlyIncome = monthlyTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

    const monthlyExpenses = monthlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

    // Calculate savings rate
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0

    // Get recent transactions
    const recentTransactions = await Transaction.find({ user: userId }).sort({ date: -1 }).limit(5)

    // Get active budgets with progress
    const budgets = await Budget.find({ user: userId, isActive: true })

    const budgetStatus = await Promise.all(
      budgets.map(async (budget) => {
        // Get transactions for this budget's category within the budget period
        let startDate
        const endDate = new Date()

        switch (budget.period) {
          case "weekly":
            startDate = new Date()
            startDate.setDate(startDate.getDate() - startDate.getDay())
            break
          case "monthly":
            startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
            break
          case "yearly":
            startDate = new Date(endDate.getFullYear(), 0, 1)
            break
          default:
            startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
        }

        const transactions = await Transaction.find({
          user: userId,
          type: "expense",
          categoryId: budget.categoryId,
          date: { $gte: startDate, $lte: endDate },
        })

        const spent = transactions.reduce((sum, t) => sum + t.amount, 0)
        const percentage = (spent / budget.amount) * 100

        return {
          _id: budget._id,
          name: budget.name,
          amount: budget.amount,
          spent,
          remaining: budget.amount - spent,
          percentage,
        }
      }),
    )

    // Get upcoming bills (recurring transactions due in the next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    const recurringTransactions = await RecurringTransaction.find({
      user: userId,
      nextDueDate: { $lte: nextWeek },
    }).sort({ nextDueDate: 1 })

    const upcomingBills = recurringTransactions.map((rt) => ({
      _id: rt._id,
      description: rt.description,
      amount: rt.amount,
      dueDate: rt.nextDueDate,
      categoryId: rt.categoryId,
    }))

    // Get top spending categories
    const categories = await Category.find({ user: userId, type: "expense" })

    // Get transactions for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentExpenseTransactions = await Transaction.find({
      user: userId,
      type: "expense",
      date: { $gte: thirtyDaysAgo },
    })

    // Group by category and calculate totals
    const categoryTotals = {}

    recentExpenseTransactions.forEach((transaction) => {
      const categoryId = transaction.categoryId ? transaction.categoryId.toString() : "uncategorized"

      if (!categoryTotals[categoryId]) {
        categoryTotals[categoryId] = 0
      }

      categoryTotals[categoryId] += transaction.amount
    })

    // Map category IDs to names and colors
    const categoryMap = {}
    categories.forEach((category) => {
      categoryMap[category._id.toString()] = {
        name: category.name,
        color: category.color,
      }
    })

    // Create top categories array
    const topCategories = Object.keys(categoryTotals)
      .filter((categoryId) => categoryId !== "uncategorized")
      .map((categoryId) => ({
        _id: categoryId,
        name: categoryMap[categoryId] ? categoryMap[categoryId].name : "Uncategorized",
        color: categoryMap[categoryId] ? categoryMap[categoryId].color : "#9CA3AF",
        total: categoryTotals[categoryId],
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    res.status(200).json({
      success: true,
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      recentTransactions,
      budgetStatus,
      upcomingBills,
      topCategories,
    })
  } catch (err) {
    next(new ErrorResponse(`Error getting dashboard data: ${err.message}`, 500))
  }
}

