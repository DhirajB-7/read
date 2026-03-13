import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
export type WithdrawalMethod = 'upi' | 'bank_transfer';

export interface IWithdrawal extends Document {
  userId: Types.ObjectId;
  amount: number;
  method: WithdrawalMethod;
  upiId?: string;
  upiName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  bankName?: string;
  status: WithdrawalStatus;
  failureReason?: string;
  processedAt?: Date;
  razorpayPayoutId?: string;
  razorpayFundAccountId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalSchema = new Schema<IWithdrawal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    method: { type: String, enum: ['upi', 'bank_transfer'], required: true },
    upiId:             { type: String, trim: true },
    upiName:           { type: String, trim: true },
    accountNumber:     { type: String, trim: true },
    ifscCode:          { type: String, trim: true, uppercase: true },
    accountHolderName: { type: String, trim: true },
    bankName:          { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'rejected'],
      default: 'pending',
    },
    failureReason:          { type: String },
    processedAt:            { type: Date },
    razorpayPayoutId:       { type: String },
    razorpayFundAccountId:  { type: String },
  },
  { timestamps: true }
);

const Withdrawal: Model<IWithdrawal> =
  (mongoose.models.Withdrawal as Model<IWithdrawal>) ||
  mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema);

export default Withdrawal;
