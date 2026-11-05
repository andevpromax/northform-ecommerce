#!/usr/bin/env bash
set -euo pipefail

# Run this script from the Next.js project root on macOS.
# Downloads verified free Unsplash photo selections as local JPG assets.
# Photo page URLs are retained below for attribution/reference.

if ! command -v sips >/dev/null 2>&1; then
  echo 'This script uses macOS sips to convert images to JPEG.' >&2
  exit 1
fi

out_dir='public/images'
mkdir -p "$out_dir"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

photos=(
  'arc-lamp|DXn_tWiMI4c'
  'linen-throw|eLMNd55pei4'
  'oak-tray|6aLDv_mhVuk'
  'ceramic-vase|WUrXahlyjBo'
  'reading-light|ccydTEH5x7E'
  'wool-cushion|AP__URzDf2M'
  'wall-clock|7VO1tQLtJmU'
  'glass-carafe|eUQhSQn4zkY'
  'stone-bowl|ymEgsqhdOXw'
  'woven-basket|B3UekH4qQnw'
)

for entry in "${photos[@]}"; do
  name="${entry%%|*}"
  id="${entry#*|}"
  src="https://unsplash.com/photos/${id}/download?force=true&w=1200&q=85"
  temp="$tmp_dir/$name.download"
  dest="$out_dir/$name.jpg"
  echo "Downloading $name ..."

  if ! curl --fail --location --silent --show-error --retry 2 --connect-timeout 15 --max-time 90 "$src" -o "$temp"; then
    echo "FAILED: $name. Download manually at https://unsplash.com/photos/$id" >&2
    continue
  fi

  if ! sips -s format jpeg "$temp" --out "$dest" >/dev/null 2>&1; then
    echo "FAILED to convert $name; download manually at https://unsplash.com/photos/$id" >&2
    rm -f "$dest"
    continue
  fi

  echo "Saved $dest"
done

echo 'Finished. Verify all 10 JPG files exist before updating the product image paths.'
