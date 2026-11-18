#!/usr/bin/env bash
set -e

# Change to server directory
cd "$(dirname "$0")"

# Configure Node and pnpm paths
export PATH="/usr/lib/chatgpt/resources/cua_node/bin:/home/winlin/.local/bin:$PATH"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

echo "===================================================="
echo "🚀 Starting Parivartan Local Cloud Sync Server..."
echo "📁 Database: SQLite (dev.db)"
echo "🌐 URL: http://localhost:4000"
echo "===================================================="

pnpm dev
