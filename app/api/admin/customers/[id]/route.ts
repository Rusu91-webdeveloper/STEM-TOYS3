import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrderStatus, PaymentStatus } from "@prisma/client";

type OrderWithItems = {
  id: string;
  total: number;
  createdAt: Date;
  status: OrderStatus;
};

// GET - Get customer details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get the customer ID from route params
    const customerId = params.id;

    // Fetch customer with their orders and other related data
    const customer = await db.user.findUnique({
      where: {
        id: customerId,
        role: "CUSTOMER",
      },
      include: {
        orders: {
          include: {
            // Change orderItems to items as suggested by Prisma error
            items: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        addresses: true,
        paymentCards: {
          select: {
            id: true,
            cardholderName: true,
            lastFourDigits: true,
            cardType: true,
            expiryMonth: true,
            expiryYear: true,
            isDefault: true,
          },
        },
        _count: {
          select: {
            orders: true,
            wishlistItems: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Calculate metrics
    const totalSpent = customer.orders.reduce(
      (sum: number, order: OrderWithItems) => sum + order.total,
      0
    );

    const lastOrder = customer.orders[0];

    // Format customer data for frontend
    const formattedCustomer = {
      id: customer.id,
      name: customer.name || "Anonymous",
      email: customer.email,
      status: customer.isActive ? "Active" : "Inactive",
      joined: customer.createdAt,
      totalOrders: customer._count.orders,
      totalSpent,
      lastOrder: lastOrder
        ? {
            id: lastOrder.id,
            date: lastOrder.createdAt,
            total: lastOrder.total,
            status: lastOrder.status,
          }
        : null,
      wishlistCount: customer._count.wishlistItems,
      addresses: customer.addresses,
      paymentCards: customer.paymentCards,
    };

    return NextResponse.json(formattedCustomer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer details" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get the customer ID from route params
    const customerId = params.id;

    // Get the user to check if they exist and if they have orders
    const userToDelete = await db.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        role: true,
        _count: { select: { orders: true } },
      },
    });

    // Check if user exists
    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deleting admin users
    if (userToDelete.role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot delete admin users" },
        { status: 403 }
      );
    }

    // Prevent deleting users with orders
    if (userToDelete._count.orders > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete user with existing orders. Deactivate the account instead.",
        },
        { status: 400 }
      );
    }

    // Delete the user
    await db.user.delete({
      where: { id: customerId },
    });

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
