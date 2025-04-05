"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  Plus,
  Minus,
  Edit,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  BarChart4,
  LineChart,
  Save,
  RefreshCw,
  Info,
  FileText,
  AlertCircle,
} from "lucide-react"
import { getAverageMonthlyData, getCategoryAverages } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import {
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts"
import { toast } from "@/components/ui/use-toast"

// Types for our projection data
interface CategoryItem {
  id: string
  name: string
  amount: number
  color?: string
}

interface MonthData {
  id: string
  month: string
  date: Date
  inbound: number
  outbound: number
  net: number
  current: number
  inboundItems: CategoryItem[]
  outboundItems: CategoryItem[]
}

interface Scenario {
  id: string
  name: string
  description?: string
  createdAt: Date
  baseInbound: number
  baseOutbound: number
  startingNetWorth: number
  startDate: Date
  months: number
  projectionData: MonthData[]
}

export default function ProjectionsPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("combined")

  // Projection data
  const [startDate, setStartDate] = useState(new Date())
  const [months, setMonths] = useState(12)
  const [baseInbound, setBaseInbound] = useState(0)
  const [baseOutbound, setBaseOutbound] = useState(0)
  const [currentNetWorth, setCurrentNetWorth] = useState(0)
  const [projectionData, setProjectionData] = useState<MonthData[]>([])
  const [incomeCategories, setIncomeCategories] = useState<any[]>([])
  const [expenseCategories, setExpenseCategories] = useState<any[]>([])

  // Scenarios
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newScenario, setNewScenario] = useState({
    name: "",
    description: "",
  })

  // UI state
  const [editingCell, setEditingCell] = useState<{ rowId: string; type: "inbound" | "outbound" } | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [newCategoryItem, setNewCategoryItem] = useState<{
    name: string
    amount: number
    type: "inbound" | "outbound"
  }>({
    name: "",
    amount: 0,
    type: "inbound",
  })

  // Export
  const [isExporting, setIsExporting] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Get average monthly data and category averages
        const [monthlyData, categoryData] = await Promise.all([getAverageMonthlyData(), getCategoryAverages()])

        // Set base values
        setBaseInbound(Math.round(monthlyData.data.averageIncome))
        setBaseOutbound(Math.round(monthlyData.data.averageExpense))
        setCurrentNetWorth(monthlyData.data.currentNetWorth)

        // Set categories
        setIncomeCategories(categoryData.data.incomeCategories)
        setExpenseCategories(categoryData.data.expenseCategories)

        // Generate initial projection data
        generateProjectionData(
          Math.round(monthlyData.data.averageIncome),
          Math.round(monthlyData.data.averageExpense),
          monthlyData.data.currentNetWorth,
        )

        // Load saved scenarios from localStorage
        const savedScenarios = localStorage.getItem("financialScenarios")
        if (savedScenarios) {
          try {
            const parsedScenarios = JSON.parse(savedScenarios)
            // Convert date strings back to Date objects
            const processedScenarios = parsedScenarios.map((scenario: any) => ({
              ...scenario,
              startDate: new Date(scenario.startDate),
              createdAt: new Date(scenario.createdAt),
              projectionData: scenario.projectionData.map((month: any) => ({
                ...month,
                date: new Date(month.date),
              })),
            }))
            setScenarios(processedScenarios)
          } catch (e) {
            console.error("Failed to parse saved scenarios:", e)
          }
        }
      } catch (err) {
        console.error("Failed to load projection data:", err)
        setError("Failed to load projection data. Please try refreshing.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Generate projection data when base values change
  useEffect(() => {
    if (!isLoading) {
      generateProjectionData(baseInbound, baseOutbound, currentNetWorth)
    }
  }, [baseInbound, baseOutbound, currentNetWorth, months, startDate])

  // Generate projection data
  const generateProjectionData = (inbound: number, outbound: number, startingNetWorth: number) => {
    const data: MonthData[] = []
    let runningNetWorth = startingNetWorth

    for (let i = 0; i < months; i++) {
      const date = new Date(startDate)
      date.setMonth(date.getMonth() + i)

      const monthName = date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      const net = inbound - outbound
      runningNetWorth += net

      data.push({
        id: `month-${i}`,
        month: monthName,
        date: new Date(date),
        inbound: inbound,
        outbound: outbound,
        net: net,
        current: runningNetWorth,
        inboundItems: [],
        outboundItems: [],
      })
    }

    setProjectionData(data)
  }

  // Handle adding a month
  const handleAddMonth = () => {
    setMonths((prev) => prev + 1)
  }

  // Handle removing a month
  const handleRemoveMonth = () => {
    if (months > 1) {
      setMonths((prev) => prev - 1)
    }
  }

  // Handle changing the start date
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(new Date(e.target.value))
  }

  // Handle changing base inbound
  const handleBaseInboundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBaseInbound(Number(e.target.value))
  }

  // Handle changing base outbound
  const handleBaseOutboundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBaseOutbound(Number(e.target.value))
  }

  // Handle changing current net worth
  const handleNetWorthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentNetWorth(Number(e.target.value))
  }

  // Handle opening the category editor
  const handleOpenCategoryEditor = (rowId: string, type: "inbound" | "outbound") => {
    const month = projectionData.find((m) => m.id === rowId)
    if (month) {
      setSelectedMonth(month)
      setEditingCell({ rowId, type })
    }
  }

  // Handle adding a new category item
  const handleAddCategoryItem = () => {
    if (!selectedMonth || !editingCell) return

    const { name, amount, type } = newCategoryItem

    if (!name || amount <= 0) {
      toast({
        title: "Invalid input",
        description: "Please enter a name and a positive amount.",
        variant: "destructive",
      })
      return
    }

    const newItem: CategoryItem = {
      id: `item-${Date.now()}`,
      name,
      amount,
    }

    const updatedData = projectionData.map((month) => {
      if (month.id === selectedMonth.id) {
        if (type === "inbound") {
          return {
            ...month,
            inboundItems: [...month.inboundItems, newItem],
            inbound: month.inbound + amount,
          }
        } else {
          return {
            ...month,
            outboundItems: [...month.outboundItems, newItem],
            outbound: month.outbound + amount,
          }
        }
      }
      return month
    })

    // Recalculate net and current values
    const updatedDataWithRecalculation = recalculateProjections(updatedData)

    setProjectionData(updatedDataWithRecalculation)
    setShowCategoryDialog(false)
    setNewCategoryItem({ name: "", amount: 0, type: "inbound" })

    toast({
      title: "Item added",
      description: `Added ${name} to ${selectedMonth.month}`,
    })
  }

  // Recalculate projections after changes
  const recalculateProjections = (data: MonthData[]) => {
    let runningNetWorth = currentNetWorth

    return data.map((month) => {
      const net = month.inbound - month.outbound
      runningNetWorth += net

      return {
        ...month,
        net,
        current: runningNetWorth,
      }
    })
  }

  // Handle removing a category item
  const handleRemoveCategoryItem = (monthId: string, itemId: string, type: "inbound" | "outbound") => {
    const updatedData = projectionData.map((month) => {
      if (month.id === monthId) {
        if (type === "inbound") {
          const itemToRemove = month.inboundItems.find((item) => item.id === itemId)
          return {
            ...month,
            inboundItems: month.inboundItems.filter((item) => item.id !== itemId),
            inbound: month.inbound - (itemToRemove?.amount || 0),
          }
        } else {
          const itemToRemove = month.outboundItems.find((item) => item.id !== itemId)
          return {
            ...month,
            outboundItems: month.outboundItems.filter((item) => item.id !== itemId),
            outbound: month.outbound - (itemToRemove?.amount || 0),
          }
        }
      }
      return month
    })

    // Recalculate net and current values
    const updatedDataWithRecalculation = recalculateProjections(updatedData)

    setProjectionData(updatedDataWithRecalculation)

    toast({
      title: "Item removed",
      description: "The item has been removed from the projection",
    })
  }

  // Save current scenario
  const handleSaveScenario = () => {
    if (!newScenario.name) {
      toast({
        title: "Name required",
        description: "Please enter a name for your scenario",
        variant: "destructive",
      })
      return
    }

    const scenario: Scenario = {
      id: `scenario-${Date.now()}`,
      name: newScenario.name,
      description: newScenario.description,
      createdAt: new Date(),
      baseInbound,
      baseOutbound,
      startingNetWorth: currentNetWorth,
      startDate: new Date(startDate),
      months,
      projectionData: [...projectionData],
    }

    const updatedScenarios = [...scenarios, scenario]
    setScenarios(updatedScenarios)
    setCurrentScenario(scenario)
    setShowSaveDialog(false)
    setNewScenario({ name: "", description: "" })

    // Save to localStorage
    localStorage.setItem("financialScenarios", JSON.stringify(updatedScenarios))

    toast({
      title: "Scenario saved",
      description: `"${scenario.name}" has been saved successfully`,
    })
  }

  // Load a scenario
  const handleLoadScenario = (scenarioId: string) => {
    const scenario = scenarios.find((s) => s.id === scenarioId)
    if (!scenario) return

    setBaseInbound(scenario.baseInbound)
    setBaseOutbound(scenario.baseOutbound)
    setCurrentNetWorth(scenario.startingNetWorth)
    setStartDate(new Date(scenario.startDate))
    setMonths(scenario.months)
    setProjectionData(scenario.projectionData)
    setCurrentScenario(scenario)

    toast({
      title: "Scenario loaded",
      description: `"${scenario.name}" has been loaded successfully`,
    })
  }

  // Export to CSV
  const handleExport = () => {
    setIsExporting(true)

    try {
      // Create CSV content
      let csvContent = "Month,Income,Expenses,Net,Projected Net Worth\n"

      projectionData.forEach((row) => {
        csvContent += `"${row.month}",${row.inbound},${row.outbound},${row.net},${row.current}\n`
      })

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `financial-projection-${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export successful",
        description: "Your projection data has been exported to CSV",
      })
    } catch (err) {
      console.error("Export failed:", err)
      toast({
        title: "Export failed",
        description: "There was an error exporting your data",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Reset to defaults
  const handleReset = () => {
    setBaseInbound(Math.round(incomeCategories.reduce((sum, cat) => sum + cat.averageAmount, 0)))
    setBaseOutbound(Math.round(expenseCategories.reduce((sum, cat) => sum + cat.averageAmount, 0)))
    setMonths(12)
    setStartDate(new Date())
    setCurrentScenario(null)

    toast({
      title: "Reset complete",
      description: "Your projection has been reset to default values",
    })
  }

  // Format date for input
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  // Get chart data
  const getChartData = () => {
    return projectionData.map((month) => ({
      name: month.month,
      inbound: month.inbound,
      outbound: month.outbound,
      net: month.net,
      netWorth: month.current,
    }))
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Loading projections...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Financial Projections</h1>
          <p className="text-muted-foreground">Plan your financial future with detailed projections</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {scenarios.length > 0 && (
            <Select onValueChange={handleLoadScenario} defaultValue="">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Load scenario" />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" className="gap-2" onClick={() => setShowSaveDialog(true)}>
            <Save className="h-4 w-4" />
            Save Scenario
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {currentScenario && (
        <div className="rounded-md bg-muted p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-medium">Current scenario: {currentScenario.name}</span>
              {currentScenario.description && (
                <span className="text-sm text-muted-foreground"> - {currentScenario.description}</span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCurrentScenario(null)}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Starting Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={formatDateForInput(startDate)}
                onChange={handleStartDateChange}
                className="max-w-[180px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Base Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <Input type="number" value={baseInbound} onChange={handleBaseInboundChange} className="max-w-[180px]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Base Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-rose-500" />
              <Input type="number" value={baseOutbound} onChange={handleBaseOutboundChange} className="max-w-[180px]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Net Worth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              <Input type="number" value={currentNetWorth} onChange={handleNetWorthChange} className="max-w-[180px]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Projection Timeline</CardTitle>
              <CardDescription>Forecast your finances over time</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleRemoveMonth} disabled={months <= 1}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{months} months</span>
              <Button variant="outline" size="sm" onClick={handleAddMonth} disabled={months >= 60}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardContent className="pb-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="combined" className="flex items-center gap-2">
                <BarChart4 className="h-4 w-4" />
                Combined View
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                Table Only
              </TabsTrigger>
            </TabsList>
          </CardContent>

          <TabsContent value="combined" className="m-0">
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Charts Section */}
                <div className="space-y-6">
                  <div className="rounded-lg border">
                    <div className="p-4 border-b">
                      <h3 className="text-sm font-medium">Net Worth Projection</h3>
                    </div>
                    <div className="p-4 h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip
                            formatter={(value) => formatCurrency(Number(value), user?.currency)}
                            contentStyle={{
                              borderRadius: "0.5rem",
                              border: "none",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                              backgroundColor: "white",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="netWorth"
                            name="Net Worth"
                            stroke="#8b5cf6"
                            fill="#8b5cf680"
                            activeDot={{ r: 8 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-lg border">
                    <div className="p-4 border-b">
                      <h3 className="text-sm font-medium">Income vs Expenses</h3>
                    </div>
                    <div className="p-4 h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={getChartData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip
                            formatter={(value) => formatCurrency(Number(value), user?.currency)}
                            contentStyle={{
                              borderRadius: "0.5rem",
                              border: "none",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                              backgroundColor: "white",
                            }}
                          />
                          <Legend />
                          <Bar dataKey="inbound" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="outbound" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                          <Line type="monotone" dataKey="net" name="Net" stroke="#8b5cf6" strokeWidth={2} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Table Section */}
                <div className="rounded-lg border" ref={tableRef}>
                  <div className="p-4 border-b">
                    <h3 className="text-sm font-medium">Monthly Breakdown</h3>
                  </div>
                  <ScrollArea className="h-[630px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card">
                        <TableRow>
                          <TableHead className="w-[180px]">Month</TableHead>
                          <TableHead>Income</TableHead>
                          <TableHead>Expenses</TableHead>
                          <TableHead>Net</TableHead>
                          <TableHead>Net Worth</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectionData.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.month}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-between">
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(row.inbound, user?.currency)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedMonth(row)
                                    setNewCategoryItem({ ...newCategoryItem, type: "inbound" })
                                    setShowCategoryDialog(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                              {row.inboundItems.length > 0 && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  <span>+{row.inboundItems.length} custom items</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-between">
                                <span className="text-rose-600 dark:text-rose-400">
                                  {formatCurrency(row.outbound, user?.currency)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedMonth(row)
                                    setNewCategoryItem({ ...newCategoryItem, type: "outbound" })
                                    setShowCategoryDialog(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                              {row.outboundItems.length > 0 && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  <span>+{row.outboundItems.length} custom items</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell
                              className={
                                row.net >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }
                            >
                              {formatCurrency(row.net, user?.currency)}
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(row.current, user?.currency)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="table" className="m-0">
            <CardContent className="p-0">
              <ScrollArea className="h-[500px] rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead className="w-[180px]">Month</TableHead>
                      <TableHead>Income</TableHead>
                      <TableHead>Expenses</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Projected Net Worth</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectionData.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.month}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(row.inbound, user?.currency)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setSelectedMonth(row)
                                setNewCategoryItem({ ...newCategoryItem, type: "inbound" })
                                setShowCategoryDialog(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                          {row.inboundItems.length > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              <span>+{row.inboundItems.length} custom items</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-between">
                            <span className="text-rose-600 dark:text-rose-400">
                              {formatCurrency(row.outbound, user?.currency)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setSelectedMonth(row)
                                setNewCategoryItem({ ...newCategoryItem, type: "outbound" })
                                setShowCategoryDialog(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                          {row.outboundItems.length > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              <span>+{row.outboundItems.length} custom items</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell
                          className={
                            row.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }
                        >
                          {formatCurrency(row.net, user?.currency)}
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(row.current, user?.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-between">
          <div className="flex items-center text-sm text-muted-foreground">
            <Info className="mr-1 h-4 w-4" />
            Click on the edit button next to income or expenses to add custom items
          </div>
          <Button variant="outline" className="gap-2" onClick={handleReset}>
            <RefreshCw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projection Summary</CardTitle>
          <CardDescription>Key insights from your financial projection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Projected Net Worth</h3>
              <p className="text-2xl font-bold">
                {formatCurrency(projectionData[projectionData.length - 1]?.current || 0, user?.currency)}
              </p>
              <p className="text-sm text-muted-foreground">
                {`After ${months} months (${new Date(projectionData[projectionData.length - 1]?.date || new Date()).toLocaleDateString("en-US", { month: "long", year: "numeric" })})`}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Average Monthly Savings</h3>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  projectionData.reduce((sum, month) => sum + month.net, 0) / projectionData.length,
                  user?.currency,
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {`${Math.round((projectionData.reduce((sum, month) => sum + month.net, 0) / projectionData.length / baseInbound) * 100)}% of monthly income`}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Net Worth Growth</h3>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  projectionData[projectionData.length - 1]?.current - currentNetWorth || 0,
                  user?.currency,
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {`${Math.round((((projectionData[projectionData.length - 1]?.current || 0) - currentNetWorth) / Math.max(currentNetWorth, 1)) * 100)}% increase over ${months} months`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for adding new category items */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {newCategoryItem.type === "inbound" ? "Income" : "Expense"} Item</DialogTitle>
            <DialogDescription>
              Add a custom {newCategoryItem.type === "inbound" ? "income" : "expense"} item for {selectedMonth?.month}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                placeholder={
                  newCategoryItem.type === "inbound" ? "Bonus, Side Income, etc." : "Vacation, One-time Purchase, etc."
                }
                value={newCategoryItem.name}
                onChange={(e) => setNewCategoryItem({ ...newCategoryItem, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="item-amount">Amount</Label>
              <Input
                id="item-amount"
                type="number"
                placeholder="0"
                value={newCategoryItem.amount}
                onChange={(e) => setNewCategoryItem({ ...newCategoryItem, amount: Number(e.target.value) })}
              />
            </div>

            {newCategoryItem.type === "inbound" && incomeCategories.length > 0 && (
              <div className="grid gap-2">
                <Label>Suggested Income Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {incomeCategories.slice(0, 5).map((category) => (
                    <Badge
                      key={category._id}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() =>
                        setNewCategoryItem({
                          ...newCategoryItem,
                          name: category.name,
                          amount: Math.round(category.averageAmount),
                        })
                      }
                    >
                      {category.name} (avg: {formatCurrency(category.averageAmount, user?.currency)})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {newCategoryItem.type === "outbound" && expenseCategories.length > 0 && (
              <div className="grid gap-2">
                <Label>Suggested Expense Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {expenseCategories.slice(0, 5).map((category) => (
                    <Badge
                      key={category._id}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() =>
                        setNewCategoryItem({
                          ...newCategoryItem,
                          name: category.name,
                          amount: Math.round(category.averageAmount),
                        })
                      }
                    >
                      {category.name} (avg: {formatCurrency(category.averageAmount, user?.currency)})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategoryItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for saving scenario */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Projection Scenario</DialogTitle>
            <DialogDescription>Save your current projection settings and data for future reference</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="scenario-name">Scenario Name</Label>
              <Input
                id="scenario-name"
                placeholder="e.g., Base Case, Optimistic Scenario"
                value={newScenario.name}
                onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="scenario-description">Description (Optional)</Label>
              <Input
                id="scenario-description"
                placeholder="Brief description of this scenario"
                value={newScenario.description}
                onChange={(e) => setNewScenario({ ...newScenario, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveScenario}>Save Scenario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

