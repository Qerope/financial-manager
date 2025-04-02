"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Calendar,
  DollarSign,
  CreditCard,
  Tag,
  User,
  FileText,
} from "lucide-react"
import { createTransaction, getAccounts, getCategories } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { suggestCategory } from "@/lib/utils"

export default function NewTransactionPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    accountId: "",
    categoryId: "",
    payee: "",
    notes: "",
    isRecurring: false,
    transferAccountId: "",
  })
  const [suggestedCategory, setSuggestedCategory] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [accountsData, categoriesData] = await Promise.all([getAccounts(), getCategories()])
        setAccounts(accountsData.accounts)
        setCategories(categoriesData.categories)

        // Set default account if available
        if (accountsData.accounts.length > 0) {
          setFormData((prev) => ({
            ...prev,
            accountId: accountsData.accounts[0]._id,
          }))
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load accounts and categories.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    // If description is being changed, try to auto-categorize
    if (name === "description" && value && formData.type !== "transfer") {
      const categoryId = suggestCategory(value, categories)

      if (categoryId && categoryId !== formData.categoryId) {
        const category = categories.find((c) => c._id === categoryId)
        setSuggestedCategory(category)

        setFormData({
          ...formData,
          [name]: value,
          categoryId: categoryId,
        })
      } else {
        setFormData({
          ...formData,
          [name]: value,
        })
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      })
    }
  }

  const handleSelectChange = (name, value) => {
    if (name === "type" && value !== "transfer") {
      // Clear transferAccountId when switching from transfer to another type
      setFormData({
        ...formData,
        [name]: value,
        transferAccountId: "",
      })

      // Reset suggested category when changing type
      setSuggestedCategory(null)
    } else if (name === "type" && value === "transfer") {
      // Clear categoryId when switching to transfer
      setFormData({
        ...formData,
        [name]: value,
        categoryId: "",
      })

      // Reset suggested category when changing to transfer
      setSuggestedCategory(null)
    } else if (name === "categoryId") {
      // Clear suggested category when manually selecting a category
      setSuggestedCategory(null)

      setFormData({
        ...formData,
        [name]: value,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Create a new object without transferAccountId if it's not a transfer
      const transactionData = {
        ...formData,
        amount: Number(formData.amount),
      }

      // Only include transferAccountId if this is a transfer and it has a value
      if (formData.type !== "transfer") {
        delete transactionData.transferAccountId
      }

      // Only include categoryId if this is not a transfer and it has a value
      if (formData.type === "transfer" || !formData.categoryId || formData.categoryId === "none") {
        delete transactionData.categoryId
      }

      await createTransaction(transactionData)

      toast({
        title: "Transaction created",
        description: "Your transaction has been created successfully.",
      })

      router.push("/transactions")
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create transaction. Please try again.",
        variant: "destructive",
      })
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter categories based on transaction type
  const filteredCategories = categories.filter((category) => category.type === formData.type)

  const getTransactionIcon = () => {
    switch (formData.type) {
      case "income":
        return <ArrowUpRight className="h-5 w-5 text-emerald-600" />
      case "expense":
        return <ArrowDownRight className="h-5 w-5 text-rose-600" />
      case "transfer":
        return <ArrowRight className="h-5 w-5 text-violet-600" />
      default:
        return <ArrowDownRight className="h-5 w-5 text-rose-600" />
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Add New Transaction</h1>
        <p className="text-muted-foreground">Record a new financial transaction</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="hover-card">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div
                className={`rounded-full p-2 ${
                  formData.type === "income"
                    ? "bg-emerald-100 dark:bg-emerald-900/50"
                    : formData.type === "expense"
                      ? "bg-rose-100 dark:bg-rose-900/50"
                      : "bg-violet-100 dark:bg-violet-900/50"
                }`}
              >
                {getTransactionIcon()}
              </div>
              <div>
                <CardTitle>Transaction Details</CardTitle>
                <CardDescription>Enter the details of your transaction</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">Transaction Type</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={formData.type === "expense" ? "default" : "outline"}
                  className={
                    formData.type === "expense"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/50"
                  }
                  onClick={() => handleSelectChange("type", "expense")}
                >
                  <ArrowDownRight className="mr-2 h-4 w-4" />
                  Expense
                </Button>
                <Button
                  type="button"
                  variant={formData.type === "income" ? "default" : "outline"}
                  className={
                    formData.type === "income"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                  }
                  onClick={() => handleSelectChange("type", "income")}
                >
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Income
                </Button>
                <Button
                  type="button"
                  variant={formData.type === "transfer" ? "default" : "outline"}
                  className={
                    formData.type === "transfer"
                      ? "bg-violet-600 hover:bg-violet-700"
                      : "border-violet-200 text-violet-600 hover:bg-violet-50 hover:text-violet-700 dark:border-violet-900 dark:text-violet-400 dark:hover:bg-violet-950/50"
                  }
                  onClick={() => handleSelectChange("type", "transfer")}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Transfer
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-violet-500" />
                Amount
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  className="pl-10 transition-all focus-visible:ring-violet-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-violet-500" />
                Description
              </Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="transition-all focus-visible:ring-violet-500"
                placeholder="e.g. Grocery shopping"
                required
              />
              {suggestedCategory && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Category automatically set to "{suggestedCategory.name}" based on description
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-violet-500" />
                Date
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                className="transition-all focus-visible:ring-violet-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountId" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-violet-500" />
                Account
              </Label>
              <Select
                value={formData.accountId}
                onValueChange={(value) => handleSelectChange("accountId", value)}
                required
              >
                <SelectTrigger className="transition-all focus-visible:ring-violet-500">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account._id} value={account._id}>
                      <div className="flex items-center">
                        <span
                          className="mr-2 h-2 w-2 rounded-full"
                          style={{ backgroundColor: account.color || "#8b5cf6" }}
                        ></span>
                        {account.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.type === "transfer" ? (
              <div className="space-y-2">
                <Label htmlFor="transferAccountId" className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-violet-500" />
                  Transfer To
                </Label>
                <Select
                  value={formData.transferAccountId}
                  onValueChange={(value) => handleSelectChange("transferAccountId", value)}
                  required
                >
                  <SelectTrigger className="transition-all focus-visible:ring-violet-500">
                    <SelectValue placeholder="Select destination account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((account) => account._id !== formData.accountId)
                      .map((account) => (
                        <SelectItem key={account._id} value={account._id}>
                          <div className="flex items-center">
                            <span
                              className="mr-2 h-2 w-2 rounded-full"
                              style={{ backgroundColor: account.color || "#8b5cf6" }}
                            ></span>
                            {account.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="categoryId" className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-violet-500" />
                  Category
                </Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleSelectChange("categoryId", value)}>
                  <SelectTrigger className="transition-all focus-visible:ring-violet-500">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        <div className="flex items-center">
                          <span
                            className="mr-2 h-2 w-2 rounded-full"
                            style={{ backgroundColor: category.color || "#8b5cf6" }}
                          ></span>
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="payee" className="flex items-center gap-2">
                <User className="h-4 w-4 text-violet-500" />
                Payee (Optional)
              </Label>
              <Input
                id="payee"
                name="payee"
                value={formData.payee}
                onChange={handleChange}
                className="transition-all focus-visible:ring-violet-500"
                placeholder="e.g. Amazon, John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-violet-500" />
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="min-h-24 transition-all focus-visible:ring-violet-500"
                placeholder="Add any additional details about this transaction"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-violet-800 dark:hover:bg-violet-950 dark:hover:text-violet-300"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} variant="gradient" className="shadow-sm">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Transaction"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

