import Transaction from "../models/Transaction.js"
import Account from "../models/Account.js"

// Get income vs expense report
export const getIncomeVsExpense = async (req, res, next) => {
  try {
    const { startDate, endDate, period = "monthly" } = req.query

    // Build date range query
    const dateQuery = {}
    if (startDate) dateQuery.$gte = new Date(startDate)
    if (endDate) dateQuery.$lte = new Date(endDate)

    // Define group by period
    let groupBy
    switch (period) {
      case "daily":
        groupBy = {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" },
        }
        break
      case "weekly":
        groupBy = {
          year: { $year: "$date" },
          week: { $week: "$date" },
        }
        break
      case "monthly":
        groupBy = {
          year: { $year: "$date" },
          month: { $month: "$date" },
        }
        break
      case "quarterly":
        groupBy = {
          year: { $year: "$date" },
          quarter: { $ceil: { $divide: [{ $month: "$date" }, 3] } },
        }
        break
      case "yearly":
        groupBy = {
          year: { $year: "$date" },
        }
        break
      default:
        groupBy = {
          year: { $year: "$date" },
          month: { $month: "$date" },
        }
    }

    // Get income and expense data
    const incomeExpenseData = await Transaction.aggregate([
      {
        $match: {
          userId: req.user.id,
          type: { $in: ["income", "expense"] },
          ...(Object.keys(dateQuery).length > 0 && { date: dateQuery }),
        },
      },
      {
        $group: {
          _id: {
            type: "$type",
            ...groupBy,
          },
          total: { $sum: "$amount" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
          "_id.week": 1,
          "_id.quarter": 1,
        },
      },
    ])

    // Format the data for response
    const formattedData = []
    const periods = new Set()
    const incomeByPeriod = {}
    const expenseByPeriod = {}

    incomeExpenseData.forEach((item) => {
      let periodKey

      switch (period) {
        case "daily":
          periodKey = `${item._id.year}-${item._id.month.toString().padStart(2, "0")}-${item._id.day.toString().padStart(2, "0")}`
          break
        case "weekly":
          periodKey = `${item._id.year}-W${item._id.week.toString().padStart(2, "0")}`
          break
        case "monthly":
          periodKey = `${item._id.year}-${item._id.month.toString().padStart(2, "0")}`
          break
        case "quarterly":
          periodKey = `${item._id.year}-Q${item._id.quarter}`
          break
        case "yearly":
          periodKey = `${item._id.year}`
          break
        default:
          periodKey = `${item._id.year}-${item._id.month.toString().padStart(2, "0")}`
      }

      periods.add(periodKey)

      if (item._id.type === "income") {
        incomeByPeriod[periodKey] = item.total
      } else {
        expenseByPeriod[periodKey] = item.total
      }
    })

    // Create the final formatted data
    Array.from(periods)
      .sort()
      .forEach((period) => {
        formattedData.push({
          period,
          income: incomeByPeriod[period] || 0,
          expense: expenseByPeriod[period] || 0,
          net: (incomeByPeriod[period] || 0) - (expenseByPeriod[period] || 0),
        })
      })

    res.status(200).json({
      success: true,
      data: formattedData,
    })
  } catch (err) {
    next(err)
  }
}

// Get expense by category report
export const getExpenseByCategory = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query

    // Build date range query
    const dateQuery = {}
    if (startDate) dateQuery.$gte = new Date(startDate)
    if (endDate) dateQuery.$lte = new Date(endDate)

    // Get expense data by category
    const expenseData = await Transaction.aggregate([
      {
        $match: {
          userId: req.user.id,
          type: "expense",
          ...(Object.keys(dateQuery).length > 0 && { date: dateQuery }),
        },
      },
      {
        $group: {
          _id: "$categoryId",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: { path: "$category", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          total: 1,
          count: 1,
          categoryName: "$category.name",
          categoryColor: "$category.color",
          categoryIcon: "$category.icon",
        },
      },
      {
        $sort: { total: -1 },
      },
    ])

    // Calculate total expenses
    const totalExpense = expenseData.reduce((sum, item) => sum + item.total, 0)

    // Add percentage to each category
    const formattedData = expenseData.map((item) => ({
      ...item,
      percentage: totalExpense > 0 ? (item.total / totalExpense) * 100 : 0,
    }))

    res.status(200).json({
      success: true,
      totalExpense,
      data: formattedData,
    })
  } catch (err) {
    next(err)
  }
}

// Get net worth report
export const getNetWorth = async (req, res, next) => {
  try {
    // Get all accounts for the user
    const accounts = await Account.find({
      userId: req.user.id,
      includeInNetWorth: true,
    })

    // Calculate current net worth
    const assets = accounts
      .filter((account) => ["checking", "savings", "investment", "cash", "other"].includes(account.type))
      .reduce((sum, account) => sum + account.balance, 0)

    const liabilities = accounts
      .filter((account) => ["credit", "loan"].includes(account.type))
      .reduce((sum, account) => sum + account.balance, 0)

    const netWorth = assets - liabilities

    // Get historical net worth data
    // This is a simplified approach - for a real app, you'd need to track balance history
    const transactions = await Transaction.find({
      userId: req.user.id,
      accountId: { $in: accounts.map((account) => account._id) },
    }).sort({ date: 1 })

    // Group transactions by month
    const monthlyData = {}
    const startingBalances = {}

    // Initialize starting balances for each account
    accounts.forEach((account) => {
      startingBalances[account._id.toString()] = account.balance
    })

    // Calculate running balances backwards from current state
    transactions.reverse().forEach((transaction) => {
      const accountId = transaction.accountId.toString()
      const account = accounts.find((a) => a._id.toString() === accountId)

      if (account) {
        if (transaction.type === "income") {
          startingBalances[accountId] -= transaction.amount
        } else if (transaction.type === "expense") {
          startingBalances[accountId] += transaction.amount
        } else if (transaction.type === "transfer") {
          startingBalances[accountId] += transaction.amount

          if (transaction.transferAccountId) {
            const transferAccountId = transaction.transferAccountId.toString()
            if (startingBalances[transferAccountId] !== undefined) {
              startingBalances[transferAccountId] -= transaction.amount
            }
          }
        }
      }
    })

    // Now calculate monthly net worth going forward
    const monthlyNetWorth = []
    const runningBalances = { ...startingBalances }

    // Get the earliest transaction date
    const earliestTransaction =
      transactions.length > 0 ? new Date(transactions[transactions.length - 1].date) : new Date()

    // Create monthly data points from earliest transaction to now
    const now = new Date()
    const startYear = earliestTransaction.getFullYear()
    const startMonth = earliestTransaction.getMonth()
    const endYear = now.getFullYear()
    const endMonth = now.getMonth()

    // Sort transactions by date (ascending)
    transactions.reverse()
    let transactionIndex = 0

    for (let year = startYear; year <= endYear; year++) {
      const monthStart = year === startYear ? startMonth : 0
      const monthEnd = year === endYear ? endMonth : 11

      for (let month = monthStart; month <= monthEnd; month++) {
        const periodStart = new Date(year, month, 1)
        const periodEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)

        // Process all transactions in this month
        while (
          transactionIndex < transactions.length &&
          transactions[transactionIndex].date >= periodStart &&
          transactions[transactionIndex].date <= periodEnd
        ) {
          const transaction = transactions[transactionIndex]
          const accountId = transaction.accountId.toString()

          if (runningBalances[accountId] !== undefined) {
            if (transaction.type === "income") {
              runningBalances[accountId] += transaction.amount
            } else if (transaction.type === "expense") {
              runningBalances[accountId] -= transaction.amount
            } else if (transaction.type === "transfer") {
              runningBalances[accountId] -= transaction.amount

              if (transaction.transferAccountId) {
                const transferAccountId = transaction.transferAccountId.toString()
                if (runningBalances[transferAccountId] !== undefined) {
                  runningBalances[transferAccountId] += transaction.amount
                }
              }
            }
          }

          transactionIndex++
        }

        // Calculate net worth for this month
        const monthlyAssets = accounts
          .filter((account) => ["checking", "savings", "investment", "cash", "other"].includes(account.type))
          .reduce((sum, account) => sum + (runningBalances[account._id.toString()] || 0), 0)

        const monthlyLiabilities = accounts
          .filter((account) => ["credit", "loan"].includes(account.type))
          .reduce((sum, account) => sum + (runningBalances[account._id.toString()] || 0), 0)

        const monthlyNet = monthlyAssets - monthlyLiabilities

        monthlyNetWorth.push({
          date: `${year}-${(month + 1).toString().padStart(2, "0")}`,
          assets: monthlyAssets,
          liabilities: monthlyLiabilities,
          netWorth: monthlyNet,
        })
      }
    }

    res.status(200).json({
      success: true,
      currentNetWorth: {
        assets,
        liabilities,
        netWorth,
      },
      history: monthlyNetWorth,
    })
  } catch (err) {
    next(err)
  }
}

// Get cash flow report
export const getCashFlow = async (req, res, next) => {
  try {
    const { startDate, endDate, period = "monthly" } = req.query

    // Build date range query
    const dateQuery = {}
    if (startDate) dateQuery.$gte = new Date(startDate)
    if (endDate) dateQuery.$lte = new Date(endDate)

    // Define group by period
    let groupBy
    switch (period) {
      case "daily":
        groupBy = {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" },
        }
        break
      case "weekly":
        groupBy = {
          year: { $year: "$date" },
          week: { $week: "$date" },
        }
        break
      case "monthly":
        groupBy = {
          year: { $year: "$date" },
          month: { $month: "$date" },
        }
        break
      case "yearly":
        groupBy = {
          year: { $year: "$date" },
        }
        break
      default:
        groupBy = {
          year: { $year: "$date" },
          month: { $month: "$date" },
        }
    }

    // Get cash flow data by category
    const cashFlowData = await Transaction.aggregate([
      {
        $match: {
          userId: req.user.id,
          type: { $in: ["income", "expense"] },
          ...(Object.keys(dateQuery).length > 0 && { date: dateQuery }),
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
            type: "$type",
            category: "$category.name",
            ...groupBy,
          },
          total: { $sum: "$amount" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
          "_id.week": 1,
          total: -1,
        },
      },
    ])

    // Format the data for response
    const formattedData = []
    const periods = new Set()
    const categoriesByType = { income: new Set(), expense: new Set() }
    const dataByPeriodAndCategory = {}

    // Process the aggregation results
    cashFlowData.forEach((item) => {
      let periodKey

      switch (period) {
        case "daily":
          periodKey = `${item._id.year}-${item._id.month.toString().padStart(2, "0")}-${item._id.day.toString().padStart(2, "0")}`
          break
        case "weekly":
          periodKey = `${item._id.year}-W${item._id.week.toString().padStart(2, "0")}`
          break
        case "monthly":
          periodKey = `${item._id.year}-${item._id.month.toString().padStart(2, "0")}`
          break
        case "yearly":
          periodKey = `${item._id.year}`
          break
        default:
          periodKey = `${item._id.year}-${item._id.month.toString().padStart(2, "0")}`
      }

      periods.add(periodKey)

      const type = item._id.type
      const category = item._id.category || "Uncategorized"
      categoriesByType[type].add(category)

      if (!dataByPeriodAndCategory[periodKey]) {
        dataByPeriodAndCategory[periodKey] = {
          income: {},
          expense: {},
          totalIncome: 0,
          totalExpense: 0,
          netCashFlow: 0,
        }
      }

      dataByPeriodAndCategory[periodKey][type][category] = item.total

      if (type === "income") {
        dataByPeriodAndCategory[periodKey].totalIncome += item.total
      } else {
        dataByPeriodAndCategory[periodKey].totalExpense += item.total
      }

      dataByPeriodAndCategory[periodKey].netCashFlow =
        dataByPeriodAndCategory[periodKey].totalIncome - dataByPeriodAndCategory[periodKey].totalExpense
    })

    // Create the final formatted data
    Array.from(periods)
      .sort()
      .forEach((period) => {
        const periodData = {
          period,
          income: {},
          expense: {},
          ...dataByPeriodAndCategory[period],
        }

        formattedData.push(periodData)
      })

    res.status(200).json({
      success: true,
      incomeCategories: Array.from(categoriesByType.income),
      expenseCategories: Array.from(categoriesByType.expense),
      data: formattedData,
    })
  } catch (err) {
    next(err)
  }
}

