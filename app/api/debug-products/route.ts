import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test the products API endpoint directly
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://stem-toys-3.vercel.app";

    const productsUrl = `${baseUrl}/api/products`;

    console.log(`Testing products API at: ${productsUrl}`);

    const response = await fetch(productsUrl, {
      cache: "no-store",
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      responseData = {
        rawResponse: responseText,
        parseError:
          parseError instanceof Error
            ? parseError.message
            : "Unknown parse error",
      };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      apiTest: {
        url: productsUrl,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        responseType: typeof responseData,
        dataStructure: responseData ? Object.keys(responseData) : null,
        hasProducts: responseData?.products ? responseData.products.length : 0,
        firstProduct: responseData?.products?.[0] || null,
        responseData,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
