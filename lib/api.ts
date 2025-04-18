import { API_URL } from "./config"

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token")

  if (!token) {
    throw new Error("Not authenticated")
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Handle 404 and other errors more gracefully
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }))
    console.error(`API Error (${response.status}):`, errorData)
    throw new Error(errorData.message || `API request failed with status ${response.status}`)
  }

  const data = await response.json()
  return data
}

// Accounts
export const getAccounts = () => fetchWithAuth("/accounts")
export const getAccount = (id: string) => fetchWithAuth(`/accounts/${id}`)
export const createAccount = (accountData: any) =>
  fetchWithAuth("/accounts", {
    method: "POST",
    body: JSON.stringify(accountData),
  })
export const updateAccount = (id: string, accountData: any) =>
  fetchWithAuth(`/accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(accountData),
  })
export const deleteAccount = (id: string) =>
  fetchWithAuth(`/accounts/${id}`, {
    method: "DELETE",
  })
export const getAccountBalanceHistory = (id: string, params: any = {}) => {
  const queryParams = new URLSearchParams(params).toString()
  return fetchWithAuth(`/accounts/${id}/balance-history?${queryParams}`)
}

// Transactions
export const getTransactions = (params: any = {}) => {
  const queryParams = new URLSearchParams(params).toString()
  return fetchWithAuth(`/transactions?${queryParams}`)
}
export const getTransaction = (id: string) => fetchWithAuth(`/transactions/${id}`)
export const createTransaction = (transactionData: any) =>
  fetchWithAuth("/transactions", {
    method: "POST",
    body: JSON.stringify(transactionData),
  })
export const updateTransaction = (id: string, transactionData: any) =>
  fetchWithAuth(`/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(transactionData),
  })
export const deleteTransaction = (id: string) =>
  fetchWithAuth(`/transactions/${id}`, {
    method: "DELETE",
  })
export const getTransactionStats = (params: any = {}) => {
  const queryParams = new URLSearchParams(params).toString()
  return fetchWithAuth(`/transactions/stats/overview?${queryParams}`)
}

// Categories
export const getCategories = (params: any = {}) => {
  const queryParams = new URLSearchParams(params).toString()
  return fetchWithAuth(`/categories?${queryParams}`)
}
export const getCategory = (id: string) => fetchWithAuth(`/categories/${id}`)
export const createCategory = (categoryData: any) =>
  fetchWithAuth("/categories", {
    method: "POST",
    body: JSON.stringify(categoryData),
  })
export const updateCategory = (id: string, categoryData: any) =>
  fetchWithAuth(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(categoryData),
  })
export const deleteCategory = (id: string) =>
  fetchWithAuth(`/categories/${id}`, {
    method: "DELETE",
  })
export const getCategoryStats = (params: any = {}) => {
  const queryParams = new URLSearchParams(params).toString()
  return fetchWithAuth(`/categories/stats/overview?${queryParams}`)
}

// Budgets
export const getBudgets = (params: any = {}) => {
  const queryParams = new URLSearchParams(params).toString()
  return fetchWithAuth(`/budgets?${queryParams}`)
}
export const getBudget = (id: string) => fetchWithAuth(`/budgets/${id}`)
export const createBudget = (budgetData: any) =>
  fetchWithAuth("/budgets", {
    method: "POST",
    body: JSON.stringify(budgetData),
  })
export const updateBudget = (id: string, budgetData: any) =>
  fetchWithAuth(`/budgets/${id}`, {
    method: "PUT",
    body: JSON.stringify(budgetData),
  })
export const deleteBudget = (id: string) =>
  fetchWithAuth(`/budgets/${id}`, {
    method: "DELETE",
  })
export const getBudgetProgress = (id: string) => fetchWithAuth(`/budgets/${id}/progress`)
export const getAllBudgetsProgress = () => fetchWithAuth("/budgets/progress/all")

// Goals
export const getGoals = (params: any = {}) => {
  const queryParams = new URLSearchParams(params).toString()
  return fetchWithAuth(`/goals?${queryParams}`)
}
export const getGoal = (id: string) => fetchWithAuth(`/goals/${id}`)
export const createGoal = (goalData: any) =>
  fetchWithAuth("/goals", {
    method: "POST",
    body: JSON.stringify(goalData),
  })
export const updateGoal = (id: string, goalData: any) =>
  fetchWithAuth(`/goals/${id}`, {
    method: "PUT",
    body: JSON.stringify(goalData),
  })
export const deleteGoal = (id: string) =>
  fetchWithAuth(`/goals/${id}`, {
    method: "DELETE",
  })
export const updateGoalProgress = (id: string, amount: number) =>
  fetchWithAuth(`/goals/${id}/progress`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  })
export const getGoalStats = (id: string) => fetchWithAuth(`/goals/${id}/stats`)

// Reports
export const getIncomeVsExpense = (params: any = {}) => {
  const queryParams = new URLSearchParams(params).toString()
  return fetchWithAuth(`/reports/income-vs-expense?${queryParams}`)
}
export const getExpenseByCategory = (params: any = {}) => {
  const queryParams = new URLSearchParams(params).toString()
  return fetchWithAuth(`/reports/expense-by-category?${queryParams}`)
}
export const getNetWorth = () => fetchWithAuth("/reports/net-worth")
export const getCashFlow = (params: any = {}) => {
  const queryParams = new URLSearchParams(params).toString()
  return fetchWithAuth(`/reports/cash-flow?${queryParams}`)
}

// Recurring Transactions
export const getRecurringTransactions = (params: any = {}) => {
  const queryParams = new URLSearchParams(params).toString()
  return fetchWithAuth(`/recurring?${queryParams}`)
}
export const getRecurringTransaction = (id: string) => fetchWithAuth(`/recurring/${id}`)
export const createRecurringTransaction = (recurringData: any) =>
  fetchWithAuth("/recurring", {
    method: "POST",
    body: JSON.stringify(recurringData),
  })
export const updateRecurringTransaction = (id: string, recurringData: any) =>
  fetchWithAuth(`/recurring/${id}`, {
    method: "PUT",
    body: JSON.stringify(recurringData),
  })
export const deleteRecurringTransaction = (id: string) =>
  fetchWithAuth(`/recurring/${id}`, {
    method: "DELETE",
  })
export const generateTransaction = (id: string) =>
  fetchWithAuth(`/recurring/${id}/generate`, {
    method: "POST",
  })

// Dashboard
export const getDashboardData = () => fetchWithAuth("/dashboard")

// Projections
export const getAverageMonthlyData = () => fetchWithAuth("/projections/average-monthly")
export const getCategoryAverages = () => fetchWithAuth("/projections/category-averages")

// Plaid
export const createLinkToken = () =>
  fetchWithAuth("/plaid/create-link-token", {
    method: "POST",
  })

export const exchangePublicToken = (data: any) =>
  fetchWithAuth("/plaid/exchange-public-token", {
    method: "POST",
    body: JSON.stringify(data),
  })

export const getPlaidItems = () => fetchWithAuth("/plaid/items")

export const getPlaidItem = (id: string) => fetchWithAuth(`/plaid/items/${id}`)

export const deletePlaidItem = (id: string) =>
  fetchWithAuth(`/plaid/items/${id}`, {
    method: "DELETE",
  })

export const linkPlaidAccount = (data: any) =>
  fetchWithAuth("/plaid/link-account", {
    method: "POST",
    body: JSON.stringify(data),
  })

export const unlinkPlaidAccount = (data: any) =>
  fetchWithAuth("/plaid/unlink-account", {
    method: "POST",
    body: JSON.stringify(data),
  })

export const syncPlaidTransactions = (id: string) =>
  fetchWithAuth(`/plaid/sync/${id}`, {
    method: "POST",
  })
