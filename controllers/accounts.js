import Account from "../models/Account.js"
import Transaction from "../models/Transaction.js"
import { createError } from "../utils/error.js"

// Create a new account
export const createAccount = async (req, res, next) => {
  try {
    const newAccount = new Account({
      ...req.body,
      userId: req.user.id,
    })

    const savedAccount = await newAccount.save()

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      account: savedAccount,
    })
  } catch (err) {
    next(err)
  }
}

// Get all accounts for a user
export const getUserAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find({ userId: req.user.id })

    res.status(200).json({
      success: true,
      count: accounts.length,
      accounts,
    })
  } catch (err) {
    next(err)
  }
}

// Get a single account
export const getAccount = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id)

    if (!account) {
      return next(createError(404, "Account not found"))
    }

    // Check if the account belongs to the user
    if (account.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only view your own accounts"))
    }

    res.status(200).json({
      success: true,
      account,
    })
  } catch (err) {
    next(err)
  }
}

// Update an account
export const updateAccount = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id)

    if (!account) {
      return next(createError(404, "Account not found"))
    }

    // Check if the account belongs to the user
    if (account.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only update your own accounts"))
    }

    const updatedAccount = await Account.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })

    res.status(200).json({
      success: true,
      message: "Account updated successfully",
      account: updatedAccount,
    })
  } catch (err) {
    next(err)
  }
}

// Delete an account
export const deleteAccount = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id)

    if (!account) {
      return next(createError(404, "Account not found"))
    }

    // Check if the account belongs to the user
    if (account.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only delete your own accounts"))
    }

    // Check if there are transactions associated with this account
    const transactionCount = await Transaction.countDocuments({
      $or: [{ accountId: req.params.id }, { transferAccountId: req.params.id }],
    })

    if (transactionCount > 0) {
      return next(createError(400, "Cannot delete account with associated transactions"))
    }

    await Account.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    })
  } catch (err) {
    next(err)
  }
}

// Get account balance history
export const getAccountBalanceHistory = async (req, res, next) => {
  try {
    const { id } = req.params
    const { startDate, endDate } = req.query

    const account = await Account.findById(id)

    if (!account) {
      return next(createError(404, "Account not found"))
    }

    // Check if the account belongs to the user
    if (account.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only view your own accounts"))
    }

    // Query parameters for date range
    const dateQuery = {}
    if (startDate) dateQuery.$gte = new Date(startDate)
    if (endDate) dateQuery.$lte = new Date(endDate)

    // Get all transactions for this account in date range
    const transactions = await Transaction.find({
      $or: [{ accountId: id }, { transferAccountId: id }],
      ...(Object.keys(dateQuery).length > 0 && { date: dateQuery }),
    }).sort({ date: 1 })

    // Calculate running balance
    let runningBalance = account.balance
    const today = new Date()

    // Adjust for transactions after the current date
    for (const transaction of [...transactions].reverse()) {
      if (transaction.date > today) {
        if (transaction.accountId.toString() === id) {
          if (transaction.type === "income") {
            runningBalance -= transaction.amount
          } else if (transaction.type === "expense") {
            runningBalance += transaction.amount
          } else if (transaction.type === "transfer") {
            if (transaction.transferAccountId) {
              runningBalance += transaction.amount
            }
          }
        } else if (transaction.transferAccountId && transaction.transferAccountId.toString() === id) {
          runningBalance -= transaction.amount
        }
      } else {
        break
      }
    }

    // Calculate balance history
    const balanceHistory = []
    let currentBalance = runningBalance

    for (const transaction of transactions) {
      if (transaction.date <= today) {
        if (transaction.accountId.toString() === id) {
          if (transaction.type === "income") {
            currentBalance += transaction.amount
          } else if (transaction.type === "expense") {
            currentBalance -= transaction.amount
          } else if (transaction.type === "transfer") {
            if (transaction.transferAccountId) {
              currentBalance -= transaction.amount
            }
          }
        } else if (transaction.transferAccountId && transaction.transferAccountId.toString() === id) {
          currentBalance += transaction.amount
        }

        balanceHistory.push({
          date: transaction.date,
          balance: currentBalance,
          transaction: {
            id: transaction._id,
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
          },
        })
      }
    }

    res.status(200).json({
      success: true,
      balanceHistory,
    })
  } catch (err) {
    next(err)
  }
}

