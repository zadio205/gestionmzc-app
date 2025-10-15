import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboardService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Missing userId or userRole' },
        { status: 400 }
      );
    }

    const dashboardService = new DashboardService();
    const clients = await dashboardService.getClientOverviews(userId, userRole as any);

    return NextResponse.json(clients, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=180'
      }
    });
  } catch (error) {
    console.error('Error fetching client overviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client overviews' },
      { status: 500 }
    );
  }
}
