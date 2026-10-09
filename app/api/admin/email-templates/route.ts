import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

import {
  emailJson,
  emailApiError,
  parseEmailListQuery,
} from "@/lib/admin/email-api";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const templateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(100),
  subject: z.string().min(1).max(200),
  content: z.string().min(1),
  variables: z.array(z.string()).default([]),
  category: z.string().min(1).max(50),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
  images: z.array(z.any()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN")
      return emailJson({ error: "Unauthorized" }, 401);
    const { page, limit, search, category, isActive } = parseEmailListQuery(
      request.nextUrl.searchParams
    );
    const where: Prisma.EmailTemplateWhereInput = {
      ...(category ? { category } : {}),
      ...(isActive ? { isActive: isActive === "true" } : {}),
      ...(search
        ? {
            OR: ["name", "slug", "subject"].map(field => ({
              [field]: { contains: search, mode: "insensitive" },
            })),
          }
        : {}),
    };
    const [templates, total, savedCategories] = await Promise.all([
      db.emailTemplate.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { emails: true, campaigns: true, sequenceSteps: true },
          },
        },
      }),
      db.emailTemplate.count({ where }),
      db.emailTemplate.findMany({
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      }),
    ]);
    return emailJson({
      templates,
      categories: savedCategories.map(record => record.category),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return emailApiError(error, "Șabloanele nu au putut fi încărcate");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" || !session.user.id)
      return emailJson({ error: "Unauthorized" }, 401);
    const { images, metadata, ...data } = templateSchema.parse(
      await request.json()
    );
    if (await db.emailTemplate.findUnique({ where: { slug: data.slug } }))
      return emailJson({ error: "Există deja un șablon cu acest slug" }, 409);
    const template = await db.emailTemplate.create({
      data: {
        ...data,
        createdBy: session.user.id,
        metadata: { ...metadata, ...(images ? { images } : {}) },
      },
    });
    return emailJson(template, 201);
  } catch (error) {
    return emailApiError(error, "Șablonul nu a putut fi creat");
  }
}
