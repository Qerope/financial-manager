"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Link2, Unlink, RefreshCw, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlaidLink } from "@/components/plaid-link"
import {
  getPlaidItems,
  getAccounts,
  deletePlaidItem,
  linkPlaidAccount,
  unlinkPlaidAccount,
  syncTransactions,
} from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function ConnectAccountsPage() {
  const [plaidItems, setPlaidItems] = useState([])
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLinking, setIsLinking] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [selectedPlaidItem, setSelectedPlaidItem] = useState(null)
  const [selectedPlaidAccount, setSelectedPlaidAccount] = useState(null)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [itemsResponse, accountsResponse] = await Promise.all([getPlaidItems(), getAccounts()])

      if (itemsResponse.success) {
        setPlaidItems(itemsResponse.items)
      }

      if (accountsResponse.success) {
        setAccounts(accountsResponse.accounts)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDeleteItem = async (itemId) => {
    if (window.confirm("Are you sure you want to disconnect this bank?")) {
      try {
        const response = await deletePlaidItem(itemId)
        if (response.success) {
          toast({
            title: "Success",
            description: "Bank disconnected successfully",
          })
          fetchData()
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to disconnect bank",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error deleting Plaid item:", error)
        toast({
          title: "Error",
          description: "Failed to disconnect bank",
          variant: "destructive",
        })
      }
    }
  }

  const handleSyncTransactions = async (itemId) => {
    setIsSyncing(true)
    try {
      const response = await syncTransactions(itemId)
      if (response.success) {
        toast({
          title: "Success",
          description: "Transactions synced successfully",
        })
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to sync transactions",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error syncing transactions:", error)
      toast({
        title: "Error",
        description: "Failed to sync transactions",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleLinkAccount = async () => {
    if (!selectedPlaidItem || !selectedPlaidAccount || !selectedAccount) {
      toast({
        title: "Error",
        description: "Please select all required fields",
        variant: "destructive",
      })
      return
    }

    setIsLinking(true)
    try {
      const response = await linkPlaidAccount(selectedPlaidItem, selectedPlaidAccount, selectedAccount)
      if (response.success) {
        toast({
          title: "Success",
          description: "Account linked successfully",
        })
        setIsDialogOpen(false)
        fetchData()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to link account",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error linking account:", error)
      toast({
        title: "Error",
        description: "Failed to link account",
        variant: "destructive",
      })
    } finally {
      setIsLinking(false)
    }
  }

  const handleUnlinkAccount = async (plaidItemId, plaidAccountId) => {
    if (window.confirm("Are you sure you want to unlink this account?")) {
      try {
        const response = await unlinkPlaidAccount(plaidItemId, plaidAccountId)
        if (response.success) {
          toast({
            title: "Success",
            description: "Account unlinked successfully",
          })
          fetchData()
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to unlink account",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error unlinking account:", error)
        toast({
          title: "Error",
          description: "Failed to unlink account",
          variant: "destructive",
        })
      }
    }
  }

  const getAccountTypeLabel = (type, subtype) => {
    if (subtype) {
      return `${type} (${subtype})`
    }
    return type
  }

  const getLinkedAccountName = (plaidAccount) => {
    if (!plaidAccount.linkedAccountId) return "Not linked"

    const linkedAccount = accounts.find((acc) => acc._id === plaidAccount.linkedAccountId)
    return linkedAccount ? linkedAccount.name : "Unknown account"
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connected Banks</h1>
          <p className="text-muted-foreground">Connect your bank accounts to automatically import transactions</p>
        </div>
        <PlaidLink onSuccess={fetchData} buttonText="Connect a bank" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Connect a bank
        </PlaidLink>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : plaidItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-center text-muted-foreground mb-4">
              You haven't connected any banks yet. Connect a bank to automatically import transactions.
            </p>
            <PlaidLink buttonText="Connect your first bank" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plaidItems.map((item) => (
            <Card key={item._id}>
              <CardHeader>
                <CardTitle>{item.institutionName}</CardTitle>
                <CardDescription>Last updated: {new Date(item.lastUpdated).toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="font-medium">Accounts</h3>
                  <ul className="space-y-1">
                    {item.accounts.map((account) => (
                      <li key={account.accountId} className="flex justify-between items-center text-sm">
                        <div>
                          <span>{account.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {getAccountTypeLabel(account.type, account.subtype)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {account.linkedAccountId ? (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Link2 className="h-3 w-3" />
                              {getLinkedAccountName(account)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
                              <Unlink className="h-3 w-3" />
                              Not linked
                            </Badge>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Link2 className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Link Bank Account</DialogTitle>
                                <DialogDescription>
                                  Link this bank account to one of your Finflow accounts to automatically import
                                  transactions.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div>
                                  <h3 className="mb-2 text-sm font-medium">Bank Account</h3>
                                  <div className="rounded-md border p-3">
                                    <p className="font-medium">{account.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {getAccountTypeLabel(account.type, account.subtype)}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <h3 className="mb-2 text-sm font-medium">Finflow Account</h3>
                                  <Select onValueChange={setSelectedAccount}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select an account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {accounts.map((acc) => (
                                        <SelectItem key={acc._id} value={acc._id}>
                                          {acc.name} ({acc.type})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() => handleLinkAccount(item._id, account.accountId, selectedAccount)}
                                  disabled={!selectedAccount || isLinking}
                                >
                                  {isLinking ? "Linking..." : "Link Account"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          {account.linkedAccountId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleUnlinkAccount(item._id, account.accountId)}
                            >
                              <Unlink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleSyncTransactions(item._id)}
                  disabled={isSyncing}
                >
                  <RefreshCw className="h-3 w-3" />
                  {isSyncing ? "Syncing..." : "Sync Transactions"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 text-destructive"
                  onClick={() => handleDeleteItem(item._id)}
                >
                  <Trash2 className="h-3 w-3" />
                  Disconnect
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Bank Account</DialogTitle>
            <DialogDescription>
              Link a bank account to one of your Finflow accounts to automatically import transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <h3 className="mb-2 text-sm font-medium">Bank</h3>
              <Select onValueChange={setSelectedPlaidItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a bank" />
                </SelectTrigger>
                <SelectContent>
                  {plaidItems.map((item) => (
                    <SelectItem key={item._id} value={item._id}>
                      {item.institutionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPlaidItem && (
              <div>
                <h3 className="mb-2 text-sm font-medium">Bank Account</h3>
                <Select onValueChange={setSelectedPlaidAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {plaidItems
                      .find((item) => item._id === selectedPlaidItem)
                      ?.accounts.map((account) => (
                        <SelectItem key={account.accountId} value={account.accountId}>
                          {account.name} ({getAccountTypeLabel(account.type, account.subtype)})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <h3 className="mb-2 text-sm font-medium">Finflow Account</h3>
              <Select onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account._id} value={account._id}>
                      {account.name} ({account.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleLinkAccount}
              disabled={!selectedPlaidItem || !selectedPlaidAccount || !selectedAccount || isLinking}
            >
              {isLinking ? "Linking..." : "Link Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
