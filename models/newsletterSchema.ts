import mongoose, { Schema } from "mongoose";
import { INewsletter } from "../interface";
 

 
const newsletterSchema = new Schema<INewsletter>({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: (props: any) => `${props.value} is not a valid email!`,
    },
  },
  subscribed: {
    type: Boolean,
    default: true,
  },
  timeStamp: {
    type: Date,
    default: Date.now,
  },
});

const Newsletter = mongoose.model<INewsletter>("Newsletter", newsletterSchema);
export default Newsletter;
