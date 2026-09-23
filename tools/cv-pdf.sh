#!/bin/sh
# Genera files/cv-es.pdf, files/cv-en.pdf y files/cv.pdf (= es) desde /cv/.
set -eu
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=8765
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1
for L in es en; do
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=4000 \
    --print-to-pdf="files/cv-$L.pdf" "http://localhost:$PORT/cv/?lang=$L&noga=1" 2>/dev/null
  PAGES=$(pdfinfo "files/cv-$L.pdf" | awk '/^Pages:/{print $2}')
  echo "cv-$L.pdf: $PAGES página(s)"
  [ "$PAGES" = "1" ] || { echo "✗ cv-$L.pdf debe tener 1 página"; exit 1; }
done
cp files/cv-es.pdf files/cv.pdf
echo "✓ PDFs generados"
