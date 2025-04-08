import mongoose from "mongoose"

const PlaidItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    institutionId: {
      type: String,
      required: true,
    },
    institutionName: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    itemId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["good", "error", "pending"],
      default: "good",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    error: {
      type: Object,
      default: null,
    },
    consentExpirationTime: {
      type: Date,
      default: null,
    },
    availableProducts: {
      type: [String],
      default: [],
    },
    billedProducts: {
      type: [String],
      default: [],
    },
    accounts: {
      type: [
        new mongoose.Schema({
          accountId: String,
          mask: String,
          name: String,
          officialName: String,
          type: String,
          subtype: String,
          linkedAccountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            default: null,
          },
        }, { _id: false }) 
      ],
      default: [],
    },
  },
  { timestamps: true },
)

const PlaidItem = mongoose.models.PlaidItem || mongoose.model("PlaidItem", PlaidItemSchema)
export default PlaidItem
