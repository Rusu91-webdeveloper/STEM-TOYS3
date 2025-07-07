-- DropIndex
DROP INDEX "Coupon_isActive_idx";

-- DropIndex
DROP INDEX "Coupon_showAsPopup_idx";

-- CreateIndex
CREATE INDEX "idx_popup_coupon" ON "Coupon"("isActive", "showAsPopup", "popupPriority", "expiresAt", "startsAt");
