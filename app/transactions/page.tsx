"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  Calendar,
  CreditCard,
  Tag,
  Download,
  SortAsc,
  ShoppingCart,
  Coffee,
  Home,
  Car,
  Briefcase,
  Utensils,
  Plane,
  Gift,
  Smartphone,
  DollarSign,
  Zap,
  Droplet,
  Wifi,
  Scissors,
  Landmark,
  Leaf,
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getTransactions, getAccounts, getCategories, deleteTransaction } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
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
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function TransactionsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    accountId: "all",
    categoryId: "all",
    startDate: "",
    endDate: "",
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [accountsData, categoriesData] = await Promise.all([getAccounts(), getCategories()])
        setAccounts(accountsData.accounts)
        setCategories(categoriesData.categories)

        await fetchTransactions()
      } catch (err) {
        setError("Failed to load data")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const fetchTransactions = async (page = 1) => {
    try {
      setIsLoading(true)

      const params = {
        page,
        limit: pagination.limit,
        sort: sortConfig.key,
        order: sortConfig.direction,
      }

      // Add filters if they're not the default values
      if (filters.search) params.search = filters.search
      if (filters.type !== "all") params.type = filters.type
      if (filters.accountId !== "all") params.accountId = filters.accountId
      if (filters.categoryId !== "all") params.categoryId = filters.categoryId
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate

      const data = await getTransactions(params)

      // Process transactions to ensure they have all required data
      const processedTransactions = data.transactions.map((transaction) => {
        // Find the account for this transaction
        const account =
          transaction.accountId && typeof transaction.accountId === "object"
            ? transaction.accountId
            : accounts.find((a) => a._id === transaction.accountId) || null

        // Find the category for this transaction if it has one
        const category =
          transaction.categoryId && typeof transaction.categoryId === "object"
            ? transaction.categoryId
            : transaction.categoryId
              ? categories.find((c) => c._id === transaction.categoryId) || null
              : null

        // Find the transfer account if this is a transfer
        const transferAccount =
          transaction.transferAccountId && typeof transaction.transferAccountId === "object"
            ? transaction.transferAccountId
            : transaction.transferAccountId
              ? accounts.find((a) => a._id === transaction.transferAccountId) || null
              : null

        return {
          ...transaction,
          account,
          category,
          transferAccount,
        }
      })

      setTransactions(processedTransactions)
      setPagination({
        page: data.page,
        limit: pagination.limit,
        total: data.total,
        pages: data.pages,
      })
    } catch (err) {
      setError("Failed to load transactions")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination({ ...pagination, page: 1 })
    fetchTransactions(1)
  }

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage })
    fetchTransactions(newPage)
  }

  const handleDeleteTransaction = async (id) => {
    try {
      await deleteTransaction(id)
      setTransactions(transactions.filter((transaction) => transaction._id !== id))
      toast({
        title: "Transaction deleted",
        description: "The transaction has been deleted successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete transaction.",
        variant: "destructive",
      })
    }
  }

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc"
    setSortConfig({ key, direction })
    setPagination({ ...pagination, page: 1 })
    fetchTransactions(1)
  }

  const getAccountName = (transaction) => {
    if (!transaction.account) return "Unknown Account"
    return typeof transaction.account === "object" ? transaction.account.name : "Unknown Account"
  }

  const getCategoryName = (transaction) => {
    if (transaction.type === "transfer") return null
    if (!transaction.category) return null
    return typeof transaction.category === "object" ? transaction.category.name : null
  }

  const getCategoryColor = (transaction) => {
    if (transaction.type === "transfer" || !transaction.category) return "#9CA3AF"
    return typeof transaction.category === "object" ? transaction.category.color || "#9CA3AF" : "#9CA3AF"
  }

  // Function to get appropriate icon for a category
  const getCategoryIcon = (transaction) => {
    if (transaction.type === "transfer") return <ArrowRight className="h-4 w-4" />
    if (!transaction.category) return <Tag className="h-4 w-4" />

    const categoryName = typeof transaction.category === "object" ? transaction.category.name.toLowerCase() : ""

    // Map category names to appropriate icons
    if (categoryName.includes("food") || categoryName.includes("restaurant") || categoryName.includes("dining"))
      return <Utensils className="h-4 w-4" />
    if (categoryName.includes("grocery") || categoryName.includes("shopping"))
      return <ShoppingCart className="h-4 w-4" />
    if (categoryName.includes("coffee") || categoryName.includes("cafe")) return <Coffee className="h-4 w-4" />
    if (categoryName.includes("home") || categoryName.includes("rent") || categoryName.includes("mortgage"))
      return <Home className="h-4 w-4" />
    if (categoryName.includes("car") || categoryName.includes("auto") || categoryName.includes("gas"))
      return <Car className="h-4 w-4" />
    if (categoryName.includes("work") || categoryName.includes("salary") || categoryName.includes("income"))
      return <Briefcase className="h-4 w-4" />
    if (categoryName.includes("travel") || categoryName.includes("flight")) return <Plane className="h-4 w-4" />
    if (categoryName.includes("gift") || categoryName.includes("present")) return <Gift className="h-4 w-4" />
    if (categoryName.includes("phone") || categoryName.includes("mobile")) return <Smartphone className="h-4 w-4" />
    if (categoryName.includes("investment") || categoryName.includes("stock")) return <DollarSign className="h-4 w-4" />
    if (categoryName.includes("electric") || categoryName.includes("power")) return <Zap className="h-4 w-4" />
    if (categoryName.includes("water")) return <Droplet className="h-4 w-4" />
    if (categoryName.includes("internet") || categoryName.includes("wifi")) return <Wifi className="h-4 w-4" />
    if (categoryName.includes("haircut") || categoryName.includes("salon")) return <Scissors className="h-4 w-4" />
    if (categoryName.includes("bank") || categoryName.includes("loan")) return <Landmark className="h-4 w-4" />
    if (categoryName.includes("health") || categoryName.includes("medical")) return <Leaf className="h-4 w-4" />

    // Default icon
    return <Tag className="h-4 w-4" />
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.type !== "all") count++
    if (filters.accountId !== "all") count++
    if (filters.categoryId !== "all") count++
    if (filters.startDate) count++
    if (filters.endDate) count++
    return count
  }

  // Function to export transactions to CSV
  const exportToCSV = () => {
    // Create CSV header
    let csv = "Date,Description,Amount,Type,Account,Category,Notes\n"

    // Add transaction data
    transactions.forEach((transaction) => {
      const row = [
        formatDate(transaction.date),
        `"${transaction.description.replace(/"/g, '""')}"`,
        transaction.amount,
        transaction.type,
        getAccountName(transaction),
        getCategoryName(transaction) || "N/A",
        transaction.notes ? `"${transaction.notes.replace(/"/g, '""')}"` : "",
      ]
      csv += row.join(",") + "\n"
    })

    // Create download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `transactions_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Loading your transactions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Transactions</h1>
          <p className="text-muted-foreground">View and manage your financial transactions</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={exportToCSV} className="hidden md:flex">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button asChild variant="gradient" className="shadow-sm md:flex hidden">
            <Link href="/transactions/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Link>
          </Button>
        </div>
      </div>

      {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}

      <Card className="hover-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
            <div>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>Find specific transactions</CardDescription>
            </div>
            <div className="flex space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <SortAsc className="h-4 w-4" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSort("date")}>
                    Date {sortConfig.key === "date" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("amount")}>
                    Amount {sortConfig.key === "amount" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("description")}>
                    Description {sortConfig.key === "description" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1"
              >
                <Filter className="h-4 w-4" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300"
                  >
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10 transition-all focus-visible:ring-violet-500"
              />
            </div>

            {showFilters && (
              <div className="rounded-lg border p-4 animate-fade-in">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Tag className="h-4 w-4 text-violet-500" />
                      Transaction Type
                    </div>
                    <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                      <SelectTrigger className="transition-all focus-visible:ring-violet-500">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CreditCard className="h-4 w-4 text-violet-500" />
                      Account
                    </div>
                    <Select value={filters.accountId} onValueChange={(value) => handleFilterChange("accountId", value)}>
                      <SelectTrigger className="transition-all focus-visible:ring-violet-500">
                        <SelectValue placeholder="All Accounts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Accounts</SelectItem>
                        {accounts.map((account) => (
                          <SelectItem key={account._id} value={account._id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Tag className="h-4 w-4 text-violet-500" />
                      Category
                    </div>
                    <Select
                      value={filters.categoryId}
                      onValueChange={(value) => handleFilterChange("categoryId", value)}
                    >
                      <SelectTrigger className="transition-all focus-visible:ring-violet-500">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4 text-violet-500" />
                      Start Date
                    </div>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange("startDate", e.target.value)}
                      className="transition-all focus-visible:ring-violet-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4 text-violet-500" />
                      End Date
                    </div>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange("endDate", e.target.value)}
                      className="transition-all focus-visible:ring-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" variant="gradient" className="shadow-sm">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="hover-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Transaction List</CardTitle>
              <CardDescription>
                Showing {transactions.length} of {pagination.total} transactions
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportToCSV} className="md:hidden">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction, index) => {
                const categoryName = getCategoryName(transaction)
                return (
                  <div
                    key={transaction._id}
                    className={`flex flex-row items-center justify-between rounded-lg border p-3 transition-all hover:border-violet-200 hover:bg-violet-50/50 dark:hover:border-violet-800 dark:hover:bg-violet-900/20 animate-fade-in animate-delay-${index * 100}`}
                  >
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
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span>{formatDate(transaction.date)}</span>
                          <span className="h-1 w-1 rounded-full bg-muted-foreground"></span>
                          <span>{getAccountName(transaction)}</span>
                          {categoryName && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-muted-foreground"></span>
                              <Badge
                                variant="outline"
                                className="rounded-full border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300"
                                style={{
                                  borderColor: `${getCategoryColor(transaction)}40`,
                                  backgroundColor: `${getCategoryColor(transaction)}10`,
                                  color: getCategoryColor(transaction),
                                }}
                              >
                                <span className="flex items-center gap-1">
                                  {getCategoryIcon(transaction)}
                                  {categoryName}
                                </span>
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
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
                      <div className="flex space-x-2 mt-1">
                        <Button asChild variant="outline" size="sm" className="h-7 rounded-full px-2 py-0 text-xs">
                          <Link href={`/transactions/${transaction._id}/edit`}>Edit</Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 rounded-full px-2 py-0 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
                            >
                              Delete
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
                                onClick={() => handleDeleteTransaction(transaction._id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <div className="rounded-full bg-violet-100 p-4 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-medium">No transactions found</h3>
              <p className="mt-1 text-center text-muted-foreground">Try adjusting your search or filter criteria</p>
              <Button asChild variant="gradient" className="mt-6 shadow-sm">
                <Link href="/transactions/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </Link>
              </Button>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="h-8 w-8 rounded-full p-0"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="h-8 w-8 rounded-full p-0"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

