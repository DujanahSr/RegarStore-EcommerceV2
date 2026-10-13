#!/usr/bin/env bash
# Simulasi notifikasi Midtrans (webhook ber-signature) untuk pengujian lokal.
# Pemakaian: ./scripts/simulate-payment.sh <ORDER_NUMBER> <TOTAL> [settlement|expire|cancel]
# Contoh   : ./scripts/simulate-payment.sh REGAR-1791838230728-FAEF 249000
set -euo pipefail

ORDER="${1:?Order number wajib diisi, contoh: REGAR-1791838230728-FAEF}"
AMOUNT="$(printf '%.2f' "${2:?Total pembayaran wajib diisi, contoh: 249000}")"
STATUS="${3:-settlement}"
GATEWAY="${GATEWAY_URL:-http://localhost:8080}"

ENV_FILE="$(dirname "$0")/../.env"
SERVER_KEY="$(grep -E '^MIDTRANS_SERVER_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')"

if command -v sha512sum >/dev/null 2>&1; then SHA="sha512sum"; else SHA="shasum -a 512"; fi
SIGNATURE="$(printf '%s' "${ORDER}200${AMOUNT}${SERVER_KEY}" | $SHA | cut -d' ' -f1)"

curl -sS -X POST "$GATEWAY/api/v1/payments/midtrans/webhook" \
  -H 'Content-Type: application/json' \
  -d "{\"order_id\":\"$ORDER\",\"transaction_id\":\"sim-$(date +%s)\",\"transaction_status\":\"$STATUS\",\"status_code\":\"200\",\"gross_amount\":\"$AMOUNT\",\"payment_type\":\"bank_transfer\",\"fraud_status\":\"accept\",\"signature_key\":\"$SIGNATURE\"}"
echo
