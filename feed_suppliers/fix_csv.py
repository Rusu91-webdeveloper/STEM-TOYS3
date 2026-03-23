"""
CSV Cleaner: enhanced_v6_final.csv → enhanced_v7_clean.csv

Fixes applied:
1. Encoding artifacts (ðŸ mdash;, ,œ, , ž, reg;, ,š, etc.)
2. Barcode float → integer string (e.g. 4031172174813.0 → 4031172174813)
3. Remove EU-variant duplicate SKUs (originals already in file)
4. Fix bundle product tags (mixed categories → brand-only convention)
"""

import csv
import re

INPUT = "enhanced_v6_final.csv"
OUTPUT = "enhanced_v7_clean.csv"

# EU-variant SKUs whose originals (non-EU) already exist in the file
EU_DUPLICATE_SKUS = {
    "4M-03929/EU",
    "4M-03930/EU",
    "4M-03917/EU",
    "4M-03919/EU",
    "4M-03926/EU",
}

# Product ID for the bundle with incorrect tags
BUNDLE_ID = "cmltqpph2000bjjvr8dm5f4f9"


def fix_text(text: str) -> str:
    """Fix encoding artifacts introduced by Windows-1252 / HTML mis-decoding."""
    if not text:
        return text

    # --- Em dash / En dash ---
    # Pattern: ðŸ mdash; or ðŸš mdash; (orphaned encoding prefix + HTML entity text)
    text = text.replace("ðŸ mdash;", "—")
    text = text.replace("ðŸšmdash;", "—")
    text = text.replace("ðŸ šmdash;", "—")
    text = text.replace("ðŸ ndash;", "–")
    text = text.replace("ðŸšndash;", "–")
    text = text.replace("ðŸ šndash;", "–")
    # Variant where ,š directly precedes the entity text (no ðŸ prefix)
    text = text.replace(",šndash;", "–")
    text = text.replace(",šmdash;", "—")

    # --- Registered trademark ---
    # " reg;" appears after brand names like "MAGBLOX reg;"
    text = re.sub(r" reg;", "®", text)

    # --- Smart quotes (Windows-1252 mangling of UTF-8 curly quotes) ---
    # U+201C " (left double quote)  → UTF-8 E2 80 9C → Latin-1 reads as â (E2) + NUL (80) + œ (9C)
    # U+201D " (right double quote) → UTF-8 E2 80 9D → Latin-1 reads as â (E2) + NUL (80) + ž (9D)
    # After further stripping the â prefix disappears, leaving ,œ and , ž
    text = text.replace(",œ   , ž", '"')   # collapsed open+close (no content between)
    text = text.replace(",œ ", '"')
    text = text.replace(",œ", '"')
    text = text.replace(", ž", '"')
    text = text.replace(",ž", '"')

    # --- Testimonial separator artifact ---
    # "...text!,   ,   Name" should be "...text! — Name"
    text = re.sub(r"([!?.]),\s+,\s+", r"\1 — ", text)

    # --- Bullet/separator ,š artifact ---
    # ",š   Text" appears as a bullet point or separator before list items
    text = re.sub(r",š\s+", " • ", text)
    text = re.sub(r",š", " • ", text)

    # --- Remove remaining ðŸ garbage (leftover emoji encoding prefix) ---
    text = re.sub(r"ðŸ[š\s]*", "", text)

    # --- Collapse multiple spaces ---
    text = re.sub(r"  +", " ", text)

    return text.strip()


def fix_barcode(val: str) -> str:
    """Convert float-formatted barcodes back to integer strings."""
    if val and val.endswith(".0"):
        try:
            return str(int(float(val)))
        except ValueError:
            pass
    return val


STEM_DISCIPLINE_MAP = {
    "MATHEMATICS": "MATH",  # normalize to schema enum value
}


def fix_stem_discipline(val: str) -> str:
    return STEM_DISCIPLINE_MAP.get(val.strip(), val.strip())


def fix_bundle_tags(row: dict) -> dict:
    """Fix the bundle product's tags — should follow brand-name-only convention."""
    if row.get("id") == BUNDLE_ID:
        # Bundle has no specific brand; use empty array to stay consistent
        row["tags"] = "[]"
    return row


def main() -> None:
    with open(INPUT, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    cleaned = []
    removed_skus = []

    for row in rows:
        sku = row.get("sku", "")

        # 1. Drop EU-variant duplicates
        if sku in EU_DUPLICATE_SKUS:
            removed_skus.append(sku)
            continue

        # 2. Fix barcode float formatting
        row["barcode"] = fix_barcode(row.get("barcode", ""))

        # 3. Fix encoding artifacts in text fields
        for field in ("name", "description", "metadata"):
            row[field] = fix_text(row.get(field, ""))

        # 4. Fix bundle product tags
        row = fix_bundle_tags(row)

        # 5. Normalize stemDiscipline enum value
        if row.get("stemDiscipline"):
            row["stemDiscipline"] = fix_stem_discipline(row["stemDiscipline"])

        cleaned.append(row)

    with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(cleaned)

    print(f"Input rows  : {len(rows)}")
    print(f"Removed     : {len(removed_skus)} EU-variant duplicates → {removed_skus}")
    print(f"Output rows : {len(cleaned)}")
    print(f"Saved to    : {OUTPUT}")


if __name__ == "__main__":
    main()
