"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Pencil,
  Trash2,
  Calendar,
  CreditCard,
  Tag,
  User,
  FileText,
  MapPin,
} from "lucide-react"
import { getTransaction, deleteTransaction } from "@/lib/api"
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

export default function TransactionPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [transaction, setTransaction] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchTransactionData = async () => {
      try {
        setIsLoading(true)
        const data = await getTransaction(params.id)
        setTransaction(data.transaction)
      } catch (err) {
        setError("Failed to load transaction data")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactionData()
  }, [params.id])

  const handleDeleteTransaction = async () => {
    try {
      await deleteTransaction(params.id)
      toast({
        title: "Transaction deleted",
        description: "The transaction has been deleted successfully.",
      })
      router.push("/transactions")
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete transaction.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Loading transaction data...</p>
        </div>
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-rose-100 p-4 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300">
          <Trash2 className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-medium">Transaction not found</h3>
        <p className="mt-1 text-center text-muted-foreground">
          The transaction you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/transactions">Back to Transactions</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{transaction.description}</h1>
          <p className="text-muted-foreground capitalize">{transaction.type} Transaction</p>
        </div>
        <div className="flex space-x-2">
          <Button asChild variant="outline">
            <Link href={`/transactions/${params.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Transaction
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Transaction
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this transaction? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteTransaction}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card className="hover-card">
        <CardHeader>
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
                <ArrowUpRight className="h-5 w-5" />
              ) : transaction.type === "expense" ? (
                <ArrowDownRight className="h-5 w-5" />
              ) : (
                <ArrowRight className="h-5 w-5" />
              )}
            </div>
            <div>
              <CardTitle>Transaction Details</CardTitle>
              <CardDescription>Information about this transaction</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-violet-50 p-4 dark:bg-violet-900/20">
            <div className="flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
              <div>
                <p className="text-sm font-medium text-violet-700 dark:text-violet-300">Amount</p>
                <p
                  className={`text-3xl font-bold ${
                    transaction.type === "income"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : transaction.type === "expense"
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-violet-700 dark:text-violet-300"
                  }`}
                >
                  {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
                  {formatCurrency(transaction.amount, user?.currency)}
                </p>
              </div>
              <div>
                <Badge
                  variant={
                    transaction.type === "income"
                      ? "default"
                      : transaction.type === "expense"
                        ? "destructive"
                        : "violet"
                  }
                  className="text-sm"
                >
                  {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-violet-500" />
                <p className="font-medium">Date</p>
              </div>
              <p className="mt-1 text-muted-foreground">{formatDate(transaction.date)}</p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-violet-500" />
                <p className="font-medium">Account</p>
              </div>
              <p className="mt-1 text-muted-foreground">{transaction.accountId?.name || "Unknown Account"}</p>
            </div>

            {transaction.type === "transfer" && transaction.transferAccountId && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-violet-500" />
                  <p className="font-medium">Transfer To</p>
                </div>
                <p className="mt-1 text-muted-foreground">{transaction.transferAccountId?.name || "Unknown Account"}</p>
              </div>
            )}

            {transaction.categoryId && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-violet-500" />
                  <p className="font-medium">Category</p>
                </div>
                <p className="mt-1 text-muted-foreground">{transaction.categoryId?.name || "Uncategorized"}</p>
              </div>
            )}

            {transaction.payee && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-violet-500" />
                  <p className="font-medium">Payee</p>
                </div>
                <p className="mt-1 text-muted-foreground">{transaction.payee}</p>
              </div>
            )}

            {transaction.location && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-violet-500" />
                  <p className="font-medium">Location</p>
                </div>
                <p className="mt-1 text-muted-foreground">{transaction.location}</p>
              </div>
            )}
          </div>

          {transaction.notes && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-violet-500" />
                <p className="font-medium">Notes</p>
              </div>
              <p className="mt-2 text-muted-foreground">{transaction.notes}</p>
            </div>
          )}

          {transaction.tags && transaction.tags.length > 0 && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-violet-500" />
                <p className="font-medium">Tags</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {transaction.tags.map((tag, index) => (
                  <Badge key={index} variant="violet">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/transactions">Back to Transactions</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

