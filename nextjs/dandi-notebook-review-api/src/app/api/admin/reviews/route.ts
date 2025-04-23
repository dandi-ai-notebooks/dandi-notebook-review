import { NextRequest } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import NotebookReview from '../../../../models/NotebookReview';
import { isValidAdminToken } from '../../../../config/admin';
import { corsOptions, corsResponse } from '../../../../utils/cors';

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request.headers.get('origin') || undefined);
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const adminToken = request.headers.get('X-Admin-Token');

    if (!adminToken || !isValidAdminToken(adminToken)) {
      return corsResponse(
        { error: 'Unauthorized' },
        { status: 401 },
        request.headers.get('origin') || undefined
      );
    }

    const reviews = await NotebookReview.find({}).sort({ timestamp_created: -1 });
    return corsResponse(reviews, undefined, request.headers.get('origin') || undefined);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return corsResponse(
      { error: 'Internal Server Error' },
      { status: 500 },
      request.headers.get('origin') || undefined
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const adminToken = request.headers.get('X-Admin-Token');

    if (!adminToken || !isValidAdminToken(adminToken)) {
      return corsResponse(
        { error: 'Unauthorized' },
        { status: 401 },
        request.headers.get('origin') || undefined
      );
    }

    const data = await request.json();
    const { id, reviewer_email } = data;

    if (!id || !reviewer_email) {
      return corsResponse(
        { error: 'Review ID and reviewer email are required' },
        { status: 400 },
        request.headers.get('origin') || undefined
      );
    }

    const review = await NotebookReview.findByIdAndUpdate(
      id,
      {
        reviewer_email,
        timestamp_edited: new Date()
      },
      { new: true }
    );

    if (!review) {
      return corsResponse(
        { error: 'Review not found' },
        { status: 404 },
        request.headers.get('origin') || undefined
      );
    }

    return corsResponse(review, undefined, request.headers.get('origin') || undefined);
  } catch (error) {
    console.error('Error updating review:', error);
    return corsResponse(
      { error: 'Internal Server Error' },
      { status: 500 },
      request.headers.get('origin') || undefined
    );
  }
}
