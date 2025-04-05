import mongoose from "mongoose"

const RecurringTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["income", "expense", "transfer"],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    frequency: {
      type: String,
      required: true,
      enum: ["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    lastProcessed: {
      type: Date,
    },
    nextDue: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    payee: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    transferAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    autoGenerate: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

const RecurringTransaction = mongoose.model("RecurringTransaction", RecurringTransactionSchema)
export default RecurringTransaction

