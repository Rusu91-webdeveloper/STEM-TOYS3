import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const GET = async (request: NextRequest) => {
  try {
    // Get public data for supplier landing page
    const [totalSuppliers, approvedSuppliers, totalProducts, totalRevenue] =
      await Promise.all([
        // Count total suppliers
        db.supplier.count(),

        // Count approved suppliers
        db.supplier.count({
          where: { status: "APPROVED" },
        }),

        // Count total products from suppliers
        db.product.count({
          where: {
            supplierId: { not: null },
            isActive: true,
          },
        }),

        // Calculate total revenue from supplier orders
        db.supplierOrder.aggregate({
          where: {
            status: { in: ["DELIVERED"] },
          },
          _sum: { supplierRevenue: true },
        }),
      ]);

    // Get featured suppliers (approved suppliers with products)
    const featuredSuppliers = await db.supplier.findMany({
      where: {
        status: "APPROVED",
        products: {
          some: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        companyName: true,
        companySlug: true,
        description: true,
        logo: true,
        productCategories: true,
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
      take: 6,
      orderBy: {
        products: {
          _count: "desc",
        },
      },
    });

    // Get supplier testimonials (mock data for now)
    const testimonials = [
      {
        id: "1",
        companyName: "TechToys Romania",
        contactPerson: "Maria Popescu",
        testimonial:
          "TechTots has helped us reach customers across Romania and expand our STEM toy business significantly.",
        rating: 5,
        productsCount: 45,
      },
      {
        id: "2",
        companyName: "EduPlay Solutions",
        contactPerson: "Alexandru Ionescu",
        testimonial:
          "The supplier portal is intuitive and the support team is always helpful. Our sales have increased by 200%.",
        rating: 5,
        productsCount: 32,
      },
      {
        id: "3",
        companyName: "ScienceKit Pro",
        contactPerson: "Elena Dumitrescu",
        testimonial:
          "Being a TechTots supplier has opened up new markets for us. The platform is professional and reliable.",
        rating: 5,
        productsCount: 28,
      },
    ];

    // Get benefits data
    const benefits = [
      {
        id: "1",
        title: "Reach More Customers",
        description:
          "Access our growing customer base across Romania and expand your market reach.",
        icon: "users",
        stats: `${totalSuppliers}+ suppliers`,
      },
      {
        id: "2",
        title: "Easy Product Management",
        description:
          "Upload and manage your products with our intuitive dashboard and bulk import tools.",
        icon: "package",
        stats: `${totalProducts}+ products`,
      },
      {
        id: "3",
        title: "Fast Payments",
        description:
          "Get paid quickly with our automated payment system and transparent commission structure.",
        icon: "credit-card",
        stats: `${totalRevenue ? Math.round(totalRevenue._sum.supplierRevenue || 0) : 0} RON revenue`,
      },
      {
        id: "4",
        title: "Professional Support",
        description:
          "Dedicated support team to help you succeed and grow your business with us.",
        icon: "headphones",
        stats: "24/7 support",
      },
    ];

    // Get registration process steps
    const registrationSteps = [
      {
        id: "1",
        title: "Create Account",
        description:
          "Sign up with your business email and create your supplier account.",
        duration: "5 minutes",
      },
      {
        id: "2",
        title: "Complete Profile",
        description:
          "Fill in your company information, business details, and product categories.",
        duration: "15 minutes",
      },
      {
        id: "3",
        title: "Submit for Review",
        description:
          "Submit your application for our team to review and approve.",
        duration: "1-2 business days",
      },
      {
        id: "4",
        title: "Start Selling",
        description:
          "Once approved, upload your products and start selling to our customers.",
        duration: "Immediate",
      },
    ];

    const landingData = {
      stats: {
        totalSuppliers,
        approvedSuppliers,
        totalProducts,
        totalRevenue: totalRevenue._sum.supplierRevenue || 0,
      },
      featuredSuppliers,
      testimonials,
      benefits,
      registrationSteps,
      commissionRate: 15, // Default commission rate
      paymentTerms: 30, // Net 30 days
      minimumOrderValue: 0,
    };

    logger.info("Supplier landing page data retrieved successfully");

    return NextResponse.json(landingData);
  } catch (error) {
    logger.error("Error retrieving supplier landing page data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
