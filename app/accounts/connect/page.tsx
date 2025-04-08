"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  RefreshCw,
  Trash2,
  Building,
  CreditCard,
  Wallet,
  PiggyBank,
  LinkIcon,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Plus,
} from "lucide-react"
import { getPlaidItems, deletePlaidItem, syncPlaidTransactions, getAccounts } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import PlaidLink from "@/components/plaid-link"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { linkPlaidAccount, unlinkPlaidAccount } from "@/lib/api"

export default function ConnectAccountsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [plaidItems, setPlaidItems] = useState([])
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setSyncing] = useState({})
  const [error, setError] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [itemsData, accountsData] = await Promise.all([getPlaidItems(), getAccounts()])
      setPlaidItems(itemsData.items)
      setAccounts(accountsData.accounts)
    } catch (err) {
      setError("Failed to load connected accounts")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteItem = async (itemId) => {
    try {
      await deletePlaidItem(itemId)
      setPlaidItems(plaidItems.filter((item) => item._id !== itemId))
      toast({
        title: "Connection removed",
        description: "The bank connection has been removed successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to remove bank connection.",
        variant: "destructive",
      })
    }
  }

  const handleSyncTransactions = async (itemId) => {
    try {
      setSyncing((prev) => ({ ...prev, [itemId]: true }))
      await syncPlaidTransactions(itemId)

      // Refresh the item data
      const itemsData = await getPlaidItems()
      setPlaidItems(itemsData.items)

      toast({
        title: "Sync complete",
        description: "Transactions have been synchronized successfully.",
      })
    } catch (err) {
      toast({
        title: "Sync failed",
        description: "Failed to synchronize transactions.",
        variant: "destructive",
      })
    } finally {
      setSyncing((prev) => ({ ...prev, [itemId]: false }))
    }
  }

  const handleLinkAccount = async (plaidItemId, plaidAccountId, accountId) => {
    try {
      await linkPlaidAccount({
        plaidItemId,
        plaidAccountId,
        accountId,
      })

      // Refresh the item data
      const itemsData = await getPlaidItems()
      setPlaidItems(itemsData.items)

      toast({
        title: "Account linked",
        description: "The bank account has been linked successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to link bank account.",
        variant: "destructive",
      })
    }
  }

  const handleUnlinkAccount = async (plaidItemId, plaidAccountId) => {
    try {
      await unlinkPlaidAccount({
        plaidItemId,
        plaidAccountId,
      })

      // Refresh the item data
      const itemsData = await getPlaidItems()
      setPlaidItems(itemsData.items)

      toast({
        title: "Account unlinked",
        description: "The bank account has been unlinked successfully.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to unlink bank account.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "good":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" /> Connected
          </Badge>
        )
      case "error":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="mr-1 h-3 w-3" /> Error
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="mr-1 h-3 w-3" /> Pending
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Unknown
          </Badge>
        )
    }
  }

  const getAccountIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "depository":
      case "checking":
        return <Wallet className="h-4 w-4" />
      case "savings":
        return <PiggyBank className="h-4 w-4" />
      case "credit":
        return <CreditCard className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Loading your connected accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connected Accounts</h1>
          <p className="text-muted-foreground">Manage your bank connections and account links</p>
        </div>
        <div className="flex space-x-2">
          <Button asChild variant="outline">
            <Link href="/accounts">View All Accounts</Link>
          </Button>
          <PlaidLink onSuccess={fetchData} />
        </div>
      </div>

      {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}

      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger
            value="connections"
            className="rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Bank Connections
          </TabsTrigger>
          <TabsTrigger
            value="link"
            className="rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Link Accounts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6 animate-fade-in">
          {plaidItems.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {plaidItems.map((item, index) => (
                <Card key={item._id} className="hover-card animate-fade-in">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="rounded-full bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                          <Building className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-medium">{item.institutionName}</CardTitle>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                    <CardDescription className="mt-1">
                      Last updated: {formatDistanceToNow(new Date(item.lastUpdated), { addSuffix: true })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Connected Accounts</h4>
                      <div className="space-y-2">
                        {item.accounts.map((account) => (
                          <div
                            key={account.accountId}
                            className="flex items-center justify-between rounded-md border p-2"
                          >
                            <div className="flex items-center space-x-2">
                              <div className="rounded-full bg-violet-100 p-1.5 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                                {getAccountIcon(account.type)}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{account.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {account.officialName || account.type} {account.mask ? `••••${account.mask}` : ""}
                                </p>
                              </div>
                            </div>
                            <div>
                              {account.linkedAccountId ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleUnlinkAccount(item._id, account.accountId)}
                                >
                                  Unlink
                                </Button>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  Not Linked
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncTransactions(item._id)}
                      disabled={isSyncing[item._id]}
                    >
                      {isSyncing[item._id] ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync Transactions
                        </>
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Bank Connection</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove this bank connection? This will not delete any transactions
                            that have already been imported.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteItem(item._id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))}
              <Card className="flex flex-col items-center justify-center p-6 hover-card animate-fade-in">
                <div className="mb-4 rounded-full bg-violet-100 p-4 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                  <Building className="h-8 w-8" />
                </div>
                <h3 className="mb-1 text-lg font-medium">Connect a Bank</h3>
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  Connect your bank accounts to automatically import transactions
                </p>
                <PlaidLink />
              </Card>
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 hover-card animate-fade-in">
              <div className="mb-4 rounded-full bg-violet-100 p-4 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                <Building className="h-8 w-8" />
              </div>
              <h3 className="mb-1 text-xl font-medium">No Connected Banks</h3>
              <p className="mb-6 text-center text-muted-foreground max-w-md">
                Connect your bank accounts to automatically import transactions and keep your finances up to date.
              </p>
              <PlaidLink />
            </Card>
          )}
        </TabsContent>

        <TabsContent value="link" className="space-y-6 animate-fade-in">
          {plaidItems.length > 0 ? (
            <div className="space-y-6">
              {plaidItems.map((item) => (
                <Card key={item._id} className="hover-card animate-fade-in">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <div className="rounded-full bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                        <Building className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg font-medium">{item.institutionName}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Link Bank Accounts to App Accounts</h4>
                      <div className="space-y-3">
                        {item.accounts.map((account) => (
                          <div key={account.accountId} className="rounded-md border p-3">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="rounded-full bg-violet-100 p-1.5 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                                  {getAccountIcon(account.type)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{account.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {account.officialName || account.type} {account.mask ? `••••${account.mask}` : ""}
                                  </p>
                                </div>
                              </div>
                              {account.linkedAccountId ? (
                                <Badge className="bg-green-50 text-green-700 border-green-200">
                                  <CheckCircle className="mr-1 h-3 w-3" /> Linked
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  <LinkIcon className="mr-1 h-3 w-3" /> Not Linked
                                </Badge>
                              )}
                            </div>

                            {account.linkedAccountId ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">
                                    Linked to: {account.linkedAccountId?.name || "Unknown Account"}
                                  </span>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleUnlinkAccount(item._id, account.accountId)}
                                >
                                  Unlink
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Select
                                  onValueChange={(value) => handleLinkAccount(item._id, account.accountId, value)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select an account to link" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {accounts.map((appAccount) => (
                                      <SelectItem key={appAccount._id} value={appAccount._id}>
                                        {appAccount.name} ({appAccount.type})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/accounts/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Account
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 hover-card animate-fade-in">
              <div className="mb-4 rounded-full bg-violet-100 p-4 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                <Building className="h-8 w-8" />
              </div>
              <h3 className="mb-1 text-xl font-medium">No Connected Banks</h3>
              <p className="mb-6 text-center text-muted-foreground max-w-md">
                Connect your bank accounts first, then you can link them to your app accounts.
              </p>
              <PlaidLink />
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
