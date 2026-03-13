import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type TransactionType =
  | 'deposit'
  | 'rental'
  | 'delivery'
  | 'refund'
  | 'withdrawal'
  | 'withdrawal_request'
  | 'subscription';

export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  description: string;
  status: TransactionStatus;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  withdrawalId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['deposit', 'rental', 'delivery', 'refund', 'withdrawal', 'withdrawal_request', 'subscription'],
      required: true,
    },
    amount:      { type: Number, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed'],
      default: 'completed',
    },
    razorpayPaymentId: { type: String },
    razorpayOrderId:   { type: String },
    withdrawalId: { type: Schema.Types.ObjectId, ref: 'Withdrawal' },
  },
  { timestamps: true }
);

const Transaction: Model<ITransaction> =
  (mongoose.models.Transaction as Model<ITransaction>) ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
