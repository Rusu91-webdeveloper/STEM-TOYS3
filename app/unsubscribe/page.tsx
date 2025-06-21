import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/lib/i18n/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dezabonare Newsletter | TechTots",
  description: "Dezabonează-te de la newsletter-ul TechTots.",
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const t = await getTranslations();
  const email = searchParams.email || "";

  return (
    <Container>
      <div className="py-16 md:py-24 max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
          Dezabonare de la newsletter
        </h1>
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <p className="mb-6 text-center">
            {email
              ? `Ești sigur că dorești să te dezabonezi de la newsletter-ul nostru cu adresa de email ${email}?`
              : "Introdu adresa ta de email pentru a te dezabona de la newsletter-ul nostru."}
          </p>

          <form
            className="flex flex-col gap-4"
            action={async (formData) => {
              "use server";

              const emailToUse = email || (formData.get("email") as string);

              if (!emailToUse) {
                redirect("/unsubscribe/error");
              }

              let success = false;

              try {
                const response = await fetch(
                  `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/newsletter?email=${encodeURIComponent(emailToUse)}`,
                  {
                    method: "DELETE",
                  }
                );

                success = response.ok;
              } catch (error) {
                console.error("Error unsubscribing:", error);
                success = false;
              }

              // Handle redirects outside of try-catch to avoid redirect errors
              if (success) {
                redirect("/unsubscribe/success");
              } else {
                redirect("/unsubscribe/error");
              }
            }}>
            {!email && (
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Adresa de email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="nume@email.com"
                />
              </div>
            )}

            <div className="flex justify-center">
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white">
                Dezabonează-mă
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Container>
  );
}
