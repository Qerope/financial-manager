"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, CreditCard, Wallet, Landmark, PiggyBank, Banknote, DollarSign, TrendingUp } from "lucide-react"
import { createAccount } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function NewAccountPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "checking",
    balance: 0,
    currency: user?.currency || "USD",
    institution: "",
    notes: "",
    includeInNetWorth: true,
    isActive: true,
    color: "#8b5cf6",
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await createAccount({
        ...formData,
        balance: Number(formData.balance),
      })

      toast({
        title: "Account created",
        description: "Your account has been created successfully.",
      })

      router.push("/accounts")
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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
        return <DollarSign className="h-5 w-5" />
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Account</h1>
        <p className="text-muted-foreground">Create a new account to track your finances</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="hover-card">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                {getAccountIcon(formData.type)}
              </div>
              <div>
                <CardTitle>Account Details</CardTitle>
                <CardDescription>Enter the details of your new account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Main Checking Account"
                className="transition-all focus-visible:ring-violet-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Account Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)} required>
                <SelectTrigger className="transition-all focus-visible:ring-violet-500">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking" className="flex items-center">
                    <div className="flex items-center">
                      <Wallet className="mr-2 h-4 w-4 text-violet-500" />
                      <span>Checking</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="savings">
                    <div className="flex items-center">
                      <PiggyBank className="mr-2 h-4 w-4 text-violet-500" />
                      <span>Savings</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="credit">
                    <div className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4 text-violet-500" />
                      <span>Credit Card</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="investment">
                    <div className="flex items-center">
                      <TrendingUp className="mr-2 h-4 w-4 text-violet-500" />
                      <span>Investment</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="loan">
                    <div className="flex items-center">
                      <Landmark className="mr-2 h-4 w-4 text-violet-500" />
                      <span>Loan</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cash">
                    <div className="flex items-center">
                      <Banknote className="mr-2 h-4 w-4 text-violet-500" />
                      <span>Cash</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center">
                      <DollarSign className="mr-2 h-4 w-4 text-violet-500" />
                      <span>Other</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">Current Balance</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="balance"
                  name="balance"
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={handleChange}
                  className="pl-10 transition-all focus-visible:ring-violet-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleSelectChange("currency", value)}
                required
              >
                <SelectTrigger className="transition-all focus-visible:ring-violet-500">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution">Institution (Optional)</Label>
              <Input
                id="institution"
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                placeholder="e.g. Bank of America"
                className="transition-all focus-visible:ring-violet-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional information about this account"
                className="transition-all focus-visible:ring-violet-500"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="includeInNetWorth" className="text-base">
                  Include in Net Worth
                </Label>
                <p className="text-sm text-muted-foreground">Include this account in net worth calculations</p>
              </div>
              <Switch
                id="includeInNetWorth"
                name="includeInNetWorth"
                checked={formData.includeInNetWorth}
                onCheckedChange={(checked) => handleSelectChange("includeInNetWorth", checked)}
                className="data-[state=checked]:bg-violet-600"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-base">
                  Active Account
                </Label>
                <p className="text-sm text-muted-foreground">Inactive accounts are hidden from the dashboard</p>
              </div>
              <Switch
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleSelectChange("isActive", checked)}
                className="data-[state=checked]:bg-violet-600"
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
                "Create Account"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

