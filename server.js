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
import projectionRoutes from "./routes/projections.js"
import plaidRoutes from "./routes/plaid.js"

// Middleware
dotenv.config()
const app = express()
app.use(express.json())
app.use(morgan("common"))

// Routes
app.use("/finc/api/auth", authRoutes)
app.use("/finc/api/users", userRoutes)
app.use("/finc/api/accounts", accountRoutes)
app.use("/finc/api/transactions", transactionRoutes)
app.use("/finc/api/categories", categoryRoutes)
app.use("/finc/api/budgets", budgetRoutes)
app.use("/finc/api/goals", goalRoutes)
app.use("/finc/api/reports", reportRoutes)
app.use("/finc/api/recurring", recurringRoutes)
app.use("/finc/api/dashboard", dashboardRoutes)
app.use("/finc/api/projections", projectionRoutes)
app.use("/finc/api/plaid", plaidRoutes)

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
