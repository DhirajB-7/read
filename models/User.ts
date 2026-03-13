import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  walletBalance: number;
  isFirstOrder: boolean;
  hasActiveBook: boolean;
  subscriptionStatus: 'none' | 'active' | 'expired';
  subscriptionExpiry: Date | null;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name:             { type: String, required: true, trim: true },
    email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:         { type: String, required: true, minlength: 6 },
    phone:            { type: String, required: true },
    address:          { type: String, required: true },
    walletBalance:    { type: Number, default: 0 },
    isFirstOrder:     { type: Boolean, default: true },
    hasActiveBook:    { type: Boolean, default: false },
    subscriptionStatus: { type: String, enum: ['none', 'active', 'expired'], default: 'none' },
    subscriptionExpiry: { type: Date, default: null },
    isAdmin:          { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export default User;
