import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type OrderStatus = 'pending_delivery' | 'delivered' | 'return_requested' | 'returned';

export interface IOrder extends Document {
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
  status: OrderStatus;
  rentalCharge: number;
  deliveryCharge: number;
  totalCharge: number;
  deliveredAt: Date | null;
  returnRequestedAt: Date | null;
  returnedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: 'User',  required: true },
    bookId:   { type: Schema.Types.ObjectId, ref: 'Book',  required: true },
    status: {
      type: String,
      enum: ['pending_delivery', 'delivered', 'return_requested', 'returned'],
      default: 'pending_delivery',
    },
    rentalCharge:       { type: Number, required: true },
    deliveryCharge:     { type: Number, default: 0 },
    totalCharge:        { type: Number, required: true },
    deliveredAt:        { type: Date, default: null },
    returnRequestedAt:  { type: Date, default: null },
    returnedAt:         { type: Date, default: null },
  },
  { timestamps: true }
);

const Order: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder>) || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
