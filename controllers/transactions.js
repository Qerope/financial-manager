import Transaction from "../models/Transaction.js"
import Account from "../models/Account.js"
import { createError } from "../utils/error.js"

// Create a new transaction
export const createTransaction = async (req, res, next) => {
  try {
    const { accountId, transferAccountId, amount, type } = req.body

    // Verify account belongs to user
    const account = await Account.findOne({
      _id: accountId,
      userId: req.user.id,
    })

    if (!account) {
      return next(createError(404, "Account not found or doesn't belong to you"))
    }

    // If it's a transfer, verify the target account
    if (type === "transfer" && transferAccountId) {
      const targetAccount = await Account.findOne({
        _id: transferAccountId,
        userId: req.user.id,
      })

      if (!targetAccount) {
        return next(createError(404, "Transfer account not found or doesn't belong to you"))
      }
    }

    // Create the transaction
    const newTransaction = new Transaction({
      ...req.body,
      userId: req.user.id,
    })

    const savedTransaction = await newTransaction.save()

    // Update account balances
    if (type === "income") {
      account.balance += amount
      await account.save()
    } else if (type === "expense") {
      account.balance -= amount
      await account.save()
    } else if (type === "transfer" && transferAccountId) {
      // Deduct from source account
      account.balance -= amount
      await account.save()

      // Add to target account
      const targetAccount = await Account.findById(transferAccountId)
      targetAccount.balance += amount
      await targetAccount.save()
    }

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      transaction: savedTransaction,
    })
  } catch (err) {
    next(err)
  }
}

// Get all transactions for a user
export const getUserTransactions = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      type,
      accountId,
      categoryId,
      minAmount,
      maxAmount,
      search,
      sort = "date",
      order = "desc",
      page = 1,
      limit = 20,
    } = req.query

    // Build query
    const query = { userId: req.user.id }

    // Date range
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }

    // Transaction type
    if (type) query.type = type

    // Account
    if (accountId) query.accountId = accountId

    // Category
    if (categoryId) query.categoryId = categoryId

    // Amount range
    if (minAmount || maxAmount) {
      query.amount = {}
      if (minAmount) query.amount.$gte = Number(minAmount)
      if (maxAmount) query.amount.$lte = Number(maxAmount)
    }

    // Search in description or payee
    if (search) {
      query.$or = [{ description: { $regex: search, $options: "i" } }, { payee: { $regex: search, $options: "i" } }]
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit)

    // Get transactions
    const transactions = await Transaction.find(query)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("categoryId", "name color icon")
      .populate("accountId", "name type")

    // Get total count for pagination
    const total = await Transaction.countDocuments(query)

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      transactions,
    })
  } catch (err) {
    next(err)
  }
}

// Get a single transaction
export const getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("categoryId", "name color icon")
      .populate("accountId", "name type")
      .populate("transferAccountId", "name type")

    if (!transaction) {
      return next(createError(404, "Transaction not found"))
    }

    // Check if the transaction belongs to the user
    if (transaction.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only view your own transactions"))
    }

    res.status(200).json({
      success: true,
      transaction,
    })
  } catch (err) {
    next(err)
  }
}

// Update a transaction
export const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)

    if (!transaction) {
      return next(createError(404, "Transaction not found"))
    }

    // Check if the transaction belongs to the user
    if (transaction.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only update your own transactions"))
    }

    // Handle balance updates if amount or accounts changed
    if (
      req.body.amount !== transaction.amount ||
      req.body.accountId !== transaction.accountId.toString() ||
      req.body.transferAccountId !==
        (transaction.transferAccountId ? transaction.transferAccountId.toString() : null) ||
      req.body.type !== transaction.type
    ) {
      // Revert original transaction effects
      if (transaction.type === "income") {
        const originalAccount = await Account.findById(transaction.accountId)
        originalAccount.balance -= transaction.amount
        await originalAccount.save()
      } else if (transaction.type === "expense") {
        const originalAccount = await Account.findById(transaction.accountId)
        originalAccount.balance += transaction.amount
        await originalAccount.save()
      } else if (transaction.type === "transfer" && transaction.transferAccountId) {
        // Revert source account
        const originalSourceAccount = await Account.findById(transaction.accountId)
        originalSourceAccount.balance += transaction.amount
        await originalSourceAccount.save()

        // Revert target account
        const originalTargetAccount = await Account.findById(transaction.transferAccountId)
        originalTargetAccount.balance -= transaction.amount
        await originalTargetAccount.save()
      }

      // Apply new transaction effects
      const { amount, type, accountId, transferAccountId } = req.body

      if (type === "income") {
        const newAccount = await Account.findById(accountId)
        newAccount.balance += amount
        await newAccount.save()
      } else if (type === "expense") {
        const newAccount = await Account.findById(accountId)
        newAccount.balance -= amount
        await newAccount.save()
      } else if (type === "transfer" && transferAccountId) {
        // Update source account
        const newSourceAccount = await Account.findById(accountId)
        newSourceAccount.balance -= amount
        await newSourceAccount.save()

        // Update target account
        const newTargetAccount = await Account.findById(transferAccountId)
        newTargetAccount.balance += amount
        await newTargetAccount.save()
      }
    }

    // Update the transaction
    const updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
      .populate("categoryId", "name color icon")
      .populate("accountId", "name type")
      .populate("transferAccountId", "name type")

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      transaction: updatedTransaction,
    })
  } catch (err) {
    next(err)
  }
}

// Delete a transaction
export const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)

    if (!transaction) {
      return next(createError(404, "Transaction not found"))
    }

    // Check if the transaction belongs to the user
    if (transaction.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only delete your own transactions"))
    }

    // Revert the transaction's effect on account balances
    if (transaction.type === "income") {
      const account = await Account.findById(transaction.accountId)
      account.balance -= transaction.amount
      await account.save()
    } else if (transaction.type === "expense") {
      const account = await Account.findById(transaction.accountId)
      account.balance += transaction.amount
      await account.save()
    } else if (transaction.type === "transfer" && transaction.transferAccountId) {
      // Revert source account
      const sourceAccount = await Account.findById(transaction.accountId)
      sourceAccount.balance += transaction.amount
      await sourceAccount.save()

      // Revert target account
      const targetAccount = await Account.findById(transaction.transferAccountId)
      targetAccount.balance -= transaction.amount
      await targetAccount.save()
    }

    // Delete the transaction
    await Transaction.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    })
  } catch (err) {
    next(err)
  }
}

// Get transaction statistics
export const getTransactionStats = async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query

    // Build date range query
    const dateQuery = {}
    if (startDate) dateQuery.$gte = new Date(startDate)
    if (endDate) dateQuery.$lte = new Date(endDate)

    // Build base query
    const query = {
      userId: req.user.id,
      ...(Object.keys(dateQuery).length > 0 && { date: dateQuery }),
      ...(type && { type }),
    }

    // Get total amount by category
    const categoryStats = await Transaction.aggregate([
      { $match: query },
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
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
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
      { $sort: { total: -1 } },
    ])

    // Get total amount by month
    const monthlyStats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          total: 1,
          count: 1,
        },
      },
    ])

    // Get overall totals
    const totals = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ])

    // Format the totals
    const formattedTotals = {}
    totals.forEach((item) => {
      formattedTotals[item._id] = {
        total: item.total,
        count: item.count,
      }
    })

    res.status(200).json({
      success: true,
      stats: {
        categories: categoryStats,
        monthly: monthlyStats,
        totals: formattedTotals,
      },
    })
  } catch (err) {
    next(err)
  }
}

