// These transactional messages use code implementations instead of DB lookup.
// Shared by the sending service and admin UI to avoid misleading edit promises.
export const codeOwnedTemplateSlugs = [
  "order-confirmation",
  "order-shipped-fancourier",
  "order-shipped",
  "password-change-confirmation",
  "payment-failed",
  "refund",
  "admin-new-order",
];
export const isCodeOwnedEmailTemplate = (slug: string) =>
  codeOwnedTemplateSlugs.includes(slug);
