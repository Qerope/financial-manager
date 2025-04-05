import mongoose from "mongoose"

const BudgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    period: {
      type: String,
      required: true,
      enum: ["daily", "weekly", "monthly", "yearly", "custom"],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rollover: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: "#000000",
    },
    icon: {
      type: String,
      default: "",
    },
    notifications: {
      enabled: {
        type: Boolean,
        default: true,
      },
      threshold: {
        type: Number,
        default: 80, // percentage
      },
    },
  },
  { timestamps: true },
)

const Budget = mongoose.model("Budget", BudgetSchema)
export default Budget

