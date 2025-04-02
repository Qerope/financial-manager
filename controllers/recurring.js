import RecurringTransaction from "../models/RecurringTransaction.js"
import Transaction from "../models/Transaction.js"
import Account from "../models/Account.js"
import { createError } from "../utils/error.js"

// Create a new recurring transaction
export const createRecurringTransaction = async (req, res, next) => {
  try {
    const { accountId, transferAccountId, type } = req.body

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

    // Calculate next due date
    const startDate = new Date(req.body.startDate)
    const nextDue = calculateNextDueDate(startDate, req.body.frequency)

    const newRecurringTransaction = new RecurringTransaction({
      ...req.body,
      userId: req.user.id,
      nextDue,
    })

    const savedRecurringTransaction = await newRecurringTransaction.save()

    res.status(201).json({
      success: true,
      message: "Recurring transaction created successfully",
      recurringTransaction: savedRecurringTransaction,
    })
  } catch (err) {
    next(err)
  }
}

// Get all recurring transactions for a user
export const getUserRecurringTransactions = async (req, res, next) => {
  try {
    const { isActive, type, accountId } = req.query

    const query = { userId: req.user.id }
    if (isActive !== undefined) query.isActive = isActive === "true"
    if (type) query.type = type
    if (accountId) query.accountId = accountId

    const recurringTransactions = await RecurringTransaction.find(query)
      .populate("accountId", "name type")
      .populate("categoryId", "name color icon")
      .populate("transferAccountId", "name type")

    res.status(200).json({
      success: true,
      count: recurringTransactions.length,
      recurringTransactions,
    })
  } catch (err) {
    next(err)
  }
}

// Get a single recurring transaction
export const getRecurringTransaction = async (req, res, next) => {
  try {
    const recurringTransaction = await RecurringTransaction.findById(req.params.id)
      .populate("accountId", "name type")
      .populate("categoryId", "name color icon")
      .populate("transferAccountId", "name type")

    if (!recurringTransaction) {
      return next(createError(404, "Recurring transaction not found"))
    }

    // Check if the recurring transaction belongs to the user
    if (recurringTransaction.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only view your own recurring transactions"))
    }

    res.status(200).json({
      success: true,
      recurringTransaction,
    })
  } catch (err) {
    next(err)
  }
}

// Update a recurring transaction
export const updateRecurringTransaction = async (req, res, next) => {
  try {
    const recurringTransaction = await RecurringTransaction.findById(req.params.id)

    if (!recurringTransaction) {
      return next(createError(404, "Recurring transaction not found"))
    }

    // Check if the recurring transaction belongs to the user
    if (recurringTransaction.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only update your own recurring transactions"))
    }

    // If frequency or start date changed, recalculate next due date
    if (
      req.body.frequency !== recurringTransaction.frequency ||
      req.body.startDate !== recurringTransaction.startDate.toISOString().split("T")[0]
    ) {
      const startDate = new Date(req.body.startDate || recurringTransaction.startDate)
      const frequency = req.body.frequency || recurringTransaction.frequency
      req.body.nextDue = calculateNextDueDate(startDate, frequency, recurringTransaction.lastProcessed)
    }

    const updatedRecurringTransaction = await RecurringTransaction.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true },
    )
      .populate("accountId", "name type")
      .populate("categoryId", "name color icon")
      .populate("transferAccountId", "name type")

    res.status(200).json({
      success: true,
      message: "Recurring transaction updated successfully",
      recurringTransaction: updatedRecurringTransaction,
    })
  } catch (err) {
    next(err)
  }
}

// Delete a recurring transaction
export const deleteRecurringTransaction = async (req, res, next) => {
  try {
    const recurringTransaction = await RecurringTransaction.findById(req.params.id)

    if (!recurringTransaction) {
      return next(createError(404, "Recurring transaction not found"))
    }

    // Check if the recurring transaction belongs to the user
    if (recurringTransaction.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only delete your own recurring transactions"))
    }

    await RecurringTransaction.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: "Recurring transaction deleted successfully",
    })
  } catch (err) {
    next(err)
  }
}

// Generate a transaction from a recurring transaction
export const generateTransaction = async (req, res, next) => {
  try {
    const recurringTransaction = await RecurringTransaction.findById(req.params.id)

    if (!recurringTransaction) {
      return next(createError(404, "Recurring transaction not found"))
    }

    // Check if the recurring transaction belongs to the user
    if (recurringTransaction.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only generate transactions from your own recurring transactions"))
    }

    // Create a new transaction based on the recurring transaction
    const newTransaction = new Transaction({
      userId: recurringTransaction.userId,
      accountId: recurringTransaction.accountId,
      categoryId: recurringTransaction.categoryId,
      amount: recurringTransaction.amount,
      type: recurringTransaction.type,
      description: recurringTransaction.description,
      date: new Date(),
      isRecurring: true,
      recurringId: recurringTransaction._id,
      payee: recurringTransaction.payee,
      notes: recurringTransaction.notes,
      transferAccountId: recurringTransaction.transferAccountId,
    })

    const savedTransaction = await newTransaction.save()

    // Update account balances
    if (recurringTransaction.type === "income") {
      const account = await Account.findById(recurringTransaction.accountId)
      account.balance += recurringTransaction.amount
      await account.save()
    } else if (recurringTransaction.type === "expense") {
      const account = await Account.findById(recurringTransaction.accountId)
      account.balance -= recurringTransaction.amount
      await account.save()
    } else if (recurringTransaction.type === "transfer" && recurringTransaction.transferAccountId) {
      // Deduct from source account
      const sourceAccount = await Account.findById(recurringTransaction.accountId)
      sourceAccount.balance -= recurringTransaction.amount
      await sourceAccount.save()

      // Add to target account
      const targetAccount = await Account.findById(recurringTransaction.transferAccountId)
      targetAccount.balance += recurringTransaction.amount
      await targetAccount.save()
    }

    // Update the recurring transaction's last processed date and next due date
    recurringTransaction.lastProcessed = new Date()
    recurringTransaction.nextDue = calculateNextDueDate(
      new Date(recurringTransaction.startDate),
      recurringTransaction.frequency,
      recurringTransaction.lastProcessed,
    )
    await recurringTransaction.save()

    res.status(201).json({
      success: true,
      message: "Transaction generated successfully",
      transaction: savedTransaction,
    })
  } catch (err) {
    next(err)
  }
}

// Helper function to calculate next due date
const calculateNextDueDate = (startDate, frequency, lastProcessed = null) => {
  const now = new Date()
  let nextDue = new Date(startDate)

  if (lastProcessed) {
    // If already processed at least once, calculate from last processed date
    nextDue = new Date(lastProcessed)
  } else if (nextDue < now) {
    // If start date is in the past and never processed, find the next occurrence
    while (nextDue < now) {
      nextDue = advanceDate(nextDue, frequency)
    }
    return nextDue
  }

  // Advance to the next occurrence
  return advanceDate(nextDue, frequency)
}

// Helper function to advance date based on frequency
const advanceDate = (date, frequency) => {
  const result = new Date(date)

  switch (frequency) {
    case "daily":
      result.setDate(result.getDate() + 1)
      break
    case "weekly":
      result.setDate(result.getDate() + 7)
      break
    case "biweekly":
      result.setDate(result.getDate() + 14)
      break
    case "monthly":
      result.setMonth(result.getMonth() + 1)
      break
    case "quarterly":
      result.setMonth(result.getMonth() + 3)
      break
    case "yearly":
      result.setFullYear(result.getFullYear() + 1)
      break
    default:
      result.setMonth(result.getMonth() + 1)
  }

  return result
}

