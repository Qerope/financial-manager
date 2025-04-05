"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { createCategory } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function NewCategoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: searchParams.get("type") || "expense",
    color: "#8b5cf6",
    icon: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
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
      await createCategory(formData)

      toast({
        title: "Category created",
        description: "Your category has been created successfully.",
      })

      router.push("/categories")
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
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
        <h1 className="text-3xl font-bold tracking-tight">Add New Category</h1>
        <p className="text-muted-foreground">Create a new category to organize your finances</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="hover-card">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div
                className={`rounded-full p-2 ${
                  formData.type === "income"
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300"
                }`}
              >
                {formData.type === "income" ? (
                  <ArrowUpRight className="h-5 w-5" />
                ) : (
                  <ArrowDownRight className="h-5 w-5" />
                )}
              </div>
              <div>
                <CardTitle>Category Details</CardTitle>
                <CardDescription>Enter the details of your new category</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Groceries, Salary"
                className="transition-all focus-visible:ring-violet-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Category Type</Label>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Category Color</Label>
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
              <Label htmlFor="icon">Icon (Optional)</Label>
              <Input
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                placeholder="Icon name or code"
                className="transition-all focus-visible:ring-violet-500"
              />
              <p className="text-xs text-muted-foreground">Leave blank to use default icon</p>
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
                "Create Category"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

