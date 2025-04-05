import mongoose from "mongoose"

const AccountSchema = new mongoose.Schema(
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
    type: {
      type: String,
      required: true,
      enum: ["checking", "savings", "credit", "investment", "loan", "cash", "other"],
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    icon: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "#000000",
    },
    institution: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    includeInNetWorth: {
      type: Boolean,
      default: true,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    creditLimit: {
      type: Number,
      default: 0,
    },
    dueDate: {
      type: Date,
    },
  },
  { timestamps: true },
)

const Account = mongoose.model("Account", AccountSchema)
export default Account

