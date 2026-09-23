#!/bin/sh
# Sirve el sitio en http://localhost:8000
cd "$(dirname "$0")/.." && exec python3 -m http.server 8000
