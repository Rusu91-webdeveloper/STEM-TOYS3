import {
  isValidIban,
  resolveFanCourierCodBankDetails,
  resolveFanCourierSenderProfiles,
  resolveFanCourierService,
} from "@/lib/shipping/fancourier-cod";

describe("FAN Courier Cont Colector configuration", () => {
  describe("service selection", () => {
    it("uses Standard for prepaid address delivery", () => {
      expect(
        resolveFanCourierService({
          methodId: "fancourier:standard",
          isCodPayment: false,
        })
      ).toBe("Standard");
    });

    it("uses Cont Colector for address-delivery COD", () => {
      expect(
        resolveFanCourierService({
          methodId: "fancourier:standard",
          isCodPayment: true,
        })
      ).toBe("Cont Colector");
    });

    it("uses FANbox Cont Colector for locker COD", () => {
      expect(
        resolveFanCourierService({
          methodId: "fancourier:fanbox",
          pickupLocation: "F1011137",
          isCodPayment: true,
        })
      ).toBe("FANbox Cont Colector");
    });
  });

  describe("payout bank resolution", () => {
    const validIban = "RO49AAAA1B31007593840000";

    it("normalizes and validates a Romanian IBAN", () => {
      expect(isValidIban("ro49 aaaa 1b31 0075 9384 0000")).toBe(true);
    });

    it("prefers a complete environment override", () => {
      expect(
        resolveFanCourierCodBankDetails({
          environment: {
            FANCOURIER_COD_BANK: "Test Bank",
            FANCOURIER_COD_IBAN: validIban,
          },
          branch: {
            bank: "Branch Bank",
            bankAccount: "RO09BCYP0000001234567890",
          },
        })
      ).toEqual({
        success: true,
        details: {
          bank: "Test Bank",
          bankAccount: validIban,
          source: "environment",
        },
      });
    });

    it("uses the bank account registered on the matching SelfAWB branch", () => {
      expect(
        resolveFanCourierCodBankDetails({
          environment: {},
          branch: { bank: "Test Bank", bankAccount: validIban },
        })
      ).toEqual({
        success: true,
        details: {
          bank: "Test Bank",
          bankAccount: validIban,
          source: "selfawb_branch",
        },
      });
    });

    it("fails closed when payout configuration is missing", () => {
      expect(
        resolveFanCourierCodBankDetails({ environment: {}, branch: null })
      ).toMatchObject({ success: false });
    });

    it("does not mix a partial override with branch details", () => {
      expect(
        resolveFanCourierCodBankDetails({
          environment: { FANCOURIER_COD_BANK: "Override Bank" },
          branch: { bank: "Branch Bank", bankAccount: validIban },
        })
      ).toMatchObject({ success: false });
    });

    it("fails closed for an invalid IBAN", () => {
      expect(
        resolveFanCourierCodBankDetails({
          environment: {},
          branch: { bank: "Test Bank", bankAccount: "RO00INVALID" },
        })
      ).toMatchObject({ success: false });
    });
  });

  it("keeps merchant contact details separate from supplier pickup details", () => {
    const merchant = {
      name: "Merchant SRL",
      phone: "0700000001",
      email: "support@merchant.test",
      county: "Cluj",
      locality: "Cluj-Napoca",
      street: "Merchant Street",
      number: "1",
    };
    const supplierPickup = {
      name: "Supplier SRL",
      phone: "0700000002",
      email: "warehouse@supplier.test",
      county: "Bucuresti",
      locality: "Bucuresti",
      street: "Warehouse Street",
      number: "2",
    };

    const result = resolveFanCourierSenderProfiles({
      merchant,
      supplierPickup,
    });

    expect(result.customerFacingSender).toMatchObject({
      name: merchant.name,
      phone: merchant.phone,
      email: merchant.email,
      county: supplierPickup.county,
      locality: supplierPickup.locality,
      street: supplierPickup.street,
      number: supplierPickup.number,
    });
    expect(result.pickupSender).toEqual(supplierPickup);
  });
});
