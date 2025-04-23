import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_TOKEN } from '../../../../config/admin';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import NotebookReview from '../../../../models/NotebookReview';
import { corsOptions, corsResponse } from '../../../../utils/cors';

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request.headers.get('origin') || undefined);
}

export async function GET(req: NextRequest) {
  // Verify admin token
  const adminToken = req.headers.get('x-admin-token');
  if (!adminToken || adminToken !== ADMIN_TOKEN) {
    return corsResponse(
      { error: 'Unauthorized' },
      { status: 401 },
      req.headers.get('origin') || undefined
    );
  }

  try {
    await dbConnect();

    // Fetch all users (excluding sensitive data)
    const users = await User.find({}, { _id: 1, name: 1, email: 1 }).lean();

    // Fetch all reviews
    const reviews = await NotebookReview.find({}).lean();

    const exportData = {
      users,
      reviews,
    };

    return corsResponse(exportData, undefined, req.headers.get('origin') || undefined);
  } catch (error) {
    console.error('Database export error:', error);
    return corsResponse(
      { error: 'Internal Server Error' },
      { status: 500 },
      req.headers.get('origin') || undefined
    );
  }
}
