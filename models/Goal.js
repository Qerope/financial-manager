import mongoose from "mongoose"

const GoalSchema = new mongoose.Schema(
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
    targetAmount: {
      type: Number,
      required: true,
    },
    currentAmount: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    targetDate: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["savings", "debt", "purchase", "other"],
    },
    isCompleted: {
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
    linkedAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    notifications: {
      enabled: {
        type: Boolean,
        default: true,
      },
      milestones: [
        {
          percentage: Number,
          reached: Boolean,
        },
      ],
    },
  },
  { timestamps: true },
)

const Goal = mongoose.model("Goal", GoalSchema)
export default Goal

