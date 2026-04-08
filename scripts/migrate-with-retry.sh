#!/bin/bash
# Retry prisma migrate deploy and recover from the known supplier pricing drift.

set -u

MAX_RETRIES=3
RETRY_COUNT=0
RECOVERY_ATTEMPTED=0
KNOWN_FAILED_MIGRATION="20260408143000_add_supplier_cost_pricing_controls"

run_migrate_deploy() {
  npx prisma migrate deploy 2>&1
}

recover_known_failed_migration() {
  local output="$1"

  if [ "$RECOVERY_ATTEMPTED" -eq 1 ]; then
    return 1
  fi

  if [[ "$output" != *"Error: P3009"* ]] || [[ "$output" != *"$KNOWN_FAILED_MIGRATION"* ]]; then
    return 1
  fi

  echo "Detected failed migration record for $KNOWN_FAILED_MIGRATION. Marking it as rolled back so the idempotent SQL can be reapplied..."

  if ! npx prisma migrate resolve --rolled-back "$KNOWN_FAILED_MIGRATION"; then
    echo "Failed to resolve $KNOWN_FAILED_MIGRATION as rolled back"
    return 1
  fi

  RECOVERY_ATTEMPTED=1
  echo "Retrying prisma migrate deploy after recovery..."
  return 0
}

while true; do
  MIGRATION_OUTPUT="$(run_migrate_deploy)"
  EXIT_CODE=$?
  echo "$MIGRATION_OUTPUT"

  if [ $EXIT_CODE -eq 0 ]; then
    echo "Migration completed successfully"
    exit 0
  fi

  if recover_known_failed_migration "$MIGRATION_OUTPUT"; then
    continue
  fi

  RETRY_COUNT=$((RETRY_COUNT+1))

  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "Migration failed after $MAX_RETRIES attempts"
    exit 1
  fi

  echo "Migration failed (attempt $RETRY_COUNT/$MAX_RETRIES). Retrying in 5 seconds..."
  sleep 5
done
