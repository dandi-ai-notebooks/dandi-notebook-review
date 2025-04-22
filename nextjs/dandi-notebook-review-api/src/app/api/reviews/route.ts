import { NextRequest } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import NotebookReview from '../../../models/NotebookReview';
import User from '../../../models/User';
import { corsOptions, corsResponse } from '../../../utils/cors';

async function validateUserToken(userEmail: string, apiToken: string) {
  if (!userEmail || !apiToken) {
    return { error: 'User email and API token are required', status: 401 };
  }

  const user = await User.findOne({ email: userEmail });
  if (!user || user.apiToken !== apiToken) {
    return { error: 'Invalid credentials', status: 401 };
  }

  return { user };
}

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const userEmail = request.headers.get('X-User-Email');

    const reviews = await NotebookReview.find({ reviewer_email: userEmail });
    return corsResponse(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return corsResponse({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const userEmail = request.headers.get('X-User-Email');
    const apiToken = request.headers.get('X-Api-Token');

    const validation = await validateUserToken(userEmail!, apiToken!);
    if ('error' in validation) {
      return corsResponse({ error: validation.error }, { status: validation.status });
    }

    const data = await request.json();
    const review = new NotebookReview({
      notebook_uri: data.notebook_uri,
      reviewer_email: userEmail,
      review: data.review,
      timestamp_created: new Date(),
      timestamp_edited: new Date()
    });

    await review.save();
    return corsResponse(review);
  } catch (error) {
    console.error('Error creating review:', error);
    return corsResponse({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const userEmail = request.headers.get('X-User-Email');
    const apiToken = request.headers.get('X-Api-Token');

    const validation = await validateUserToken(userEmail!, apiToken!);
    if ('error' in validation) {
      return corsResponse({ error: validation.error }, { status: validation.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    const review = await NotebookReview.findOneAndDelete({
      notebook_uri: id,
      reviewer_email: userEmail
    });

    if (!review) {
      return corsResponse({ error: 'Review not found' }, { status: 404 });
    }

    return corsResponse({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return corsResponse({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const userEmail = request.headers.get('X-User-Email');
    const apiToken = request.headers.get('X-Api-Token');

    const validation = await validateUserToken(userEmail!, apiToken!);
    if ('error' in validation) {
      return corsResponse({ error: validation.error }, { status: validation.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const data = await request.json();

    const review = await NotebookReview.findOneAndUpdate(
      { notebook_uri: id, reviewer_email: userEmail },
      {
        $set: {
          review: data.review,
          timestamp_edited: new Date()
        }
      },
      { new: true }
    );

    if (!review) {
      return corsResponse({ error: 'Review not found' }, { status: 404 });
    }

    return corsResponse(review);
  } catch (error) {
    console.error('Error updating review:', error);
    return corsResponse({ error: 'Internal Server Error' }, { status: 500 });
  }
}
