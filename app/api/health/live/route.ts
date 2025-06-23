import { NextRequest, NextResponse } from "next/server";

/**
 * Liveness probe endpoint for container orchestration systems
 * This endpoint performs minimal checks to determine if the application is alive
 * and should be used by load balancers and orchestration systems
 */
export async function GET(request: NextRequest) {
  try {
    // Basic application state check
    const isAlive = process.uptime() > 0;
    
    if (!isAlive) {
      return NextResponse.json(
        { 
          status: "unhealthy", 
          reason: "Application not responsive",
          timestamp: new Date().toISOString()
        }, 
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        status: "alive",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }, 
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        status: "unhealthy", 
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }, 
      { status: 503 }
    );
  }
}

export async function HEAD(request: NextRequest) {
  try {
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
} 