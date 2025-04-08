"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  CreditCard,
  ArrowRightLeft,
  PieChart,
  BarChart3,
  Target,
  Settings,
  TrendingUp,
  Building,
} from "lucide-react"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  const routes = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      name: "Accounts",
      href: "/accounts",
      icon: CreditCard,
      active: pathname === "/accounts" || pathname.startsWith("/accounts/"),
    },
    {
      name: "Connected Banks",
      href: "/accounts/connect",
      icon: Building,
      active: pathname === "/accounts/connect",
    },
    {
      name: "Transactions",
      href: "/transactions",
      icon: ArrowRightLeft,
      active: pathname === "/transactions" || pathname.startsWith("/transactions/"),
    },
    {
      name: "Categories",
      href: "/categories",
      icon: PieChart,
      active: pathname === "/categories" || pathname.startsWith("/categories/"),
    },
    {
      name: "Budgets",
      href: "/budgets",
      icon: BarChart3,
      active: pathname === "/budgets" || pathname.startsWith("/budgets/"),
    },
    {
      name: "Goals",
      href: "/goals",
      icon: Target,
      active: pathname === "/goals" || pathname.startsWith("/goals/"),
    },
    {
      name: "Projections",
      href: "/projections",
      icon: TrendingUp,
      active: pathname === "/projections",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      active: pathname === "/settings",
    },
  ]

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-primary",
            route.active ? "text-primary" : "text-muted-foreground",
          )}
        >
          <route.icon className="mr-2 h-4 w-4" />
          {route.name}
        </Link>
      ))}
    </nav>
  )
}
