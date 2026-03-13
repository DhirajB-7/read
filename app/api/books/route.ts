import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Book from '@/models/Book';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const genre = searchParams.get('genre');
    const search = searchParams.get('search');
    const available = searchParams.get('available');

    const query: any = {};
    if (genre && genre !== 'all') query.genre = genre;
    if (available === 'true') query.available = true;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    const books = await Book.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ books });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const body = await req.json();
    const { title, author, description, coverImage, genre, rentalPrice, available, totalCopies } = body;

    if (!title || !author || !description || !coverImage) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const book = await Book.create({
      title,
      author,
      description,
      coverImage,
      genre: genre || 'General',
      rentalPrice: rentalPrice || 100,
      available: available !== false,
      totalCopies: totalCopies || 1,
      availableCopies: totalCopies || 1,
    });

    return NextResponse.json({ success: true, book }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
