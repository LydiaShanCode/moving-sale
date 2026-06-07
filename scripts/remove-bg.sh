#!/bin/bash
# Remove backgrounds from all item images using remove.bg API
# Output: PNG files with transparent backgrounds, replacing the originals

API_KEY="$REMOVE_BG_API_KEY"
IMG_DIR="$(dirname "$0")/../public/images/items"

if [ -z "$API_KEY" ]; then
  echo "Error: REMOVE_BG_API_KEY not set"
  exit 1
fi

cd "$IMG_DIR" || exit 1

for f in *.jpg *.png; do
  [ -f "$f" ] || continue
  name="${f%.*}"
  out="${name}.png"

  echo "Processing $f..."
  HTTP_STATUS=$(curl -s -o "${out}.tmp" -w "%{http_code}" \
    --request POST "https://api.remove.bg/v1.0/removebg" \
    --header "X-Api-Key: $API_KEY" \
    --form "image_file=@${f}" \
    --form "size=auto")

  if [ "$HTTP_STATUS" = "200" ]; then
    mv "${out}.tmp" "$out"
    # Remove original jpg if we saved as png
    [ "$f" != "$out" ] && rm "$f"
    echo "  ✓ $out"
  else
    echo "  ✗ Failed ($HTTP_STATUS): $(cat "${out}.tmp" 2>/dev/null)"
    rm -f "${out}.tmp"
  fi
done

echo "Done."
