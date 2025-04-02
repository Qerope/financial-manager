"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  CreditCard,
  Wallet,
  Landmark,
  PiggyBank,
  Banknote,
  Pencil,
  Trash2,
  Loader2,
  TrendingUp,
  ArrowRight,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { getAccounts, deleteAccount } from "@/lib/api"
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

export default function AccountsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setIsLoading(true)
      const data = await getAccounts()
      setAccounts(data.accounts)
    } catch (err) {
      setError("Failed to load accounts")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async (id) => {
    try {
      await deleteAccount(id)
      setAccounts(accounts.filter((account) => account._id !== id))
      toast({
        title: "Account deleted",
        description: "The account has been deleted successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete account. It may have associated transactions.",
        variant: "destructive",
      })
    }
  }

  const getAccountIcon = (type) => {
    switch (type) {
      case "checking":
        return <Wallet className="h-5 w-5" />
      case "savings":
        return <PiggyBank className="h-5 w-5" />
      case "credit":
        return <CreditCard className="h-5 w-5" />
      case "investment":
        return <TrendingUp className="h-5 w-5" />
      case "loan":
        return <Landmark className="h-5 w-5" />
      case "cash":
        return <Banknote className="h-5 w-5" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }

  // Calculate total balance across all accounts
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  // Group accounts by type
  const accountsByType = accounts.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = []
    }
    acc[account.type].push(account)
    return acc
  }, {})

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Loading your accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">Manage your financial accounts</p>
        </div>
        <Button asChild variant="gradient" className="shadow-sm">
          <Link href="/accounts/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Link>
        </Button>
      </div>

      {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}

      <Card className="hover-card gradient-card">
        <CardHeader>
          <CardTitle className="text-2xl">Total Balance</CardTitle>
          <CardDescription>Your combined balance across all accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold gradient-text">{formatCurrency(totalBalance, user?.currency)}</div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(accountsByType).map(([type, accounts]) => {
              const typeTotal = accounts.reduce((sum, account) => sum + account.balance, 0)
              const percentage = Math.round((typeTotal / totalBalance) * 100)

              return (
                <div key={type} className="rounded-lg bg-white p-3 shadow-sm dark:bg-gray-800">
                  <div className="flex items-center space-x-2">
                    <div className="rounded-full bg-violet-100 p-1.5 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                      {getAccountIcon(type)}
                    </div>
                    <span className="text-sm font-medium capitalize">{type}</span>
                  </div>
                  <div className="mt-2 text-lg font-semibold">{formatCurrency(typeTotal, user?.currency)}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{percentage}% of total</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger
            value="all"
            className="rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            All Accounts
          </TabsTrigger>
          {Object.keys(accountsByType).map((type) => (
            <TabsTrigger
              key={type}
              value={type}
              className="rounded-sm px-3 py-1.5 text-sm font-medium capitalize transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              {type}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-6 animate-fade-in">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account, index) => (
              <Card key={account._id} className={`hover-card animate-fade-in animate-delay-${index * 100}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="rounded-full bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                        {getAccountIcon(account.type)}
                      </div>
                      <CardTitle className="text-lg font-medium">{account.name}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="mt-1 capitalize">{account.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(account.balance, account.currency)}</div>
                  <p className="text-xs text-muted-foreground">{account.institution && account.institution}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button asChild variant="outline" size="sm" className="gap-1">
                    <Link href={`/accounts/${account._id}`}>
                      View Details
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                  <div className="flex space-x-2">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Link href={`/accounts/${account._id}/edit`}>
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
                          <AlertDialogTitle>Delete Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this account? This action cannot be undone. All transactions
                            associated with this account will also be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteAccount(account._id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardFooter>
              </Card>
            ))}
            <Card className="flex flex-col items-center justify-center p-6 hover-card animate-fade-in animate-delay-300">
              <div className="mb-4 rounded-full bg-violet-100 p-4 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                <CreditCard className="h-8 w-8" />
              </div>
              <h3 className="mb-1 text-lg font-medium">Add Account</h3>
              <p className="mb-4 text-center text-sm text-muted-foreground">Add a new bank account or credit card</p>
              <Button asChild variant="gradient" className="shadow-sm">
                <Link href="/accounts/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Account
                </Link>
              </Button>
            </Card>
          </div>
        </TabsContent>

        {Object.entries(accountsByType).map(([type, typeAccounts]) => (
          <TabsContent key={type} value={type} className="space-y-6 animate-fade-in">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {typeAccounts.map((account, index) => (
                <Card key={account._id} className={`hover-card animate-fade-in animate-delay-${index * 100}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="rounded-full bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                          {getAccountIcon(account.type)}
                        </div>
                        <CardTitle className="text-lg font-medium">{account.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(account.balance, account.currency)}</div>
                    <p className="text-xs text-muted-foreground">{account.institution && account.institution}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button asChild variant="outline" size="sm" className="gap-1">
                      <Link href={`/accounts/${account._id}`}>
                        View Details
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                    <div className="flex space-x-2">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <Link href={`/accounts/${account._id}/edit`}>
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
                            <AlertDialogTitle>Delete Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this account? This action cannot be undone. All
                              transactions associated with this account will also be deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAccount(account._id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

