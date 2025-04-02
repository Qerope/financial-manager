"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Tag, Pencil, Trash2, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { getCategories, deleteCategory, getCategoryStats } from "@/lib/api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

export default function CategoriesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [categories, setCategories] = useState([])
  const [categoryStats, setCategoryStats] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const [categoriesData, statsData] = await Promise.all([getCategories(), getCategoryStats()])
      setCategories(categoriesData.categories)
      setCategoryStats(statsData.categoryStats)
    } catch (err) {
      setError("Failed to load categories")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategory(id)
      setCategories(categories.filter((category) => category._id !== id))
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete category. It may have associated transactions.",
        variant: "destructive",
      })
    }
  }

  // Group categories by type
  const incomeCategories = categories.filter((category) => category.type === "income")
  const expenseCategories = categories.filter((category) => category.type === "expense")

  // Prepare data for pie charts
  const incomeData = categoryStats
    .filter((stat) => stat.type === "income")
    .map((stat) => ({
      name: stat.name,
      value: stat.total,
      color: stat.color || "#8b5cf6",
    }))

  const expenseData = categoryStats
    .filter((stat) => stat.type === "expense")
    .map((stat) => ({
      name: stat.name,
      value: stat.total,
      color: stat.color || "#8b5cf6",
    }))

  // Calculate totals
  const totalIncome = incomeData.reduce((sum, item) => sum + item.value, 0)
  const totalExpense = expenseData.reduce((sum, item) => sum + item.value, 0)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Loading your categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Manage your income and expense categories</p>
        </div>
        <Button asChild variant="gradient" className="shadow-sm">
          <Link href="/categories/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Link>
        </Button>
      </div>

      {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card className="hover-card">
          <CardHeader>
            <CardTitle>Income Distribution</CardTitle>
            <CardDescription>How your income is distributed across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {incomeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {incomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
                  <p className="text-muted-foreground">No income data available</p>
                </div>
              )}
            </div>
            <div className="mt-4 text-center text-lg font-semibold">
              Total Income: {formatCurrency(totalIncome, user?.currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="hover-card">
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
            <CardDescription>How your expenses are distributed across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {expenseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
                  <p className="text-muted-foreground">No expense data available</p>
                </div>
              )}
            </div>
            <div className="mt-4 text-center text-lg font-semibold">
              Total Expenses: {formatCurrency(totalExpense, user?.currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="income" className="space-y-6">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger
            value="income"
            className="rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <ArrowUpRight className="mr-2 h-4 w-4 text-emerald-500" />
            Income Categories
          </TabsTrigger>
          <TabsTrigger
            value="expense"
            className="rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <ArrowDownRight className="mr-2 h-4 w-4 text-rose-500" />
            Expense Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="animate-fade-in">
          <Card className="hover-card">
            <CardHeader>
              <CardTitle>Income Categories</CardTitle>
              <CardDescription>Categories for tracking your income sources</CardDescription>
            </CardHeader>
            <CardContent>
              {incomeCategories.length > 0 ? (
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {incomeCategories.map((category, index) => (
                    <div
                      key={category._id}
                      className={`rounded-lg border p-4 shadow-sm transition-all hover:border-violet-200 hover:shadow-md dark:hover:border-violet-800 animate-fade-in animate-delay-${index * 100}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="rounded-full p-2"
                            style={{ backgroundColor: `${category.color}20`, color: category.color }}
                          >
                            <Tag className="h-4 w-4" />
                          </div>
                          <h3 className="font-medium">{category.name}</h3>
                        </div>
                        <div className="flex space-x-1">
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <Link href={`/categories/${category._id}/edit`}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                          {!category.isDefault && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this category? This action cannot be undone. Any
                                    transactions with this category will be uncategorized.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCategory(category._id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        {categoryStats.find((stat) => stat._id === category._id) ? (
                          <div className="text-sm text-muted-foreground">
                            {categoryStats.find((stat) => stat._id === category._id).transactionCount} transactions
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No transactions</div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6">
                    <div className="rounded-full bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                      <Plus className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 font-medium">Add Income Category</h3>
                    <p className="mt-1 text-center text-sm text-muted-foreground">
                      Create a new category for your income
                    </p>
                    <Button asChild variant="outline" className="mt-4">
                      <Link href="/categories/new?type=income">Add Category</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="rounded-full bg-violet-100 p-4 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                    <Tag className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No income categories found</h3>
                  <p className="mt-1 text-center text-muted-foreground">
                    Create categories to organize your income sources
                  </p>
                  <Button asChild variant="gradient" className="mt-6 shadow-sm">
                    <Link href="/categories/new?type=income">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Income Category
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expense" className="animate-fade-in">
          <Card className="hover-card">
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
              <CardDescription>Categories for tracking your expenses</CardDescription>
            </CardHeader>
            <CardContent>
              {expenseCategories.length > 0 ? (
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {expenseCategories.map((category, index) => (
                    <div
                      key={category._id}
                      className={`rounded-lg border p-4 shadow-sm transition-all hover:border-violet-200 hover:shadow-md dark:hover:border-violet-800 animate-fade-in animate-delay-${index * 100}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="rounded-full p-2"
                            style={{ backgroundColor: `${category.color}20`, color: category.color }}
                          >
                            <Tag className="h-4 w-4" />
                          </div>
                          <h3 className="font-medium">{category.name}</h3>
                        </div>
                        <div className="flex space-x-1">
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <Link href={`/categories/${category._id}/edit`}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                          {!category.isDefault && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this category? This action cannot be undone. Any
                                    transactions with this category will be uncategorized.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCategory(category._id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        {categoryStats.find((stat) => stat._id === category._id) ? (
                          <div className="text-sm text-muted-foreground">
                            {categoryStats.find((stat) => stat._id === category._id).transactionCount} transactions
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No transactions</div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6">
                    <div className="rounded-full bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                      <Plus className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 font-medium">Add Expense Category</h3>
                    <p className="mt-1 text-center text-sm text-muted-foreground">
                      Create a new category for your expenses
                    </p>
                    <Button asChild variant="outline" className="mt-4">
                      <Link href="/categories/new?type=expense">Add Category</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="rounded-full bg-violet-100 p-4 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                    <Tag className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No expense categories found</h3>
                  <p className="mt-1 text-center text-muted-foreground">Create categories to organize your expenses</p>
                  <Button asChild variant="gradient" className="mt-6 shadow-sm">
                    <Link href="/categories/new?type=expense">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Expense Category
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

