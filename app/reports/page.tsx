"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, BarChart3, PieChartIcon, TrendingUp, ArrowDownUp, Calendar, Download } from "lucide-react"
import { getIncomeVsExpense, getExpenseByCategory, getNetWorth, getCashFlow } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

export default function ReportsPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("income-expense")
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    period: "monthly",
  })

  // Report data states
  const [incomeVsExpenseData, setIncomeVsExpenseData] = useState([])
  const [expenseByCategoryData, setExpenseByCategoryData] = useState([])
  const [netWorthData, setNetWorthData] = useState({ currentNetWorth: {}, history: [] })
  const [cashFlowData, setCashFlowData] = useState({ incomeCategories: [], expenseCategories: [], data: [] })

  useEffect(() => {
    fetchReportData()
  }, [activeTab, dateRange])

  const fetchReportData = async () => {
    try {
      setIsLoading(true)

      switch (activeTab) {
        case "income-expense":
          const incomeExpenseData = await getIncomeVsExpense({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            period: dateRange.period,
          })
          setIncomeVsExpenseData(incomeExpenseData.data)
          break
        case "expense-category":
          const expenseCategoryData = await getExpenseByCategory({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          })
          setExpenseByCategoryData(expenseCategoryData.data)
          break
        case "net-worth":
          const netWorthData = await getNetWorth()
          setNetWorthData(netWorthData)
          break
        case "cash-flow":
          const cashFlowData = await getCashFlow({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            period: dateRange.period,
          })
          setCashFlowData(cashFlowData)
          break
      }
    } catch (err) {
      setError("Failed to load report data")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateRangeChange = (name, value) => {
    setDateRange({
      ...dateRange,
      [name]: value,
    })
  }

  // Colors for charts
  const COLORS = ["#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#6366f1"]

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" })
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Loading your reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-muted-foreground">Analyze your financial data with detailed reports</p>
      </div>

      {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}

      <Tabs defaultValue="income-expense" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
          <TabsList className="inline-flex h-10 w-full overflow-x-auto items-center justify-start rounded-md bg-muted p-1 text-muted-foreground md:w-auto md:justify-center">
            <TabsTrigger
              value="income-expense"
              className="rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Income vs Expenses
            </TabsTrigger>
            <TabsTrigger
              value="expense-category"
              className="rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <PieChartIcon className="mr-2 h-4 w-4" />
              Expense Categories
            </TabsTrigger>
            <TabsTrigger
              value="net-worth"
              className="rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Net Worth
            </TabsTrigger>
            <TabsTrigger
              value="cash-flow"
              className="rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <ArrowDownUp className="mr-2 h-4 w-4" />
              Cash Flow
            </TabsTrigger>
          </TabsList>

          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        <Card className="hover-card">
          <CardHeader className="pb-3">
            <CardTitle>Date Range</CardTitle>
            <CardDescription>Select the time period for your report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-500" />
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange("startDate", e.target.value)}
                  className="transition-all focus-visible:ring-violet-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-500" />
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateRangeChange("endDate", e.target.value)}
                  className="transition-all focus-visible:ring-violet-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-500" />
                  Period
                </Label>
                <Select value={dateRange.period} onValueChange={(value) => handleDateRangeChange("period", value)}>
                  <SelectTrigger className="transition-all focus-visible:ring-violet-500">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="income-expense" className="animate-fade-in">
          <Card className="hover-card">
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
              <CardDescription>Compare your income and expenses over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-96">
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
                      <Bar dataKey="net" name="Net" fill="#10b981" radius={[4, 4, 0, 0]} />
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
                      {formatCurrency(
                        incomeVsExpenseData.reduce((sum, item) => sum + item.income, 0),
                        user?.currency,
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg bg-pink-50 p-4 dark:bg-pink-900/20">
                    <h3 className="text-sm font-medium text-pink-700 dark:text-pink-300">Total Expenses</h3>
                    <p className="mt-2 text-2xl font-bold text-pink-700 dark:text-pink-300">
                      {formatCurrency(
                        incomeVsExpenseData.reduce((sum, item) => sum + item.expense, 0),
                        user?.currency,
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-900/20">
                    <h3 className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Net Savings</h3>
                    <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(
                        incomeVsExpenseData.reduce((sum, item) => sum + item.net, 0),
                        user?.currency,
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expense-category" className="animate-fade-in">
          <Card className="hover-card">
            <CardHeader>
              <CardTitle>Expense by Category</CardTitle>
              <CardDescription>See how your expenses are distributed across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="h-64 sm:h-80">
                  {expenseByCategoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseByCategoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="total"
                          nameKey="categoryName"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {expenseByCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.categoryColor || COLORS[index % COLORS.length]} />
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
                      <p className="text-muted-foreground">No data available for the selected period</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-medium">Top Expense Categories</h3>
                  {expenseByCategoryData.length > 0 ? (
                    <div className="space-y-4">
                      {expenseByCategoryData
                        .sort((a, b) => b.total - a.total)
                        .slice(0, 5)
                        .map((category, index) => (
                          <div key={category._id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: category.categoryColor || COLORS[index % COLORS.length] }}
                                />
                                <span className="font-medium">{category.categoryName || "Uncategorized"}</span>
                              </div>
                              <span className="font-medium">{formatCurrency(category.total, user?.currency)}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(category.total / expenseByCategoryData[0].total) * 100}%`,
                                  backgroundColor: category.categoryColor || COLORS[index % COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
                      No expense data available
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="net-worth" className="animate-fade-in">
          <Card className="hover-card">
            <CardHeader>
              <CardTitle>Net Worth</CardTitle>
              <CardDescription>Track your net worth over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-96">
                {netWorthData.history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={netWorthData.history} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value), user?.currency)}
                        labelFormatter={formatDate}
                        contentStyle={{
                          borderRadius: "0.5rem",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                          backgroundColor: "white",
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="assets" name="Assets" stroke="#8b5cf6" fill="#8b5cf680" />
                      <Area
                        type="monotone"
                        dataKey="liabilities"
                        name="Liabilities"
                        stroke="#ec4899"
                        fill="#ec489980"
                      />
                      <Area type="monotone" dataKey="netWorth" name="Net Worth" stroke="#10b981" fill="#10b98180" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No net worth data available</p>
                  </div>
                )}
              </div>

              {netWorthData.currentNetWorth && (
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-violet-50 p-4 dark:bg-violet-900/20">
                    <h3 className="text-sm font-medium text-violet-700 dark:text-violet-300">Total Assets</h3>
                    <p className="mt-2 text-2xl font-bold text-violet-700 dark:text-violet-300">
                      {formatCurrency(netWorthData.currentNetWorth.assets || 0, user?.currency)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-pink-50 p-4 dark:bg-pink-900/20">
                    <h3 className="text-sm font-medium text-pink-700 dark:text-pink-300">Total Liabilities</h3>
                    <p className="mt-2 text-2xl font-bold text-pink-700 dark:text-pink-300">
                      {formatCurrency(netWorthData.currentNetWorth.liabilities || 0, user?.currency)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-900/20">
                    <h3 className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Current Net Worth</h3>
                    <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(netWorthData.currentNetWorth.netWorth || 0, user?.currency)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-flow" className="animate-fade-in">
          <Card className="hover-card">
            <CardHeader>
              <CardTitle>Cash Flow</CardTitle>
              <CardDescription>Analyze your cash flow by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-96">
                {cashFlowData.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowData.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                      <Bar dataKey="totalIncome" name="Total Income" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="totalExpense" name="Total Expense" fill="#ec4899" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="netCashFlow" name="Net Cash Flow" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No cash flow data available for the selected period</p>
                  </div>
                )}
              </div>

              {cashFlowData.data.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-4 text-lg font-medium">Cash Flow Summary</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-violet-700 dark:text-violet-300">
                        Income Categories
                      </h4>
                      <div className="rounded-lg border p-4">
                        {cashFlowData.incomeCategories.length > 0 ? (
                          <div className="space-y-2">
                            {cashFlowData.incomeCategories.map((category) => (
                              <div key={category} className="flex items-center justify-between">
                                <span>{category}</span>
                                <span className="font-medium text-violet-700 dark:text-violet-300">
                                  {formatCurrency(
                                    cashFlowData.data.reduce((sum, period) => sum + (period.income[category] || 0), 0),
                                    user?.currency,
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground">No income categories</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-medium text-pink-700 dark:text-pink-300">Expense Categories</h4>
                      <div className="rounded-lg border p-4">
                        {cashFlowData.expenseCategories.length > 0 ? (
                          <div className="space-y-2">
                            {cashFlowData.expenseCategories.map((category) => (
                              <div key={category} className="flex items-center justify-between">
                                <span>{category}</span>
                                <span className="font-medium text-pink-700 dark:text-pink-300">
                                  {formatCurrency(
                                    cashFlowData.data.reduce((sum, period) => sum + (period.expense[category] || 0), 0),
                                    user?.currency,
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground">No expense categories</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

