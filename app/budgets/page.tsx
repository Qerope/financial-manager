"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Target, Pencil, Trash2, Loader2, Calendar, AlertTriangle, CheckCircle } from "lucide-react"
import { getBudgets, deleteBudget, getAllBudgetsProgress } from "@/lib/api"
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
import { Progress } from "@/components/ui/progress"

export default function BudgetsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [budgets, setBudgets] = useState([])
  const [budgetProgress, setBudgetProgress] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchBudgets()
  }, [])

  const fetchBudgets = async () => {
    try {
      setIsLoading(true)
      const [budgetsData, progressData] = await Promise.all([getBudgets(), getAllBudgetsProgress()])
      setBudgets(budgetsData.budgets)
      setBudgetProgress(progressData.budgets)
    } catch (err) {
      setError("Failed to load budgets")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBudget = async (id) => {
    try {
      await deleteBudget(id)
      setBudgets(budgets.filter((budget) => budget._id !== id))
      setBudgetProgress(budgetProgress.filter((budget) => budget._id !== id))
      toast({
        title: "Budget deleted",
        description: "The budget has been deleted successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete budget.",
        variant: "destructive",
      })
    }
  }

  // Group budgets by period
  const groupedBudgets = budgets.reduce((acc, budget) => {
    if (!acc[budget.period]) {
      acc[budget.period] = []
    }
    acc[budget.period].push(budget)
    return acc
  }, {})

  // Get budget progress by ID
  const getBudgetProgressById = (id) => {
    return budgetProgress.find((b) => b._id === id)?.progress || null
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Loading your budgets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">Manage your spending limits and track your progress</p>
        </div>
        <Button asChild variant="gradient" className="shadow-sm">
          <Link href="/budgets/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Budget
          </Link>
        </Button>
      </div>

      {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}

      <Card className="hover-card gradient-card">
        <CardHeader>
          <CardTitle className="text-2xl">Budget Overview</CardTitle>
          <CardDescription>Your active budgets and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
              <div className="flex items-center space-x-2">
                <div className="rounded-full bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                  <Target className="h-5 w-5" />
                </div>
                <span className="font-medium">Active Budgets</span>
              </div>
              <div className="mt-2 text-3xl font-bold">{budgets.filter((b) => b.isActive).length}</div>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
              <div className="flex items-center space-x-2">
                <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <span className="font-medium">Under Budget</span>
              </div>
              <div className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {budgetProgress.filter((b) => b.progress?.status === "under").length}
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
              <div className="flex items-center space-x-2">
                <div className="rounded-full bg-rose-100 p-2 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <span className="font-medium">Over Budget</span>
              </div>
              <div className="mt-2 text-3xl font-bold text-rose-600 dark:text-rose-400">
                {budgetProgress.filter((b) => b.progress?.status === "over").length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.keys(groupedBudgets).length > 0 ? (
        <Tabs defaultValue={Object.keys(groupedBudgets)[0] || "monthly"} className="space-y-6">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            {Object.keys(groupedBudgets).map((period) => (
              <TabsTrigger
                key={period}
                value={period}
                className="rounded-sm px-3 py-1.5 text-sm font-medium capitalize transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {period} Budgets
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(groupedBudgets).map(([period, periodBudgets]) => (
            <TabsContent key={period} value={period} className="animate-fade-in">
              <Card className="hover-card">
                <CardHeader>
                  <CardTitle className="capitalize">{period} Budgets</CardTitle>
                  <CardDescription>Your {period} spending limits and progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {periodBudgets.map((budget, index) => {
                      const progress = getBudgetProgressById(budget._id)
                      const percentage = progress ? Math.min(100, (progress.spent / budget.amount) * 100) : 0
                      const isOverBudget = progress && progress.spent > progress.expectedSpending

                      return (
                        <div
                          key={budget._id}
                          className={`rounded-lg border p-3 sm:p-4 shadow-sm transition-all hover:border-violet-200 hover:shadow-md dark:hover:border-violet-800 animate-fade-in animate-delay-${index * 100}`}
                        >
                          <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-medium">{budget.name}</h3>
                                {isOverBudget && (
                                  <div className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-600 dark:bg-rose-900/50 dark:text-rose-300">
                                    Over Budget
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {budget.category ? budget.category.name : "All Categories"}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">{formatCurrency(budget.amount, user?.currency)}</div>
                              {progress && (
                                <p className="text-sm text-muted-foreground">
                                  {formatCurrency(progress.spent, user?.currency)} spent
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span>Progress</span>
                              <span>{Math.round(percentage)}%</span>
                            </div>
                            <Progress
                              value={percentage}
                              className="h-2"
                              indicatorClassName={isOverBudget ? "bg-rose-500" : "bg-emerald-500"}
                            />
                          </div>

                          {progress && (
                            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                              <span>{formatCurrency(progress.remaining, user?.currency)} remaining</span>
                              <span>
                                Period: {new Date(progress.periodStart).toLocaleDateString()} -{" "}
                                {new Date(progress.periodEnd).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          <div className="mt-4 flex justify-end space-x-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/budgets/${budget._id}`}>View Details</Link>
                            </Button>
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <Link href={`/budgets/${budget._id}/edit`}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Link>
                            </Button>
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
                                  <AlertDialogTitle>Delete Budget</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this budget? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteBudget(budget._id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card className="hover-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-violet-100 p-4 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
              <Target className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No budgets found</h3>
            <p className="mt-1 text-center text-muted-foreground">Create budgets to track and control your spending</p>
            <Button asChild variant="gradient" className="mt-6 shadow-sm">
              <Link href="/budgets/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Budget
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

