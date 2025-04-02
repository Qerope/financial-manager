import mongoose from "mongoose"

const TransactionSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecurringTransaction",
    },
    payee: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    location: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        type: String, // URL to attachment
      },
    ],
    isCleared: {
      type: Boolean,
      default: true,
    },
    transferAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
  },
  { timestamps: true },
)

// Index for faster queries
TransactionSchema.index({ userId: 1, date: -1 })
TransactionSchema.index({ accountId: 1, date: -1 })
TransactionSchema.index({ categoryId: 1, date: -1 })

const Transaction = mongoose.model("Transaction", TransactionSchema)
export default Transaction

