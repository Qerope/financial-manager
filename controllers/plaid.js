import { createLinkToken, exchangePublicToken, getAccounts, syncTransactions, getItemById } from "../services/plaid.js"
import PlaidItem from "../models/PlaidItem.js"
import Account from "../models/Account.js"
import Transaction from "../models/Transaction.js"
import Category from "../models/Category.js"
import { createError } from "../utils/error.js"

// Create a link token for the Plaid Link flow
export const createLinkTokenController = async (req, res, next) => {
  try {
    const userId = req.user.id
    const clientUserId = `user-${userId}`

    const linkTokenResponse = await createLinkToken(userId, clientUserId)

    res.status(200).json({
      success: true,
      link_token: linkTokenResponse.link_token,
      expiration: linkTokenResponse.expiration,
    })
  } catch (err) {
    next(createError(500, "Failed to create link token: " + err.message))
  }
}

// Exchange public token for access token and store Plaid item
export const exchangePublicTokenController = async (req, res, next) => {
  try {
    const { public_token, institution_id, institution_name, accounts } = req.body

    accounts.forEach((account, index) => {
      console.log(`Account ${index}:`, typeof account, account);
    });

    const userId = req.user.id

    // Exchange public token for access token
    const exchangeResponse = await exchangePublicToken(public_token)
    const accessToken = exchangeResponse.access_token
    const itemId = exchangeResponse.item_id

    // Get item details
    const itemResponse = await getItemById(accessToken)
    const item = itemResponse.item

    // Check if this institution is already connected
    const existingItem = await PlaidItem.findOne({
      userId,
      institutionId: institution_id,
    })

    if (existingItem) {
      // Update the existing item
      existingItem.accessToken = accessToken
      existingItem.itemId = itemId
      existingItem.status = "good"
      existingItem.lastUpdated = new Date()
      existingItem.error = null
      existingItem.availableProducts = item.available_products
      existingItem.billedProducts = item.billed_products
      existingItem.consentExpirationTime = item.consent_expiration_time ? new Date(item.consent_expiration_time) : null

      // Update accounts
      const accountsResponse = await getAccounts(accessToken)
      existingItem.accounts = accountsResponse.accounts.map((account) => ({
        accountId: account.id,
        mask: account.mask,
        name: account.name,
        officialName: account.official_name,
        type: account.type,
        subtype: account.subtype,
        linkedAccountId: null, // Will be linked later
      }))

      await existingItem.save()

      // Sync transactions
      await syncTransactionsForItem(existingItem, req.user)

      res.status(200).json({
        success: true,
        message: "Institution reconnected successfully",
        item: existingItem,
      })
    } else {
      // Create a new Plaid item
      const newPlaidItem = new PlaidItem({
        userId,
        institutionId: institution_id,
        institutionName: institution_name,
        accessToken,
        itemId,
        status: "good",
        availableProducts: item.available_products,
        billedProducts: item.billed_products,
        consentExpirationTime: item.consent_expiration_time ? new Date(item.consent_expiration_time) : null,
        accounts: accounts.map((account) => ({
          accountId: account.accountId || account.id, // Handle both possible field names
          mask: account.mask || '',
          name: account.name || '',
          officialName: account.officialName || '',
          type: account.type || '',
          subtype: account.subtype || '',
          linkedAccountId: null, // Will be linked later
        })),
      })

      await newPlaidItem.save()

      // Sync transactions
      await syncTransactionsForItem(newPlaidItem, req.user)

      res.status(201).json({
        success: true,
        message: "Institution connected successfully",
        item: newPlaidItem,
      })
    }
  } catch (err) {
    next(createError(500, "Failed to exchange public token: " + err.message))
  }
}

// Get all Plaid items for a user
export const getPlaidItems = async (req, res, next) => {
  try {
    const userId = req.user.id

    const items = await PlaidItem.find({ userId }).populate({
      path: "accounts.linkedAccountId",
      select: "name type balance currency",
    })

    res.status(200).json({
      success: true,
      count: items.length,
      items,
    })
  } catch (err) {
    next(createError(500, "Failed to get Plaid items: " + err.message))
  }
}

// Get a single Plaid item
export const getPlaidItem = async (req, res, next) => {
  try {
    const userId = req.user.id
    const itemId = req.params.id

    const item = await PlaidItem.findOne({
      _id: itemId,
      userId,
    }).populate({
      path: "accounts.linkedAccountId",
      select: "name type balance currency",
    })

    if (!item) {
      return next(createError(404, "Plaid item not found"))
    }

    res.status(200).json({
      success: true,
      item,
    })
  } catch (err) {
    next(createError(500, "Failed to get Plaid item: " + err.message))
  }
}

// Delete a Plaid item
export const deletePlaidItem = async (req, res, next) => {
  try {
    const userId = req.user.id
    const itemId = req.params.id

    const item = await PlaidItem.findOne({
      _id: itemId,
      userId,
    })

    if (!item) {
      return next(createError(404, "Plaid item not found"))
    }

    // Optionally, you can remove the access token from Plaid
    // This is not required, but it's a good practice
    // await plaidClient.itemRemove({ access_token: item.accessToken })

    // Delete the Plaid item
    await PlaidItem.deleteOne({ _id: itemId })

    res.status(200).json({
      success: true,
      message: "Plaid item deleted successfully",
    })
  } catch (err) {
    next(createError(500, "Failed to delete Plaid item: " + err.message))
  }
}

// Link a Plaid account to a local account
export const linkPlaidAccount = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { plaidItemId, plaidAccountId, accountId } = req.body

    const plaidItem = await PlaidItem.findOne({
      _id: plaidItemId,
      userId,
    })

    if (!plaidItem) {
      return next(createError(404, "Plaid item not found"))
    }

    const account = await Account.findOne({
      _id: accountId,
      userId,
    })

    if (!account) {
      return next(createError(404, "Account not found"))
    }

    // Find the Plaid account in the item
    const plaidAccount = plaidItem.accounts.find((acc) => acc.accountId === plaidAccountId)

    if (!plaidAccount) {
      return next(createError(404, "Plaid account not found"))
    }

    // Link the Plaid account to the local account
    plaidAccount.linkedAccountId = account._id
    await plaidItem.save()

    res.status(200).json({
      success: true,
      message: "Account linked successfully",
      plaidItem,
    })
  } catch (err) {
    next(createError(500, "Failed to link account: " + err.message))
  }
}

// Unlink a Plaid account from a local account
export const unlinkPlaidAccount = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { plaidItemId, plaidAccountId } = req.body

    const plaidItem = await PlaidItem.findOne({
      _id: plaidItemId,
      userId,
    })

    if (!plaidItem) {
      return next(createError(404, "Plaid item not found"))
    }

    // Find the Plaid account in the item
    const plaidAccount = plaidItem.accounts.find((acc) => acc.accountId === plaidAccountId)

    if (!plaidAccount) {
      return next(createError(404, "Plaid account not found"))
    }

    // Unlink the Plaid account from the local account
    plaidAccount.linkedAccountId = null
    await plaidItem.save()

    res.status(200).json({
      success: true,
      message: "Account unlinked successfully",
      plaidItem,
    })
  } catch (err) {
    next(createError(500, "Failed to unlink account: " + err.message))
  }
}

// Sync transactions for a Plaid item
export const syncTransactionsController = async (req, res, next) => {
  try {
    const userId = req.user.id
    const itemId = req.params.id

    const plaidItem = await PlaidItem.findOne({
      _id: itemId,
      userId,
    })

    if (!plaidItem) {
      return next(createError(404, "Plaid item not found"))
    }

    await syncTransactionsForItem(plaidItem, req.user)

    res.status(200).json({
      success: true,
      message: "Transactions synced successfully",
    })
  } catch (err) {
    next(createError(500, "Failed to sync transactions: " + err.message))
  }
}

// Helper function to sync transactions for a Plaid item
async function syncTransactionsForItem(plaidItem, user) {
  try {
    const accessToken = plaidItem.accessToken
    const userId = plaidItem.userId

    // Get transactions using the sync API
    const syncResponse = await syncTransactions(accessToken)
    const { added, modified, removed, has_more, next_cursor } = syncResponse

    // Process added transactions
    for (const transaction of added) {
      // Skip transactions for accounts that are not linked
      const plaidAccount = plaidItem.accounts.find((acc) => acc.accountId === transaction.account_id)
      if (!plaidAccount || !plaidAccount.linkedAccountId) continue

      // Check if transaction already exists
      const existingTransaction = await Transaction.findOne({
        plaidTransactionId: transaction.transaction_id,
      })

      if (!existingTransaction) {
        // Find or create category
        let category = null
        if (transaction.category && transaction.category.length > 0) {
          const categoryName = transaction.category[transaction.category.length - 1]
          category = await Category.findOne({
            userId,
            name: { $regex: new RegExp(`^${categoryName}$`, "i") },
          })

          if (!category) {
            category = new Category({
              userId,
              name: categoryName,
              type: transaction.amount > 0 ? "expense" : "income",
              color: getRandomColor(),
              icon: "tag",
            })
            await category.save()
          }
        }

        // Create new transaction
        const newTransaction = new Transaction({
          userId,
          accountId: plaidAccount.linkedAccountId,
          date: new Date(transaction.date),
          amount: Math.abs(transaction.amount),
          type: transaction.amount > 0 ? "expense" : "income",
          description: transaction.name,
          categoryId: category ? category._id : null,
          notes: transaction.category ? transaction.category.join(", ") : "",
          plaidTransactionId: transaction.transaction_id,
          plaidData: {
            merchantName: transaction.merchant_name,
            paymentChannel: transaction.payment_channel,
            pending: transaction.pending,
            location: transaction.location,
            category: transaction.category,
            categoryId: transaction.category_id,
          },
        })

        await newTransaction.save()

        // Update account balance
        const account = await Account.findById(plaidAccount.linkedAccountId)
        if (account) {
          if (transaction.amount > 0) {
            account.balance -= Math.abs(transaction.amount)
          } else {
            account.balance += Math.abs(transaction.amount)
          }
          await account.save()
        }
      }
    }

    // Process modified transactions
    for (const transaction of modified) {
      const existingTransaction = await Transaction.findOne({
        plaidTransactionId: transaction.transaction_id,
      })

      if (existingTransaction) {
        // Find or create category
        let category = null
        if (transaction.category && transaction.category.length > 0) {
          const categoryName = transaction.category[transaction.category.length - 1]
          category = await Category.findOne({
            userId,
            name: { $regex: new RegExp(`^${categoryName}$`, "i") },
          })

          if (!category) {
            category = new Category({
              userId,
              name: categoryName,
              type: transaction.amount > 0 ? "expense" : "income",
              color: getRandomColor(),
              icon: "tag",
            })
            await category.save()
          }
        }

        // Update transaction
        existingTransaction.date = new Date(transaction.date)
        existingTransaction.amount = Math.abs(transaction.amount)
        existingTransaction.type = transaction.amount > 0 ? "expense" : "income"
        existingTransaction.description = transaction.name
        existingTransaction.categoryId = category ? category._id : existingTransaction.categoryId
        existingTransaction.notes = transaction.category ? transaction.category.join(", ") : existingTransaction.notes
        existingTransaction.plaidData = {
          merchantName: transaction.merchant_name,
          paymentChannel: transaction.payment_channel,
          pending: transaction.pending,
          location: transaction.location,
          category: transaction.category,
          categoryId: transaction.category_id,
        }

        await existingTransaction.save()
      }
    }

    // Process removed transactions
    for (const transaction of removed) {
      await Transaction.deleteOne({
        plaidTransactionId: transaction.transaction_id,
      })
    }

    // Update the Plaid item's last updated timestamp
    plaidItem.lastUpdated = new Date()
    await plaidItem.save()

    return {
      added: added.length,
      modified: modified.length,
      removed: removed.length,
      hasMore: has_more,
    }
  } catch (error) {
    console.error("Error syncing transactions:", error)
    throw error
  }
}

// Helper function to generate a random color
function getRandomColor() {
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#FFA5A5", // Light Red
    "#98D8C8", // Light Green
    "#F9C784", // Yellow
    "#ADA8BE", // Purple
    "#A2D5F2", // Light Blue
    "#FF8C94", // Pink
    "#9DE0AD", // Green
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
