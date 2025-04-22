import { NextRequest } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { ADMIN_TOKEN } from '../../../config/admin';
import { corsOptions, corsResponse } from '../../../utils/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const adminToken = request.headers.get('X-Admin-Token');

    if (!adminToken || adminToken !== ADMIN_TOKEN) {
      return corsResponse({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await User.find({}, { _id: 0, __v: 0 });
    return corsResponse(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return corsResponse({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const adminToken = request.headers.get('X-Admin-Token');

    if (!adminToken || adminToken !== ADMIN_TOKEN) {
      return corsResponse({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const user = new User(data);
    await user.save();

    return corsResponse(user);
  } catch (error) {
    console.error('Error creating user:', error);
    if ((error as any).code === 11000) {
      return corsResponse({ error: 'User already exists' }, { status: 400 });
    }
    return corsResponse({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const adminToken = request.headers.get('X-Admin-Token');

    if (!adminToken || adminToken !== ADMIN_TOKEN) {
      return corsResponse({ error: 'Unauthorized' }, { status: 403 });
    }

    const targetEmail = request.nextUrl.searchParams.get('email');
    if (!targetEmail) {
      return corsResponse({ error: 'Email parameter required' }, { status: 400 });
    }


    const result = await User.deleteOne({ email: targetEmail });
    if (result.deletedCount === 0) {
      return corsResponse({ error: 'User not found' }, { status: 404 });
    }

    return corsResponse({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return corsResponse({ error: 'Internal Server Error' }, { status: 500 });
  }
}
