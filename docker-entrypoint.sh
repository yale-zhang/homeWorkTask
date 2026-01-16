#!/bin/sh
set -e

# Generate a small JS file with runtime-config available as window.__RUNTIME__
# This lets us inject values at container start instead of baking secrets into the build.

cat > /usr/share/nginx/html/env-config.js <<'EOF'
window.__RUNTIME__ = {
  VITE_API_KEY: "${VITE_API_KEY}",
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_KEY: "${VITE_SUPABASE_KEY}"
};
EOF

exec "$@"
