import Category from "../models/Category.js"
import Transaction from "../models/Transaction.js"
import { createError } from "../utils/error.js"

// Create default categories for a new user
export const createDefaultCategories = async (userId) => {
  const defaultCategories = [
    // Income categories
    { name: "Salary", type: "income", color: "#4CAF50", icon: "work", isDefault: true },
    { name: "Investments", type: "income", color: "#2196F3", icon: "trending_up", isDefault: true },
    { name: "Gifts", type: "income", color: "#9C27B0", icon: "card_giftcard", isDefault: true },
    { name: "Other Income", type: "income", color: "#607D8B", icon: "attach_money", isDefault: true },

    // Expense categories
    { name: "Housing", type: "expense", color: "#F44336", icon: "home", isDefault: true },
    { name: "Food", type: "expense", color: "#FF9800", icon: "restaurant", isDefault: true },
    { name: "Transportation", type: "expense", color: "#795548", icon: "directions_car", isDefault: true },
    { name: "Utilities", type: "expense", color: "#673AB7", icon: "power", isDefault: true },
    { name: "Entertainment", type: "expense", color: "#E91E63", icon: "movie", isDefault: true },
    { name: "Shopping", type: "expense", color: "#00BCD4", icon: "shopping_cart", isDefault: true },
    { name: "Health", type: "expense", color: "#8BC34A", icon: "favorite", isDefault: true },
    { name: "Education", type: "expense", color: "#3F51B5", icon: "school", isDefault: true },
    { name: "Personal", type: "expense", color: "#009688", icon: "person", isDefault: true },
    { name: "Debt", type: "expense", color: "#FF5722", icon: "credit_card", isDefault: true },
    { name: "Savings", type: "expense", color: "#CDDC39", icon: "savings", isDefault: true },
    { name: "Gifts & Donations", type: "expense", color: "#9C27B0", icon: "volunteer_activism", isDefault: true },
    { name: "Taxes", type: "expense", color: "#607D8B", icon: "receipt", isDefault: true },
    { name: "Other Expenses", type: "expense", color: "#9E9E9E", icon: "more_horiz", isDefault: true },
  ]

  const categories = defaultCategories.map((category) => ({
    ...category,
    userId,
  }))

  await Category.insertMany(categories)
}

// Create a new category
export const createCategory = async (req, res, next) => {
  try {
    const newCategory = new Category({
      ...req.body,
      userId: req.user.id,
    })

    const savedCategory = await newCategory.save()

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: savedCategory,
    })
  } catch (err) {
    next(err)
  }
}

// Get all categories for a user
export const getUserCategories = async (req, res, next) => {
  try {
    const { type } = req.query

    const query = { userId: req.user.id }
    if (type) query.type = type

    const categories = await Category.find(query).sort({ name: 1 })

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    })
  } catch (err) {
    next(err)
  }
}

// Get a single category
export const getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)

    if (!category) {
      return next(createError(404, "Category not found"))
    }

    // Check if the category belongs to the user
    if (category.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only view your own categories"))
    }

    res.status(200).json({
      success: true,
      category,
    })
  } catch (err) {
    next(err)
  }
}

// Update a category
export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)

    if (!category) {
      return next(createError(404, "Category not found"))
    }

    // Check if the category belongs to the user
    if (category.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only update your own categories"))
    }

    // Prevent updating default categories
    if (category.isDefault && (req.body.name || req.body.type)) {
      return next(createError(400, "Cannot modify name or type of default categories"))
    }

    const updatedCategory = await Category.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: updatedCategory,
    })
  } catch (err) {
    next(err)
  }
}

// Delete a category
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)

    if (!category) {
      return next(createError(404, "Category not found"))
    }

    // Check if the category belongs to the user
    if (category.userId.toString() !== req.user.id) {
      return next(createError(403, "You can only delete your own categories"))
    }

    // Prevent deleting default categories
    if (category.isDefault) {
      return next(createError(400, "Cannot delete default categories"))
    }

    // Check if there are transactions using this category
    const transactionCount = await Transaction.countDocuments({ categoryId: req.params.id })

    if (transactionCount > 0) {
      return next(createError(400, "Cannot delete category with associated transactions"))
    }

    await Category.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    })
  } catch (err) {
    next(err)
  }
}

// Get category statistics
export const getCategoryStats = async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query

    // Build date range query for transactions
    const dateQuery = {}
    if (startDate) dateQuery.$gte = new Date(startDate)
    if (endDate) dateQuery.$lte = new Date(endDate)

    // Get all categories for the user
    const query = { userId: req.user.id }
    if (type) query.type = type

    const categories = await Category.find(query)

    // Get transaction totals for each category
    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        const transactionQuery = {
          userId: req.user.id,
          categoryId: category._id,
          ...(Object.keys(dateQuery).length > 0 && { date: dateQuery }),
        }

        const transactions = await Transaction.find(transactionQuery)

        const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0)

        return {
          _id: category._id,
          name: category.name,
          type: category.type,
          color: category.color,
          icon: category.icon,
          transactionCount: transactions.length,
          total,
        }
      }),
    )

    res.status(200).json({
      success: true,
      categoryStats,
    })
  } catch (err) {
    next(err)
  }
}

