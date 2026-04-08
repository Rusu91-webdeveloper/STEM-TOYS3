-- Prevent multiple active returns for the same order item under concurrency.
-- We only lock active lifecycle states so historical terminal records can remain.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Return"
    WHERE "status" IN ('PENDING', 'APPROVED', 'RECEIVED')
    GROUP BY "orderItemId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot add active return uniqueness index because duplicate active returns already exist.';
  END IF;
END $$;

CREATE UNIQUE INDEX "Return_orderItemId_active_key"
ON "Return"("orderItemId")
WHERE "status" IN ('PENDING', 'APPROVED', 'RECEIVED');
