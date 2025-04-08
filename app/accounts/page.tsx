"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, CreditCard, Pencil, Trash2, Link2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAccounts, deleteAccount } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { PlaidLink } from "@/components/plaid-link"

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true)
      try {
        const response = await getAccounts()
        if (response.success) {
          setAccounts(response.accounts)
        } else {
          toast({
            title: "Error",
            description: "Failed to load accounts",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching accounts:", error)
        toast({
          title: "Error",
          description: "Failed to load accounts",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAccounts()
  }, [toast])

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      try {
        const response = await deleteAccount(id)
        if (response.success) {
          setAccounts(accounts.filter((account) => account._id !== id))
          toast({
            title: "Success",
            description: "Account deleted successfully",
          })
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to delete account",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error deleting account:", error)
        toast({
          title: "Error",
          description: "Failed to delete account",
          variant: "destructive",
        })
      }
    }
  }

  const getAccountTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case "checking":
        return "bg-blue-100 text-blue-800"
      case "savings":
        return "bg-green-100 text-green-800"
      case "credit card":
        return "bg-purple-100 text-purple-800"
      case "investment":
        return "bg-amber-100 text-amber-800"
      case "loan":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">Manage your financial accounts</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/accounts/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Account
            </Link>
          </Button>
          <PlaidLink
            buttonText="Connect Bank"
            variant="outline"
            className="flex items-center gap-2"
            onSuccess={() => router.push("/accounts/connect")}
          >
            <Link2 className="h-4 w-4" />
            Connect Bank
          </PlaidLink>
        </div>
      </div>

      {isLoading ? (
        <div>Loading accounts...</div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <CreditCard className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground mb-4">
              You don't have any accounts yet. Add an account to get started.
            </p>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/accounts/new">Add Account</Link>
              </Button>
              <PlaidLink
                buttonText="Connect Bank"
                variant="outline"
                onSuccess={() => router.push("/accounts/connect")}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account._id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{account.name}</CardTitle>
                  <Badge className={getAccountTypeColor(account.type)}>{account.type}</Badge>
                </div>
                <CardDescription>{account.institution || "No institution"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(account.balance, account.currency)}</div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/accounts/${account._id}/edit`} className="flex items-center gap-1">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 text-destructive"
                  onClick={() => handleDelete(account._id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
