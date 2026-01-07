#!/bin/bash
# Retry prisma migrate deploy up to 3 times with 15s timeout each

MAX_RETRIES=3
RETRY_COUNT=0

until npx prisma migrate deploy || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  RETRY_COUNT=$((RETRY_COUNT+1))
  echo "Migration failed (attempt $RETRY_COUNT/$MAX_RETRIES). Retrying in 5 seconds..."
  sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Migration failed after $MAX_RETRIES attempts"
  exit 1
fi

echo "Migration completed successfully"
exit 0

