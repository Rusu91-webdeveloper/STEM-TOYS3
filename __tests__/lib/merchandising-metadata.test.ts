jest.mock("@/lib/metadata", () => ({ createMetadata: (options: unknown) => options }));
import { generateProductMetadata } from "@/lib/utils/seo";
test("product metadata passes the unique title and description instead of global translation keys", () => {
 const result = generateProductMetadata({name:"Rachetă TopBright",slug:"rocket",metadata:{metaTitle:"Rachetă TopBright 6+",metaDescription:"Experiment cu apă, 6+."}});
 expect(result.title).toBe("Rachetă TopBright 6+");
 expect(result.description).toBe("Experiment cu apă, 6+.");
});
test("unknown age is not invented in product description", () => {
 const result=generateProductMetadata({name:"Kit",slug:"kit",ageGroup:"ELEMENTARY_6_8"});
 expect(result.description).not.toContain("8-12");
});
