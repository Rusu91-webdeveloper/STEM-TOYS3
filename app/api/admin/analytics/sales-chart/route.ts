import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get period from query params (default to 30 days)
    const searchParams = request.nextUrl.searchParams;
    const period = parseInt(searchParams.get("period") || "30");

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Get sales data grouped by day
    const salesData = await getSalesByDay(startDate, endDate);

    return NextResponse.json({
      salesData,
    });
  } catch (error) {
    console.error("Error fetching sales chart data:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales chart data" },
      { status: 500 }
    );
  }
}

async function getSalesByDay(startDate: Date, endDate: Date) {
  // Create an array with all days in the period
  const days = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Get all orders in the period
  const orders = await db.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ["COMPLETED", "DELIVERED", "SHIPPED", "PROCESSING"],
      },
    },
    select: {
      createdAt: true,
      total: true,
    },
  });

  // Group orders by day
  const salesByDay = days.map(day => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const dayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= dayStart && orderDate <= dayEnd;
    });

    const dayTotal = dayOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      date: day.toISOString().split("T")[0],
      sales: parseFloat(dayTotal.toFixed(2)),
    };
  });

  return salesByDay;
}
