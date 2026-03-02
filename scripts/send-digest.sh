#!/bin/bash
set -e
echo "Sending weekly digest..."
npx tsx scripts/weekly-digest.ts
echo "Digest complete."
