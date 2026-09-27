import { romanianPhoneMatchKey } from "@/lib/checkout/romanian-phone";

describe("romanianPhoneMatchKey", () => {
  it("folds +40, 0040, and 40 prefixes onto the same last 9 digits", () => {
    const expected = "722111222";
    expect(romanianPhoneMatchKey("0722 111 222")).toBe(expected);
    expect(romanianPhoneMatchKey("0722-111-222")).toBe(expected);
    expect(romanianPhoneMatchKey("+40 722 111 222")).toBe(expected);
    expect(romanianPhoneMatchKey("0040722111222")).toBe(expected);
    expect(romanianPhoneMatchKey("40722111222")).toBe(expected);
  });

  it("does not treat a different subscriber number as the same phone", () => {
    expect(romanianPhoneMatchKey("0733000000")).not.toBe(
      romanianPhoneMatchKey("0722111222")
    );
  });

  it("returns null when there are fewer than 9 digits", () => {
    expect(romanianPhoneMatchKey("")).toBeNull();
    expect(romanianPhoneMatchKey("   ")).toBeNull();
    expect(romanianPhoneMatchKey(null)).toBeNull();
    expect(romanianPhoneMatchKey("0722")).toBeNull();
  });
});
