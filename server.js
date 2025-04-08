import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cors from "cors"
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
import projectionsRoutes from "./routes/projections.js"
import plaidRoutes from "./routes/plaid.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/finance-app"

// Middleware
app.use(cors())
app.use(express.json())

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
app.use("/finc/api/projections", projectionsRoutes)
app.use("/finc/api/plaid", plaidRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  const errorStatus = err.status || 500
  const errorMessage = err.message || "Something went wrong!"
  return res.status(errorStatus).json({
    success: false,
    statusCode: errorStatus,
    message: errorMessage,
    stack: process.env.NODE_ENV === "development" ? err.stack : {},
  })
})

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB")
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err)
  })

export default app
