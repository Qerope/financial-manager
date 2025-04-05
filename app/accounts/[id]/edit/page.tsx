"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
import { Loader2, Trash2 } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit", label: "Credit Card" },
  { value: "investment", label: "Investment" },
  { value: "loan", label: "Loan" },
  { value: "other", label: "Other" },
]

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
]

const COLORS = [
  { value: "violet-500", label: "Violet" },
  { value: "blue-500", label: "Blue" },
  { value: "green-500", label: "Green" },
  { value: "red-500", label: "Red" },
  { value: "yellow-500", label: "Yellow" },
  { value: "pink-500", label: "Pink" },
  { value: "indigo-500", label: "Indigo" },
  { value: "teal-500", label: "Teal" },
]

export default function EditAccountPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [account, setAccount] = useState({
    name: "",
    type: "checking",
    balance: 0,
    currency: "USD",
    description: "",
    color: "violet-500",
  })
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        setIsLoading(true)
        const data = await fetchWithAuth(`/api/accounts/${params.id}`)
        setAccount({
          name: data.name,
          type: data.type,
          balance: data.balance,
          currency: data.currency || "USD",
          description: data.description || "",
          color: data.color || "violet-500",
        })
        setError("")
      } catch (err: any) {
        console.error("Error fetching account:", err)
        setError("Failed to load account details. Please try again.")
        toast({
          title: "Error",
          description: err.message || "Failed to load account details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAccount()
  }, [params.id, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setAccount((prev) => ({
      ...prev,
      [name]: name === "balance" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setAccount((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSaving(true)
      setError("")

      await fetchWithAuth(`/api/accounts/${params.id}`, {
        method: "PUT",
        body: JSON.stringify(account),
      })

      toast({
        title: "Account updated",
        description: "Your account has been updated successfully",
      })

      router.push("/accounts")
    } catch (err: any) {
      console.error("Error updating account:", err)
      setError("Failed to update account. Please try again.")
      toast({
        title: "Error",
        description: err.message || "Failed to update account",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)

      await fetchWithAuth(`/api/accounts/${params.id}`, {
        method: "DELETE",
      })

      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully",
      })

      router.push("/accounts")
    } catch (err: any) {
      console.error("Error deleting account:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete account",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Account</CardTitle>
          <CardDescription>Update your account details or delete this account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="name">Account Name</Label>
              <Input id="name" name="name" value={account.name} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Account Type</Label>
                <Select value={account.type} onValueChange={(value) => handleSelectChange("type", value)}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="balance">Balance</Label>
                <Input
                  id="balance"
                  name="balance"
                  type="number"
                  step="0.01"
                  value={account.balance}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={account.currency} onValueChange={(value) => handleSelectChange("currency", value)}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Select value={account.color} onValueChange={(value) => handleSelectChange("color", value)}>
                  <SelectTrigger id="color">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center">
                          <div className={`mr-2 h-3 w-3 rounded-full bg-${color.value}`} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={account.description}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button" disabled={isDeleting || isSaving}>
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and all associated
                    transactions.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button type="submit" disabled={isSaving || isDeleting}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

