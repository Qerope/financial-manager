"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, Target, Calendar, Pencil, Trash2, AlertTriangle, CheckCircle, ArrowDownRight } from "lucide-react"
import { getBudget, getBudgetProgress, deleteBudget, getTransactions } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
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

export default function BudgetPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [budget, setBudget] = useState(null)
  const [progress, setProgress] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        setIsLoading(true)
        const [budgetData, progressData, transactionsData] = await Promise.all([
          getBudget(params.id),
          getBudgetProgress(params.id),
          getTransactions({
            limit: 5,
            categoryId: budget?.categoryId?._id || "all",
            startDate: new Date().toISOString().split("T")[0],
            type: "expense",
          }),
        ])
        setBudget(budgetData.budget)
        setProgress(progressData.progress)
        setTransactions(transactionsData.transactions)
      } catch (err) {
        setError("Failed to load budget data")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBudgetData()
  }, [params.id])

  const handleDeleteBudget = async () => {
    try {
      await deleteBudget(params.id)
      toast({
        title: "Budget deleted",
        description: "The budget has been deleted successfully.",
      })
      router.push("/budgets")
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete budget.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Loading budget data...</p>
        </div>
      </div>
    )
  }

  if (error || !budget) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-rose-100 p-4 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300">
          <Trash2 className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-medium">Budget not found</h3>
        <p className="mt-1 text-center text-muted-foreground">
          The budget you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/budgets">Back to Budgets</Link>
        </Button>
      </div>
    )
  }

  const percentage = progress ? Math.min(100, (progress.spent / budget.amount) * 100) : 0
  const isOverBudget = progress && progress.spent > progress.expectedSpending

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{budget.name}</h1>
          <p className="text-muted-foreground capitalize">{budget.period} Budget</p>
        </div>
        <div className="flex space-x-2">
          <Button asChild variant="outline">
            <Link href={`/budgets/${params.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Budget
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Budget
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
                  onClick={handleDeleteBudget}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card className="hover-card gradient-card">
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>Your spending progress for this budget</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
              <div className="flex items-center space-x-2">
                <div className="rounded-full bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                  <Target className="h-5 w-5" />
                </div>
                <span className="font-medium">Budget Amount</span>
              </div>
              <div className="mt-2 text-3xl font-bold">{formatCurrency(budget.amount, user?.currency)}</div>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
              <div className="flex items-center space-x-2">
                <div
                  className={`rounded-full p-2 ${
                    isOverBudget
                      ? "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300"
                      : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300"
                  }`}
                >
                  {isOverBudget ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                </div>
                <span className="font-medium">Spent Amount</span>
              </div>
              <div
                className={`mt-2 text-3xl font-bold ${
                  isOverBudget ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {formatCurrency(progress?.spent || 0, user?.currency)}
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
              <div className="flex items-center space-x-2">
                <div className="rounded-full bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                  <Calendar className="h-5 w-5" />
                </div>
                <span className="font-medium">Period</span>
              </div>
              <div className="mt-2 text-sm font-medium">
                {progress ? (
                  <>
                    {new Date(progress.periodStart).toLocaleDateString()} -{" "}
                    {new Date(progress.periodEnd).toLocaleDateString()}
                  </>
                ) : (
                  <>
                    {new Date(budget.startDate).toLocaleDateString()} -{" "}
                    {budget.endDate ? new Date(budget.endDate).toLocaleDateString() : "Ongoing"}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">Budget Progress</span>
              <span>{Math.round(percentage)}%</span>
            </div>
            <Progress
              value={percentage}
              className="h-4"
              indicatorClassName={isOverBudget ? "bg-rose-500" : "bg-emerald-500"}
            />
            <div className="mt-2 flex justify-between text-sm text-muted-foreground">
              <span>{formatCurrency(progress?.remaining || budget.amount, user?.currency)} remaining</span>
              <span>{formatCurrency(budget.amount, user?.currency)} total</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover-card">
          <CardHeader>
            <CardTitle>Budget Details</CardTitle>
            <CardDescription>Information about this budget</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{budget.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Period</p>
                  <p className="font-medium capitalize">{budget.period}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{budget.categoryId ? budget.categoryId.name : "All Categories"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{budget.isActive ? "Active" : "Inactive"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{new Date(budget.startDate).toLocaleDateString()}</p>
                </div>
                {budget.endDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">{new Date(budget.endDate).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Rollover</p>
                  <p className="font-medium">{budget.rollover ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Notifications</p>
                  <p className="font-medium">
                    {budget.notifications?.enabled
                      ? `Enabled (${budget.notifications.threshold}% threshold)`
                      : "Disabled"}
                  </p>
                </div>
              </div>

              {budget.notes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1">{budget.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover-card">
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Recent transactions affecting this budget</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between rounded-lg border p-3 transition-all hover:border-violet-200 hover:bg-violet-50/50 dark:hover:border-violet-800 dark:hover:bg-violet-900/20"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="rounded-full bg-rose-100 p-1.5 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300">
                        <ArrowDownRight className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-rose-600 dark:text-rose-400">
                      -{formatCurrency(transaction.amount, user?.currency)}
                    </div>
                  </div>
                ))}

                <Button asChild variant="outline" className="w-full">
                  <Link href={`/transactions?categoryId=${budget.categoryId?._id || "all"}&type=expense`}>
                    View All Transactions
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="rounded-full bg-violet-100 p-4 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No recent expenses</h3>
                <p className="mt-1 text-center text-muted-foreground">
                  There are no recent expenses affecting this budget.
                </p>
                <Button asChild variant="gradient" className="mt-6 shadow-sm">
                  <Link href="/transactions/new">Add Transaction</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

