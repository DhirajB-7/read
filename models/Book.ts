import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBook extends Document {
  title: string;
  author: string;
  description: string;
  coverImage: string;
  genre: string;
  rentalPrice: number;
  available: boolean;
  totalCopies: number;
  availableCopies: number;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>(
  {
    title:           { type: String, required: true, trim: true },
    author:          { type: String, required: true, trim: true },
    description:     { type: String, required: true },
    coverImage:      { type: String, required: true },
    genre:           { type: String, default: 'General' },
    rentalPrice:     { type: Number, required: true, default: 100 },
    available:       { type: Boolean, default: true },
    totalCopies:     { type: Number, default: 1 },
    availableCopies: { type: Number, default: 1 },
  },
  { timestamps: true }
);

const Book: Model<IBook> =
  (mongoose.models.Book as Model<IBook>) || mongoose.model<IBook>('Book', BookSchema);

export default Book;
