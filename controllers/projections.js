import Transaction from "../models/Transaction.js"
import Account from "../models/Account.js"

// Get average monthly income and expenses
export const getAverageMonthlyData = async (req, res, next) => {
  try {
    // Get data for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const transactions = await Transaction.find({
      userId: req.user.id,
      date: { $gte: sixMonthsAgo },
      type: { $in: ["income", "expense"] },
    })

    // Group by month and type
    const monthlyData = {}

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 }
      }

      if (transaction.type === "income") {
        monthlyData[monthKey].income += transaction.amount
      } else if (transaction.type === "expense") {
        monthlyData[monthKey].expense += transaction.amount
      }
    })

    // Calculate averages
    const months = Object.keys(monthlyData)
    const totalIncome = months.reduce((sum, month) => sum + monthlyData[month].income, 0)
    const totalExpense = months.reduce((sum, month) => sum + monthlyData[month].expense, 0)

    const averageIncome = months.length > 0 ? totalIncome / months.length : 0
    const averageExpense = months.length > 0 ? totalExpense / months.length : 0

    // Get current net worth
    const accounts = await Account.find({
      userId: req.user.id,
      includeInNetWorth: true,
    })

    const assets = accounts
      .filter((account) => ["checking", "savings", "investment", "cash", "other"].includes(account.type))
      .reduce((sum, account) => sum + account.balance, 0)

    const liabilities = accounts
      .filter((account) => ["credit", "loan"].includes(account.type))
      .reduce((sum, account) => sum + account.balance, 0)

    const netWorth = assets - liabilities

    res.status(200).json({
      success: true,
      data: {
        averageIncome,
        averageExpense,
        currentNetWorth: netWorth,
        monthlyData,
      },
    })
  } catch (err) {
    next(err)
  }
}

// Get income and expense categories with their average amounts
export const getCategoryAverages = async (req, res, next) => {
  try {
    // Get data for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const categoryData = await Transaction.aggregate([
      {
        $match: {
          userId: req.user.id,
          date: { $gte: sixMonthsAgo },
          type: { $in: ["income", "expense"] },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: { path: "$category", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: {
            categoryId: "$categoryId",
            type: "$type",
          },
          categoryName: { $first: "$category.name" },
          categoryColor: { $first: "$category.color" },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: "$_id.categoryId",
          type: "$_id.type",
          name: { $ifNull: ["$categoryName", "Uncategorized"] },
          color: { $ifNull: ["$categoryColor", "#9CA3AF"] },
          totalAmount: 1,
          count: 1,
          averageAmount: { $divide: ["$totalAmount", "$count"] },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ])

    // Separate income and expense categories
    const incomeCategories = categoryData.filter((cat) => cat.type === "income")
    const expenseCategories = categoryData.filter((cat) => cat.type === "expense")

    res.status(200).json({
      success: true,
      data: {
        incomeCategories,
        expenseCategories,
      },
    })
  } catch (err) {
    next(err)
  }
}

