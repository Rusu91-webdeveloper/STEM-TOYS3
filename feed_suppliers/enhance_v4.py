#!/usr/bin/env python3
"""
Enhanced v4: Fixes from audit:
 - Match bundle by ID (not SKU)
 - Case-insensitive SKU matching (LJ_CD037U vs Lj_CD037U)
 - Fill categoryId for old_db products that had it empty
 - Clean HTML entities from descriptions
 - Compute compareAtPrice where missing
 - Cross-fill costPrice from kidstory price_vat for boribon products
"""

import csv
import uuid
import re
import json
import html
from datetime import datetime, timezone
from pathlib import Path

FEED_DIR = Path(__file__).parent
DOWNLOADS = Path.home() / "Downloads"

OLD_DB = FEED_DIR / "old_db_products_211.csv"
NEW_DATA = FEED_DIR / "new_data.csv"
KIDSTORY = DOWNLOADS / "all_kidstory.csv"
BORIBON = DOWNLOADS / "all_boribon.csv"
OUTPUT = FEED_DIR / "enhanced_new_data_v4.csv"

HEADERS = [
    "id", "name", "slug", "description", "price", "compareAtPrice", "sku",
    "images", "categoryId", "tags", "attributes", "metadata", "isActive",
    "featured", "stockQuantity", "reservedQuantity", "reorderPoint", "weight",
    "dimensions", "averageRating", "reviewCount", "totalSold", "createdAt",
    "updatedAt", "barcode", "ageGroup", "costPrice", "importDuties",
    "shippingCost", "storageCost", "packagingCost", "laborCost",
    "qualityControlCost", "paymentProcessingFee", "customerServiceCost",
    "operationalOverhead", "status", "stemDiscipline", "supplierId",
    "isBundle", "bundleItems", "bundleDiscount"
]

SUPPLIER_BORIBON = "ee75eea8-9f64-4076-96a2-52f5d6926c14"
SUPPLIER_KIDSTORY = "26f5418c-965d-4630-994c-b51947cdec04"

BRAND_TO_SUPPLIER = {
    "Fridolin": SUPPLIER_BORIBON, "Djeco": SUPPLIER_BORIBON,
    "Londji": SUPPLIER_BORIBON, "CreativaMente": SUPPLIER_BORIBON,
    "Cleverclixx": SUPPLIER_BORIBON, "Egmont Toys": SUPPLIER_BORIBON,
    "Gigo Toys": SUPPLIER_BORIBON, "Thames & Kosmos": SUPPLIER_BORIBON,
    "Svoora": SUPPLIER_BORIBON, "Clicstoys": SUPPLIER_BORIBON,
    "4M": SUPPLIER_KIDSTORY, "Carson": SUPPLIER_KIDSTORY,
    "Aqua Dragons": SUPPLIER_KIDSTORY, "Imagine Station": SUPPLIER_KIDSTORY,
    "Magblox": SUPPLIER_KIDSTORY,
}

CAT_SCIENCE       = "cmltqopok0000jjujlb7k8cog"
CAT_ENGINEERING   = "cmltqoq940001jjujkuq676do"
CAT_MAGNETIC      = "cmltqoqd70002jjujuey1ukeu"
CAT_LOGIC_MATH    = "cmltqoqov0003jjujnu1ppk5u"
CAT_PUZZLES_OPTIC = "cmltqoqsf0004jjujibh2j3vx"
CAT_4M            = "cmli6buv20021jjpbr43q9cpr"
CAT_FRIDOLIN      = "cmli6bo4x0008jjpbrbibqgfi"

SKU_PREFIX_SUPPLIER = {
    "Fr_": SUPPLIER_BORIBON, "DJ": SUPPLIER_BORIBON, "LJ_": SUPPLIER_BORIBON,
    "Egm_": SUPPLIER_BORIBON, "CC-": SUPPLIER_BORIBON, "CTV": SUPPLIER_BORIBON,
    "K_": SUPPLIER_BORIBON, "G_": SUPPLIER_BORIBON,
    "4M-": SUPPLIER_KIDSTORY, "4M_": SUPPLIER_KIDSTORY,
}

AGE_MAP = {
    "3 - 5": "PRESCHOOL_3_5", "3-5": "PRESCHOOL_3_5", "3+": "PRESCHOOL_3_5",
    "3-6": "PRESCHOOL_3_5", "5-7 ani": "PRESCHOOL_3_5", "5 ani+": "PRESCHOOL_3_5",
    "6 - 9": "ELEMENTARY_6_8", "6-9": "ELEMENTARY_6_8", "6+": "ELEMENTARY_6_8",
    "7+": "ELEMENTARY_6_8", "7-10 ani": "ELEMENTARY_6_8",
    "8+": "TWEEN_9_12", "9+": "TWEEN_9_12", "10+": "TWEEN_9_12", "10 ani+": "TWEEN_9_12",
    "14+": "TEEN_13_PLUS",
}


def extract_sku(new_id: str) -> str:
    s = new_id
    if s.startswith("new-"):
        s = s[4:]
    return re.sub(r"-(v2|old)$", "", s)


def slugify(text: str) -> str:
    s = text.lower().strip()
    for chars, repl in {"àáâãäåăâ": "a", "èéêë": "e", "ìíîïî": "i",
                         "òóôõö": "o", "ùúûü": "u", "șş": "s", "țţ": "t"}.items():
        for c in chars:
            s = s.replace(c, repl)
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s]+", "-", s)
    return re.sub(r"-+", "-", s).strip("-")[:120]


def clean_html(text: str) -> str:
    """Decode HTML entities and strip leftover tags."""
    if not text:
        return text
    text = html.unescape(text)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def resolve_supplier(sku: str, brand: str) -> str:
    if brand in BRAND_TO_SUPPLIER:
        return BRAND_TO_SUPPLIER[brand]
    for prefix, sid in SKU_PREFIX_SUPPLIER.items():
        if sku.upper().startswith(prefix.upper()):
            return sid
    return SUPPLIER_BORIBON


def resolve_category(title: str, meta: str, brand: str, sku: str) -> str:
    combined = (title + " " + meta + " " + brand).lower()

    if brand == "4M" or sku.upper().startswith("4M"):
        return CAT_4M
    if brand == "Fridolin" or sku.upper().startswith("FR_"):
        return CAT_FRIDOLIN

    if any(w in combined for w in ["magblox", "cleverclixx", "magnet", "geobonhomme", "magnetic"]):
        return CAT_MAGNETIC
    if any(w in combined for w in ["zig", "traseu", "marble run", "construc", "inginer"]):
        return CAT_ENGINEERING
    if any(w in combined for w in ["kinoptik", "optic", "origami", "creagami", "caleidoscop"]):
        return CAT_PUZZLES_OPTIC
    if any(w in combined for w in ["cubologic", "logic", "tangram", "labirint", "impossiblo", "puzzle"]):
        return CAT_LOGIC_MATH
    if any(w in combined for w in ["cristal", "experiment", "robot", "solar",
                                    "meteorolog", "fosil", "dino", "geod", "electric"]):
        return CAT_SCIENCE

    brand_default = {
        "Djeco": CAT_PUZZLES_OPTIC, "Londji": CAT_PUZZLES_OPTIC,
        "Thames & Kosmos": CAT_SCIENCE, "Egmont Toys": CAT_LOGIC_MATH,
        "Gigo Toys": CAT_SCIENCE, "CreativaMente": CAT_PUZZLES_OPTIC,
        "Cleverclixx": CAT_MAGNETIC, "Clicstoys": CAT_ENGINEERING,
    }
    return brand_default.get(brand, CAT_SCIENCE)


def guess_brand_from_sku(sku: str) -> str:
    prefix_brand = {
        "Fr_": "Fridolin", "4M-": "4M", "4M_": "4M", "DJ": "Djeco",
        "LJ_": "Londji", "Lj_": "Londji", "Egm_": "Egmont Toys",
        "CC-": "Cleverclixx", "K_": "Thames & Kosmos", "G_": "Genius Toy",
        "CTV": "CreativaMente",
    }
    for prefix, brand in prefix_brand.items():
        if sku.startswith(prefix):
            return brand
    return ""


def parse_age_group(text: str) -> str:
    if not text:
        return ""
    v = text.strip().lower()
    for key, val in AGE_MAP.items():
        if key.lower() in v:
            return val
    m = re.search(r"(\d+)", v)
    if m:
        age = int(m.group(1))
        if age <= 5: return "PRESCHOOL_3_5"
        if age <= 8: return "ELEMENTARY_6_8"
        if age <= 12: return "TWEEN_9_12"
        return "TEEN_13_PLUS"
    return ""


def guess_stem(title: str, meta: str) -> str:
    combined = (title + " " + meta).lower()
    if any(w in combined for w in ["cristal", "geod", "experiment", "chimie", "meteorolog", "fosil", "mineral"]):
        return "SCIENCE"
    if any(w in combined for w in ["robot", "solar", "micro:bit", "electric", "energie"]):
        return "TECHNOLOGY"
    if any(w in combined for w in ["puzzle", "logic", "tangram", "cubologic", "labirint", "iq"]):
        return "MATH"
    if any(w in combined for w in ["construc", "marble", "zig", "inginer", "traseu", "magnet", "magblox", "cleverclixx"]):
        return "ENGINEERING"
    if any(w in combined for w in ["origami", "creagami", "optic", "kinoptik"]):
        return "ART_STEAM"
    return "GENERAL"


def parse_weight(w_str: str) -> str:
    if not w_str:
        return ""
    m = re.search(r"([\d.]+)\s*kg", w_str.lower())
    if m: return str(float(m.group(1)) * 1000)
    m = re.search(r"([\d.]+)\s*g", w_str.lower())
    if m: return m.group(1)
    return ""


def collect_images_boribon(row: dict) -> list:
    imgs = []
    if row.get("avatar", "").strip():
        imgs.append(row["avatar"].strip())
    for i in range(1, 5):
        val = row.get(f"image_additional{i}", "").strip()
        if val: imgs.append(val)
    return imgs


def collect_images_kidstory(row: dict) -> list:
    imgs = []
    if row.get("file", "").strip():
        imgs.append(row["file"].strip())
    for i in range(2, 11):
        val = row.get(f"image{i}", "").strip()
        if val: imgs.append(val)
    return imgs


def compute_compare_at_price(price_str: str) -> str:
    """Generate a strikethrough 'was' price ~20% above current price, rounded nicely."""
    if not price_str:
        return ""
    try:
        price = float(price_str)
        if price <= 0:
            return ""
        was = price * 1.2
        was = round(was / 0.5) * 0.5
        if was - int(was) == 0:
            was = int(was) - 0.01
        return f"{was:.2f}"
    except (ValueError, TypeError):
        return ""


def load_old_db():
    """Load old_db keyed by BOTH sku (case-insensitive) and id."""
    by_sku = {}
    by_id = {}
    with open(OLD_DB, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            sku = row.get("sku", "").strip()
            pid = row.get("id", "").strip()
            if sku:
                by_sku[sku.lower()] = row
            if pid:
                by_id[pid] = row
    return by_sku, by_id


def load_csv_by_key(path, key_field):
    db = {}
    with open(path, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            k = row.get(key_field, "").strip()
            if k: db[k] = row
    return db


def load_new_data():
    raw = []
    with open(NEW_DATA, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            raw.append(row)
    dedup = {}
    for p in raw:
        pid = p["id"]
        if pid.endswith("-old"):
            continue
        base_sku = extract_sku(pid)
        if base_sku in dedup:
            if pid.endswith("-v2"):
                dedup[base_sku] = p
        else:
            dedup[base_sku] = p
    return dedup


def get_brand_from_tags(tags_str: str) -> str:
    try:
        tags = json.loads(tags_str.replace('""', '"') if '""' in tags_str else tags_str)
        for t in tags:
            if t in BRAND_TO_SUPPLIER:
                return t
    except:
        pass
    return ""


def build_row(sku, new_row, old_row, kid_row, bor_row):
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.000")
    title = new_row["short_title_ro"]
    meta = new_row["meta_description_ro"]

    if old_row:
        row = dict(old_row)
        row["name"] = title
        row["description"] = clean_html(row.get("description", ""))

        try:
            md = json.loads(row.get("metadata", "{}") or "{}")
        except (json.JSONDecodeError, TypeError):
            md = {}
        md["shortTitleRo"] = title
        md["metaDescriptionRo"] = meta
        row["metadata"] = json.dumps(md, ensure_ascii=False)
        row["updatedAt"] = now

        brand = get_brand_from_tags(row.get("tags", "[]"))
        if not row.get("categoryId", "").strip():
            row["categoryId"] = resolve_category(
                title, row.get("description", ""), brand, row.get("sku", ""))

        if not row.get("compareAtPrice", "").strip():
            row["compareAtPrice"] = compute_compare_at_price(row.get("price", ""))

        return row, "old_db"

    row = {h: "" for h in HEADERS}
    row["id"] = str(uuid.uuid4())
    row["name"] = title
    row["sku"] = sku
    row["isActive"] = "false"
    row["featured"] = "false"
    row["reservedQuantity"] = "0"
    row["averageRating"] = "0"
    row["reviewCount"] = "0"
    row["totalSold"] = "0"
    row["createdAt"] = now
    row["updatedAt"] = now
    row["importDuties"] = "0"
    row["shippingCost"] = "0"
    row["storageCost"] = "0"
    row["packagingCost"] = "0"
    row["laborCost"] = "0"
    row["qualityControlCost"] = "0"
    row["paymentProcessingFee"] = "2.9"
    row["customerServiceCost"] = "0"
    row["operationalOverhead"] = "0"
    row["isBundle"] = "false"

    source = "defaults"
    brand = ""
    images = []
    description = meta

    if kid_row:
        source = "kidstory"
        real_sku = kid_row.get("sku", "").strip()
        if real_sku:
            row["sku"] = real_sku.replace("/EU", "").replace("/", "-")

        ean = kid_row.get("ean", "").strip()
        if ean and ean not in ("0", "nan", ""):
            row["barcode"] = ean.replace(".0", "")

        if kid_row.get("description", "").strip():
            description = clean_html(kid_row["description"].strip())

        kid_images = collect_images_kidstory(kid_row)
        if kid_images:
            images = kid_images

        base_price = kid_row.get("base_price", "").strip()
        price_vat = kid_row.get("price_vat", "").strip()
        if base_price:
            row["price"] = base_price
        if price_vat:
            row["costPrice"] = price_vat

        brand = kid_row.get("brand_name", "").strip()
        age_str = kid_row.get("varsta", "").strip()
        if age_str:
            row["ageGroup"] = parse_age_group(age_str)

        row["stockQuantity"] = "5" if kid_row.get("stock_status", "").strip() == "1" else "0"

    if bor_row:
        source = source + "+boribon" if source != "defaults" else "boribon"

        if bor_row.get("description", "").strip() and description == meta:
            description = clean_html(bor_row["description"].strip())

        bor_images = collect_images_boribon(bor_row)
        if not images and bor_images:
            images = bor_images
        elif bor_images:
            existing = set(images)
            for img in bor_images:
                if img not in existing:
                    images.append(img)

        if not row.get("price") or row["price"] == "":
            b2c = bor_row.get("price_b2c", "").strip()
            if b2c:
                row["price"] = b2c

        if not row.get("costPrice") or row["costPrice"] == "":
            b2b = bor_row.get("price_b2b", "").strip()
            if b2b:
                row["costPrice"] = b2b

        if not brand:
            brand = bor_row.get("brand", "").strip()

        if not row.get("ageGroup") or row["ageGroup"] == "":
            age_str = bor_row.get("varsta", "").strip()
            if age_str:
                row["ageGroup"] = parse_age_group(age_str)

        w = bor_row.get("greutate", "").strip()
        if w:
            row["weight"] = parse_weight(w)

        latime = bor_row.get("latime", "").strip()
        lungime = bor_row.get("lungime", "").strip()
        if latime or lungime:
            dims = {}
            if lungime: dims["length"] = lungime
            if latime: dims["width"] = latime
            row["dimensions"] = json.dumps(dims)

        qty = bor_row.get("quantity", "").strip()
        if qty and (not row.get("stockQuantity") or row["stockQuantity"] == "0"):
            row["stockQuantity"] = qty

        model = bor_row.get("model", "").strip()
        if model and (not row["sku"] or row["sku"] == sku):
            row["sku"] = model

    row["description"] = description
    row["slug"] = slugify(title) + "-" + row["sku"]
    row["images"] = json.dumps(images, ensure_ascii=False) if images else "[]"

    if not brand:
        brand = guess_brand_from_sku(row["sku"])
    row["tags"] = json.dumps([brand], ensure_ascii=False) if brand else "[]"

    row["attributes"] = "{}"
    row["metadata"] = json.dumps({
        "shortTitleRo": title, "metaDescriptionRo": meta,
        "learningOutcomes": [], "specialCategories": [],
    }, ensure_ascii=False)

    if not row.get("ageGroup"):
        row["ageGroup"] = parse_age_group(meta + " " + title)

    row["stemDiscipline"] = guess_stem(title, meta)
    row["supplierId"] = resolve_supplier(row["sku"], brand)
    row["categoryId"] = resolve_category(title, meta, brand, row["sku"])

    row["compareAtPrice"] = compute_compare_at_price(row.get("price", ""))

    has_price = row.get("price") and row["price"] != ""
    has_images = row.get("images") and row["images"] != "[]"
    if has_price and has_images:
        row["status"] = "APPROVED"
        row["isActive"] = "true"
    else:
        row["status"] = "DRAFT"

    return row, source


def main():
    old_by_sku, old_by_id = load_old_db()
    kidstory = load_csv_by_key(KIDSTORY, "id")
    boribon = load_csv_by_key(BORIBON, "id")
    new_data = load_new_data()

    stats = {}
    rows = []
    details = []
    improvements = {"html_cleaned": 0, "cat_filled": 0, "cap_added": 0,
                    "id_match": 0, "case_match": 0}

    for sku, new_row in new_data.items():
        old_row = old_by_sku.get(sku.lower())

        if not old_row and sku in old_by_id:
            old_row = old_by_id[sku]
            improvements["id_match"] += 1

        if not old_row and old_by_sku.get(sku.lower()):
            old_row = old_by_sku[sku.lower()]
            improvements["case_match"] += 1

        kid_row = kidstory.get(sku)
        bor_row = boribon.get(sku)

        row, source = build_row(sku, new_row, old_row, kid_row, bor_row)
        rows.append(row)

        stats[source] = stats.get(source, 0) + 1
        details.append((sku, source, row.get("status", ""),
                         row.get("supplierId", "")[:8],
                         row.get("categoryId", "")[:12] if row.get("categoryId") else "EMPTY",
                         bool(row.get("compareAtPrice", "").strip()),
                         new_row["short_title_ro"][:42]))

    with open(OUTPUT, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=HEADERS, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(rows)

    approved = sum(1 for r in rows if r.get("status") == "APPROVED")
    draft = sum(1 for r in rows if r.get("status") == "DRAFT")
    has_cat = sum(1 for r in rows if r.get("categoryId", "").strip())
    has_cap = sum(1 for r in rows if r.get("compareAtPrice", "").strip())
    has_cost = sum(1 for r in rows if r.get("costPrice", "").strip())
    has_barcode = sum(1 for r in rows if r.get("barcode", "").strip())
    has_weight = sum(1 for r in rows if r.get("weight", "").strip())
    html_clean = sum(1 for r in rows if not re.search(r"&[a-z]+;|&#\d+;", r.get("description", "")))

    print(f"\n{'='*78}")
    print(f"  ENHANCED v4 — FINAL PRODUCTION BUILD")
    print(f"{'='*78}")
    print(f"  Total: {len(rows)} products  |  {approved} APPROVED  |  {draft} DRAFT")
    print(f"{'='*78}")
    print(f"  Sources:")
    for src, count in sorted(stats.items(), key=lambda x: -x[1]):
        print(f"    {src:25s}  {count:3d}")
    print(f"{'='*78}")
    print(f"  Field coverage:")
    print(f"    categoryId:      {has_cat:2d}/{len(rows)}")
    print(f"    compareAtPrice:  {has_cap:2d}/{len(rows)}")
    print(f"    costPrice:       {has_cost:2d}/{len(rows)}")
    print(f"    barcode:         {has_barcode:2d}/{len(rows)}")
    print(f"    weight:          {has_weight:2d}/{len(rows)}")
    print(f"    clean HTML desc: {html_clean:2d}/{len(rows)}")
    print(f"{'='*78}")

    print(f"\n  {'SKU':<28s} {'Source':<12s} {'St':<9s} {'Sup':<10s} {'Cat':<14s} {'CaP':>5s} Name")
    print(f"  {'-'*28} {'-'*12} {'-'*9} {'-'*10} {'-'*14} {'-'*5} {'-'*38}")
    for sku, source, status, sid, cid, has_cap_flag, name in details:
        icon = "✓" if status == "APPROVED" else "◇"
        cap = "✓" if has_cap_flag else ""
        print(f"  {icon} {sku:<26s} {source:<12s} {status:<9s} {sid:<10s} {cid:<14s} {cap:>5s} {name}")

    if draft:
        print(f"\n  ◇ DRAFT products remaining: {draft}")

    print(f"\n  Output: {OUTPUT.name}\n")


if __name__ == "__main__":
    main()
