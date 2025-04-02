"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Target, Calendar, Bell } from "lucide-react"
import { createBudget, getCategories } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function NewBudgetPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    period: "monthly",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    categoryId: "",
    isActive: true,
    rollover: false,
    notes: "",
    color: "#8b5cf6",
    notifications: {
      enabled: true,
      threshold: 80,
    },
  })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true)
        const data = await getCategories({ type: "expense" })
        setCategories(data.categories)
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load categories.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [toast])

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

  const handleNotificationChange = (name, value) => {
    setFormData({
      ...formData,
      notifications: {
        ...formData.notifications,
        [name]: value,
      },
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await createBudget({
        ...formData,
        amount: Number(formData.amount),
        notifications: {
          ...formData.notifications,
          threshold: Number(formData.notifications.threshold),
        },
      })

      toast({
        title: "Budget created",
        description: "Your budget has been created successfully.",
      })

      router.push("/budgets")
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create budget. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Predefined colors
  const colors = [
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#ef4444", // Red
    "#f97316", // Orange
    "#f59e0b", // Amber
    "#10b981", // Emerald
    "#06b6d4", // Cyan
    "#3b82f6", // Blue
    "#6366f1", // Indigo
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Budget</h1>
        <p className="text-muted-foreground">Set up a budget to track and control your spending</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="hover-card">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Budget Details</CardTitle>
                <CardDescription>Enter the details of your new budget</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Budget Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Monthly Groceries"
                className="transition-all focus-visible:ring-violet-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Budget Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  {user?.currency === "USD" ? "$" : user?.currency}
                </span>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  className="pl-8 transition-all focus-visible:ring-violet-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Budget Period</Label>
              <Select value={formData.period} onValueChange={(value) => handleSelectChange("period", value)} required>
                <SelectTrigger className="transition-all focus-visible:ring-violet-500">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-violet-500" />
                      <span>Daily</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="weekly">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-violet-500" />
                      <span>Weekly</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="monthly">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-violet-500" />
                      <span>Monthly</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="yearly">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-violet-500" />
                      <span>Yearly</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-violet-500" />
                      <span>Custom</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="transition-all focus-visible:ring-violet-500"
                  required
                />
              </div>
              {formData.period === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="transition-all focus-visible:ring-violet-500"
                    required={formData.period === "custom"}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category (Optional)</Label>
              <Select value={formData.categoryId} onValueChange={(value) => handleSelectChange("categoryId", value)}>
                <SelectTrigger className="transition-all focus-visible:ring-violet-500">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
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
              <p className="text-xs text-muted-foreground">Leave blank to track all spending</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Budget Color</Label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-9">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-10 rounded-md transition-all hover:ring-2 hover:ring-offset-2 ${
                      formData.color === color ? "ring-2 ring-offset-2" : ""
                    }`}
                    style={{
                      backgroundColor: color,
                      ringColor: color,
                    }}
                    onClick={() => handleSelectChange("color", color)}
                  >
                    <span className="sr-only">Select color {color}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="min-h-24 transition-all focus-visible:ring-violet-500"
                placeholder="Add any additional details about this budget"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="rollover" className="text-base">
                  Rollover Unused Budget
                </Label>
                <p className="text-sm text-muted-foreground">Carry over unused budget to the next period</p>
              </div>
              <Switch
                id="rollover"
                name="rollover"
                checked={formData.rollover}
                onCheckedChange={(checked) => handleSelectChange("rollover", checked)}
                className="data-[state=checked]:bg-violet-600"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="notificationsEnabled" className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-violet-500" />
                  Budget Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications when you approach your budget limit
                </p>
              </div>
              <Switch
                id="notificationsEnabled"
                checked={formData.notifications.enabled}
                onCheckedChange={(checked) => handleNotificationChange("enabled", checked)}
                className="data-[state=checked]:bg-violet-600"
              />
            </div>

            {formData.notifications.enabled && (
              <div className="space-y-2">
                <Label htmlFor="threshold">Notification Threshold (%)</Label>
                <Input
                  id="threshold"
                  name="threshold"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.notifications.threshold}
                  onChange={(e) => handleNotificationChange("threshold", e.target.value)}
                  className="transition-all focus-visible:ring-violet-500"
                />
                <p className="text-xs text-muted-foreground">
                  You'll be notified when you reach this percentage of your budget
                </p>
              </div>
            )}
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
                "Create Budget"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

