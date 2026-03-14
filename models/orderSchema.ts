import mongoose from "mongoose";



const orderSchema = new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false, // ← wichtig: optional
      },
      email: {
        type: String,
        required: function (this: any) {
          return this.userId === null; // Nur für Gäste
        },
      },
      name: { type: String }, // Gastname
      items: [
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
          name: String,
          quantity: Number,
          price: Number,
        },
      ],
      shippingAddress: {
        fullName: String,
        street: String,
        city: String,
        zip: String,
        country: String,
        phone: String,
      },
      totalAmount: { type: Number, required: true },
      paymentStatus: {
        type: String,
        enum: ["offen", "bezahlt", "fehlgeschlagen"],
        default: "offen",
      }
    },
    { timestamps: true }
  );

export const Order = mongoose.model("Order", orderSchema);
export default Order;
  