#!/usr/bin/env python3
import argparse
import csv
from pathlib import Path


def to_float(value: str | None):
    try:
        if value is None:
            return None
        value = str(value).strip()
        if value == "":
            return None
        return float(value)
    except Exception:
        return None


def fmt_price(value: float) -> str:
    text = f"{value:.2f}"
    return text.rstrip("0").rstrip(".") if "." in text else text


def adjust_base_price(rows, margin, discount_filter):
    updated = 0
    for row in rows:
        if row.get("discount_pct", "").strip() != discount_filter:
            continue
        cost_gross = to_float(row.get("b2b_price_gross_RON"))
        if cost_gross is None:
            continue
        new_base = round(cost_gross / (1 - margin), 2)
        row["base_price"] = fmt_price(new_base)
        updated += 1
    return updated


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Adjust Kidstory retail prices for rows with discount_pct=0% by applying "
            "a target gross margin on cost (b2b_price_gross_RON)."
        )
    )
    parser.add_argument("input_csv", help="Path to the Kidstory CSV input file")
    parser.add_argument("output_csv", help="Path to write the adjusted CSV output")
    parser.add_argument(
        "--margin",
        type=float,
        default=0.25,
        help="Target gross margin (default: 0.25 for 25%)",
    )
    parser.add_argument(
        "--discount-filter",
        default="0%",
        help="Only adjust rows where discount_pct equals this value (default: 0%)",
    )
    args = parser.parse_args()

    input_path = Path(args.input_csv)
    output_path = Path(args.output_csv)

    with input_path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        headers = reader.fieldnames or []
        rows = list(reader)

    updated = adjust_base_price(rows, args.margin, args.discount_filter)

    with output_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Updated {updated} rows. Wrote: {output_path}")


if __name__ == "__main__":
    main()
