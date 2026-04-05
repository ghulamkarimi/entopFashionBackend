import { Schema, model, Document } from "mongoose";

interface INewsletterCampaignProduct {
  title: string;
  description: string;
  image: string;
}

export interface INewsletterCampaign extends Document {
  subject: string;
  products: INewsletterCampaignProduct[];
  html: string;
  status: "draft" | "sent";
  sentAt: Date | null ;
  createdAt: Date;
  updatedAt: Date;
}

const newsletterCampaignSchema = new Schema<INewsletterCampaign>(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    products: [
      {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        image: { type: String, default: "" },
      },
    ],
    html: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["draft", "sent"],
      default: "draft",
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default model<INewsletterCampaign>(
  "NewsletterCampaign",
  newsletterCampaignSchema
);