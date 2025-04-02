import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import helmet from "helmet"
import morgan from "morgan"

// Route imports
import authRoutes from "./routes/auth.js"
import userRoutes from "./routes/users.js"
import accountRoutes from "./routes/accounts.js"
import transactionRoutes from "./routes/transactions.js"
import categoryRoutes from "./routes/categories.js"
import budgetRoutes from "./routes/budgets.js"
import goalRoutes from "./routes/goals.js"
import reportRoutes from "./routes/reports.js"
import recurringRoutes from "./routes/recurring.js"
import dashboardRoutes from "./routes/dashboard.js"

// Middleware
dotenv.config()
const app = express()
app.use(express.json())
app.use(helmet())
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }))
app.use(morgan("common"))
app.use(cors())

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/accounts", accountRoutes)
app.use("/api/transactions", transactionRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/budgets", budgetRoutes)
app.use("/api/goals", goalRoutes)
app.use("/api/reports", reportRoutes)
app.use("/api/recurring", recurringRoutes)
// Add the dashboard route mounting after the other route mountings
app.use("/api/dashboard", dashboardRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500
  const message = err.message || "Internal Server Error"
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  })
})

// MongoDB Connection
const PORT = process.env.PORT || 5000
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port: ${PORT}`))
  })
  .catch((error) => console.log(`${error} did not connect`))

