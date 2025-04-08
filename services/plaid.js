import { Configuration, PlaidApi, PlaidEnvironments } from "plaid"
import dotenv from "dotenv"

dotenv.config()

// Initialize the Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
})

const plaidClient = new PlaidApi(configuration)

export default plaidClient

// Helper functions for common Plaid operations
export const createLinkToken = async (userId, clientUserId) => {
  try {
    const request = {
      user: {
        client_user_id: clientUserId,
      },
      client_name: "Finflow",
      products: ["transactions"],
      country_codes: ["US"],
      language: "en",
    }

    const response = await plaidClient.linkTokenCreate(request)
    return response.data
  } catch (error) {
    console.error("Error creating link token:", error)
    throw error
  }
}

export const exchangePublicToken = async (publicToken) => {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    })
    return response.data
  } catch (error) {
    console.error("Error exchanging public token:", error)
    throw error
  }
}

export const getInstitution = async (institutionId) => {
  try {
    const request = {
      institution_id: institutionId,
      country_codes: ["US"],
    }
    const response = await plaidClient.institutionsGetById(request)
    return response.data.institution
  } catch (error) {
    console.error("Error getting institution:", error)
    throw error
  }
}

export const getAccounts = async (accessToken) => {
  try {
    const response = await plaidClient.accountsGet({
      access_token: accessToken,
    })
    return response.data
  } catch (error) {
    console.error("Error getting accounts:", error)
    throw error
  }
}

export const getTransactions = async (accessToken, startDate, endDate, options = {}) => {
  try {
    const request = {
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: {
        count: options.count || 100,
        offset: options.offset || 0,
      },
    }

    const response = await plaidClient.transactionsGet(request)
    return response.data
  } catch (error) {
    console.error("Error getting transactions:", error)
    throw error
  }
}

export const syncTransactions = async (accessToken) => {
  try {
    const request = {
      access_token: accessToken,
    }

    const response = await plaidClient.transactionsSync(request)
    return response.data
  } catch (error) {
    console.error("Error syncing transactions:", error)
    throw error
  }
}

export const getItemById = async (accessToken) => {
  try {
    const response = await plaidClient.itemGet({
      access_token: accessToken,
    })
    return response.data
  } catch (error) {
    console.error("Error getting item:", error)
    throw error
  }
}

export const updateItemWebhook = async (accessToken, webhookUrl) => {
  try {
    const response = await plaidClient.itemWebhookUpdate({
      access_token: accessToken,
      webhook: webhookUrl,
    })
    return response.data
  } catch (error) {
    console.error("Error updating webhook:", error)
    throw error
  }
}
