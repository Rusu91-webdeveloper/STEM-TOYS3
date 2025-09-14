import { NextRequest, NextResponse } from "next/server";
import { EMAIL_TEMPLATES } from "@/lib/email/template-library";
import { ADDITIONAL_EMAIL_TEMPLATES } from "@/lib/email/additional-templates";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateSlug = searchParams.get("template");
    const category = searchParams.get("category");

    const allTemplates = [...EMAIL_TEMPLATES, ...ADDITIONAL_EMAIL_TEMPLATES];

    let templatesToTest = allTemplates;

    if (templateSlug) {
      templatesToTest = allTemplates.filter(t => t.slug === templateSlug);
    } else if (category) {
      templatesToTest = allTemplates.filter(t => t.category === category);
    }

    const results = templatesToTest.map(template => ({
      slug: template.slug,
      name: template.name,
      category: template.category,
      variables: template.variables,
      subject: template.subject,
      isActive: template.isActive,
    }));

    return NextResponse.json({
      success: true,
      total: results.length,
      results,
      categories: [...new Set(allTemplates.map(t => t.category))],
      usage: {
        all: "/api/test-email",
        category: "/api/test-email?category=authentication",
        template: "/api/test-email?template=welcome",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
