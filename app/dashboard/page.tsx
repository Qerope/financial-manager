"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
  PiggyBank,
  Target,
  Loader2,
  Download,
  Plus,
  TrendingUp,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { getAccounts, getTransactions, getBudgets, getGoals, getIncomeVsExpense, getCategories } from "@/lib/api"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DashboardPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [budgetProgress, setBudgetProgress] = useState([])
  const [goals, setGoals] = useState([])
  const [categories, setCategories] = useState([])
  const [incomeVsExpenseData, setIncomeVsExpenseData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [timeRange, setTimeRange] = useState("month")

  // Dashboard stats
  const [totalBalance, setTotalBalance] = useState(0)
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [monthlyExpenses, setMonthlyExpenses] = useState(0)
  const [savingsRate, setSavingsRate] = useState(0)
  const [categoryData, setCategoryData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Get last 30 days data
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const startDate = thirtyDaysAgo.toISOString().split("T")[0]
        const endDate = new Date().toISOString().split("T")[0]

        const [accountsData, transactionsData, budgetsData, goalsData, categoriesData, incomeExpenseData] =
          await Promise.all([
            getAccounts(),
            getTransactions({ limit: 5, sort: "date", order: "desc" }),
            getBudgets({ isActive: true }),
            getGoals({ isCompleted: false }),
            getCategories(),
            getIncomeVsExpense({
              startDate: getStartDateForRange(timeRange),
              endDate,
              period: "monthly",
            }),
          ])

        setAccounts(accountsData.accounts)
        setTransactions(transactionsData.transactions)
        setBudgets(budgetsData.budgets)
        setGoals(goalsData?.goals || [])
        setCategories(categoriesData.categories)
        setIncomeVsExpenseData(incomeExpenseData.data || [])

        // Calculate dashboard stats
        const balance = accountsData.accounts.reduce((sum, account) => sum + account.balance, 0)
        setTotalBalance(balance)

        // Get monthly income and expenses
        const currentDate = new Date()
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

        const monthTransactions = await getTransactions({
          startDate: firstDayOfMonth.toISOString().split("T")[0],
          endDate: currentDate.toISOString().split("T")[0],
        })

        const income = monthTransactions.transactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0)

        const expenses = monthTransactions.transactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0)

        setMonthlyIncome(income)
        setMonthlyExpenses(expenses)
        setSavingsRate(income > 0 ? ((income - expenses) / income) * 100 : 0)

        // Get category data for pie chart
        const expenseTransactions = monthTransactions.transactions.filter((t) => t.type === "expense")

        // Group transactions by category
        const categoryTotals = {}

        expenseTransactions.forEach((transaction) => {
          const categoryId = transaction.categoryId
            ? typeof transaction.categoryId === "object"
              ? transaction.categoryId._id
              : transaction.categoryId
            : "uncategorized"

          if (!categoryTotals[categoryId]) {
            categoryTotals[categoryId] = 0
          }

          categoryTotals[categoryId] += transaction.amount
        })

        // Create pie chart data
        const pieData = Object.entries(categoryTotals)
          .map(([categoryId, total]) => {
            const category =
              categoryId === "uncategorized"
                ? { name: "Uncategorized", color: "#9CA3AF" }
                : categories.find((c) => c._id === categoryId) || { name: "Unknown", color: "#9CA3AF" }

            return {
              name: category.name,
              value: total,
              color: category.color || "#8b5cf6",
            }
          })
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)

        setCategoryData(pieData)

        // Get budget progress
        if (budgetsData.budgets.length > 0) {
          const budgetsWithProgress = await Promise.all(
            budgetsData.budgets.map(async (budget) => {
              try {
                const progressData = await fetch(`/api/budgets/${budget._id}/progress`)
                const progress = await progressData.json()
                return {
                  ...budget,
                  progress: progress.progress,
                }
              } catch (err) {
                console.error(`Failed to fetch progress for budget ${budget._id}:`, err)
                return budget
              }
            }),
          )
          setBudgetProgress(budgetsWithProgress)
        }
      } catch (err) {
        console.error("Dashboard data fetch error:", err)
        setError("Failed to load some dashboard data. Please try refreshing.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  const getStartDateForRange = (range) => {
    const now = new Date()
    switch (range) {
      case "week":
        now.setDate(now.getDate() - 7)
        break
      case "month":
        now.setMonth(now.getMonth() - 1)
        break
      case "quarter":
        now.setMonth(now.getMonth() - 3)
        break
      case "year":
        now.setFullYear(now.getFullYear() - 1)
        break
      default:
        now.setMonth(now.getMonth() - 1)
    }
    return now.toISOString().split("T")[0]
  }

  const handleTimeRangeChange = (value) => {
    setTimeRange(value)
  }

  // Calculate totals for income vs expense chart
  const totalIncome = incomeVsExpenseData.reduce((sum, item) => sum + item.income, 0)
  const totalExpense = incomeVsExpenseData.reduce((sum, item) => sum + item.expense, 0)
  const netSavings = totalIncome - totalExpense

  // Colors for charts
  const COLORS = ["#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6"]

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.firstName}!</p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="quarter">Last 3 months</SelectItem>
              <SelectItem value="year">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="hidden md:flex">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance, user?.currency)}</div>
            <p className="text-xs text-muted-foreground">Across all accounts</p>
          </CardContent>
        </Card>
        <Card className="hover-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(monthlyIncome, user?.currency)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card className="hover-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(monthlyExpenses, user?.currency)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card className="hover-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {savingsRate !== undefined ? `${Math.round(savingsRate)}%` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Of monthly income</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="hover-card md:col-span-4">
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Your financial flow over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {incomeVsExpenseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeVsExpenseData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value), user?.currency)}
                      contentStyle={{
                        borderRadius: "0.5rem",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        backgroundColor: "white",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expenses" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No data available for the selected period</p>
                </div>
              )}
            </div>

            {incomeVsExpenseData.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-violet-50 p-4 dark:bg-violet-900/20">
                  <h3 className="text-sm font-medium text-violet-700 dark:text-violet-300">Total Income</h3>
                  <p className="mt-2 text-2xl font-bold text-violet-700 dark:text-violet-300">
                    {formatCurrency(totalIncome, user?.currency)}
                  </p>
                </div>
                <div className="rounded-lg bg-pink-50 p-4 dark:bg-pink-900/20">
                  <h3 className="text-sm font-medium text-pink-700 dark:text-pink-300">Total Expenses</h3>
                  <p className="mt-2 text-2xl font-bold text-pink-700 dark:text-pink-300">
                    {formatCurrency(totalExpense, user?.currency)}
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-900/20">
                  <h3 className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Net Savings</h3>
                  <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(netSavings, user?.currency)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="hover-card md:col-span-3">
          <CardHeader>
            <CardTitle>Top Spending Categories</CardTitle>
            <CardDescription>Where your money is going</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value), user?.currency)}
                      contentStyle={{
                        borderRadius: "0.5rem",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        backgroundColor: "white",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No category data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover-card">
          <CardHeader className="pb-2">
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`rounded-full p-2 ${
                          transaction.type === "income"
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300"
                            : transaction.type === "expense"
                              ? "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300"
                              : "bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300"
                        }`}
                      >
                        {transaction.type === "income" ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : transaction.type === "expense" ? (
                          <ArrowDownRight className="h-4 w-4" />
                        ) : (
                          <CreditCard className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        transaction.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : transaction.type === "expense"
                            ? "text-rose-600 dark:text-rose-400"
                            : ""
                      }`}
                    >
                      {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
                      {formatCurrency(transaction.amount, user?.currency)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-muted-foreground">No recent transactions</p>
              </div>
            )}
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/transactions">View All Transactions</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-card">
          <CardHeader className="pb-2">
            <CardTitle>Active Budgets</CardTitle>
            <CardDescription>Your budget progress</CardDescription>
          </CardHeader>
          <CardContent>
            {budgets.length > 0 ? (
              <div className="space-y-4">
                {budgets.map((budget) => {
                  const progress = budget.progress || { spent: 0, percentage: 0 }
                  const percentage = progress.spent ? Math.min(100, (progress.spent / budget.amount) * 100) : 0
                  const isOverBudget = percentage > 100

                  return (
                    <div key={budget._id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-violet-500" />
                          <p className="text-sm font-medium">{budget.name}</p>
                        </div>
                        <div className="text-sm font-medium">
                          {formatCurrency(progress.spent || 0, user?.currency)} /{" "}
                          {formatCurrency(budget.amount, user?.currency)}
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full ${isOverBudget ? "bg-rose-500" : "bg-violet-500"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isOverBudget ? `${Math.round(percentage)}% (Over budget)` : `${Math.round(percentage)}% used`}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-muted-foreground">No active budgets</p>
              </div>
            )}
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/budgets">View All Budgets</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-card">
          <CardHeader className="pb-2">
            <CardTitle>Financial Goals</CardTitle>
            <CardDescription>Track your progress</CardDescription>
          </CardHeader>
          <CardContent>
            {goals.length > 0 ? (
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-violet-500" />
                        <p className="text-sm font-medium">{goal.name}</p>
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(goal.currentAmount, user?.currency)} /{" "}
                        {formatCurrency(goal.targetAmount, user?.currency)}
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-violet-500"
                        style={{ width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((goal.currentAmount / goal.targetAmount) * 100)}% complete
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-muted-foreground">No active goals</p>
              </div>
            )}
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/goals">View All Goals</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover-card md:col-span-4">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
              <Button
                asChild
                variant="outline"
                className="h-auto flex-col items-center justify-center gap-2 p-6 hover-card"
              >
                <Link href="/transactions/new">
                  <div className="rounded-full bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                    <Plus className="h-5 w-5" />
                  </div>
                  <span className="mt-2">Add Transaction</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto flex-col items-center justify-center gap-2 p-6 hover-card"
              >
                <Link href="/accounts/new">
                  <div className="rounded-full bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <span className="mt-2">Add Account</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto flex-col items-center justify-center gap-2 p-6 hover-card"
              >
                <Link href="/budgets/new">
                  <div className="rounded-full bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                    <Target className="h-5 w-5" />
                  </div>
                  <span className="mt-2">Create Budget</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto flex-col items-center justify-center gap-2 p-6 hover-card"
              >
                <Link href="/reports">
                  <div className="rounded-full bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                    <Download className="h-5 w-5" />
                  </div>
                  <span className="mt-2">Export Data</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto flex-col items-center justify-center gap-2 p-6 hover-card"
              >
                <Link href="/projections">
                  <div className="rounded-full bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span className="mt-2">Financial Projections</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

