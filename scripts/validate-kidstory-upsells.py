#!/usr/bin/env python3
"""
Validate Kidstory upsell candidates against feed snapshot
Usage: python3 scripts/validate-kidstory-upsells.py uploads/kidstory_feed_20260925.csv
"""

import csv
import json
import sys

# Kidstory candidates from research (high + medium confidence)
CANDIDATES = {
    # High confidence
    '06806IS': 'high',
    '06808IS': 'high', 
    'F4641DT': 'high',
    'F5311ML': 'high',
    'PP3828': 'high',
    # Medium confidence
    '06807IS': 'medium',
    '4M-03479': 'medium',
    '4M-03291': 'medium',
    '4M-03463': 'medium',
    '4M-03462': 'medium',
    '4M-03295': 'medium',
    '4M-03929/EU': 'medium',
    '4M-03930/EU': 'medium',
    '4M-03257': 'medium',
    'PP4185': 'medium',
}

def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <kidstory_feed.csv>")
        sys.exit(1)
    
    feed_path = sys.argv[1]
    
    # Parse feed (pipe-separated)
    feed_rows = []
    with open(feed_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='|', quotechar='"')
        feed_rows = list(reader)
    
    print(f"Loaded {len(feed_rows)} rows from Kidstory feed\n")
    
    # Validate each candidate
    valid_entries = []
    rejected = []
    
    for sku, confidence in CANDIDATES.items():
        # Find in feed
        matches = [r for r in feed_rows if r['sku'].strip() == sku]
        
        if not matches:
            rejected.append({
                'sku': sku,
                'confidence': confidence,
                'reason': 'Not found in feed'
            })
            continue
        
        if len(matches) > 1:
            rejected.append({
                'sku': sku,
                'confidence': confidence,
                'reason': f'Ambiguous: {len(matches)} matches in feed'
            })
            continue
        
        row = matches[0]
        
        # Check stock
        stock_status = row.get('stock_status_string', '').strip().lower()
        if stock_status != 'instock':
            rejected.append({
                'sku': sku,
                'confidence': confidence,
                'reason': f'Out of stock (status: {stock_status})'
            })
            continue
        
        # Check images
        images = [row.get('file', '').strip()]
        for i in range(2, 11):
            img = row.get(f'image{i}', '').strip()
            if img:
                images.append(img)
        
        image_urls = [img for img in images if img and img.startswith('http')]
        
        if not image_urls:
            rejected.append({
                'sku': sku,
                'confidence': confidence,
                'reason': 'No images in feed'
            })
            continue
        
        # Check description
        description = row.get('description', '').strip()
        name = row.get('name', '').strip()
        
        if not description or not name:
            rejected.append({
                'sku': sku,
                'confidence': confidence,
                'reason': 'Missing name or description'
            })
            continue
        
        # Valid entry
        entry = {
            'sourceId': row['id'].strip(),
            'sku': sku,
            'ean': row.get('ean', '').strip(),
            'role': 'UPSELL',
            'theme': 'Add-on / Expansion',
            'imageCount': len(image_urls),
            'hasDescription': bool(description),
            'confidence': confidence,
        }
        valid_entries.append(entry)
    
    # Report results
    print(f"✓ Valid: {len(valid_entries)}")
    print(f"✗ Rejected: {len(rejected)}\n")
    
    if valid_entries:
        print("Valid entries for portfolio.json:\n")
        portfolio_entries = [{k: v for k, v in e.items() if k in ['sourceId', 'sku', 'ean', 'role', 'theme']} 
                           for e in valid_entries]
        print(json.dumps(portfolio_entries, indent=2, ensure_ascii=False))
        print()
    
    if rejected:
        print("Rejected candidates:\n")
        for r in rejected:
            print(f"  {r['sku']} ({r['confidence']}): {r['reason']}")
    
    # Write output
    with open('kidstory-upsell-validation.json', 'w', encoding='utf-8') as f:
        json.dump({
            'valid': valid_entries,
            'rejected': rejected,
            'portfolio_entries': portfolio_entries if valid_entries else []
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Results written to kidstory-upsell-validation.json")

if __name__ == '__main__':
    main()
