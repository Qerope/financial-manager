"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Tag, ArrowUpRight, ArrowDownRight, Pencil, Trash2 } from "lucide-react"
import { getCategory, getCategoryStats, deleteCategory } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"
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

export default function CategoryPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [category, setCategory] = useState(null)
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setIsLoading(true)
        const [categoryData, statsData] = await Promise.all([
          getCategory(params.id),
          getCategoryStats({ categoryId: params.id }),
        ])
        setCategory(categoryData.category)

        // Find the stats for this category
        const categoryStat = statsData.categoryStats.find((stat) => stat._id === params.id)
        setStats(categoryStat || null)
      } catch (err) {
        setError("Failed to load category data")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategoryData()
  }, [params.id])

  const handleDeleteCategory = async () => {
    try {
      await deleteCategory(params.id)
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully.",
      })
      router.push("/categories")
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete category. It may have associated transactions.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Loading category data...</p>
        </div>
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-rose-100 p-4 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300">
          <Trash2 className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-medium">Category not found</h3>
        <p className="mt-1 text-center text-muted-foreground">
          The category you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/categories">Back to Categories</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
          <p className="text-muted-foreground capitalize">{category.type} Category</p>
        </div>
        <div className="flex space-x-2">
          <Button asChild variant="outline">
            <Link href={`/categories/${params.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Category
            </Link>
          </Button>
          {!category.isDefault && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Category
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Category</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this category? This action cannot be undone. Any transactions with
                    this category will be uncategorized.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteCategory}
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover-card">
          <CardHeader>
            <CardTitle>Category Details</CardTitle>
            <CardDescription>Information about this category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div
                className="rounded-full p-4"
                style={{
                  backgroundColor: `${category.color}20`,
                  color: category.color,
                }}
              >
                <Tag className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-medium">{category.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {category.type} Category {category.isDefault && "(Default)"}
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{category.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Color</p>
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color }}></div>
                    <span>{category.color}</span>
                  </div>
                </div>
                {category.icon && (
                  <div>
                    <p className="text-sm text-muted-foreground">Icon</p>
                    <p className="font-medium">{category.icon}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{category.isActive ? "Active" : "Inactive"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-card">
          <CardHeader>
            <CardTitle>Transaction Statistics</CardTitle>
            <CardDescription>Summary of transactions in this category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-violet-50 p-4 dark:bg-violet-900/20">
                    <h3 className="text-sm font-medium text-violet-700 dark:text-violet-300">
                      Total {category.type === "income" ? "Income" : "Expenses"}
                    </h3>
                    <p className="mt-2 text-2xl font-bold text-violet-700 dark:text-violet-300">
                      {formatCurrency(stats.total, user?.currency)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-violet-50 p-4 dark:bg-violet-900/20">
                    <h3 className="text-sm font-medium text-violet-700 dark:text-violet-300">Transaction Count</h3>
                    <p className="mt-2 text-2xl font-bold text-violet-700 dark:text-violet-300">
                      {stats.transactionCount}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 font-medium">Recent Activity</h3>
                  <p className="text-sm text-muted-foreground">
                    View all transactions in this category to see your spending patterns.
                  </p>
                  <Button asChild variant="outline" className="mt-4 w-full">
                    <Link href={`/transactions?categoryId=${params.id}`}>View Transactions</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div
                  className={`rounded-full p-4 ${
                    category.type === "income"
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300"
                  }`}
                >
                  {category.type === "income" ? (
                    <ArrowUpRight className="h-6 w-6" />
                  ) : (
                    <ArrowDownRight className="h-6 w-6" />
                  )}
                </div>
                <h3 className="mt-4 text-lg font-medium">No transactions yet</h3>
                <p className="mt-1 text-center text-muted-foreground">
                  Start adding transactions to this category to see statistics.
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

