-- Quick Job Status Check
-- Run this in your database console to see job details

-- Check the specific failed job
SELECT 
  id,
  type,
  status,
  "userId",
  "createdAt",
  "startedAt",
  "completedAt",
  CASE 
    WHEN "completedAt" IS NOT NULL AND "startedAt" IS NOT NULL 
    THEN EXTRACT(EPOCH FROM ("completedAt" - "startedAt")) || ' seconds'
    ELSE 'N/A'
  END as duration,
  LENGTH(input) as input_length,
  LENGTH(result) as result_length,
  LEFT(error, 200) as error_preview
FROM "AiJob"
WHERE id = 'cmghkabcr0004l204gbv85nxy';

-- Check all recent jobs
SELECT 
  id,
  type,
  status,
  "createdAt",
  CASE 
    WHEN status = 'COMPLETED' THEN '✅'
    WHEN status = 'FAILED' THEN '❌'
    WHEN status = 'PROCESSING' THEN '🔄'
    WHEN status = 'PENDING' THEN '⏳'
    ELSE '❓'
  END as emoji,
  LEFT(error, 100) as error_summary
FROM "AiJob"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Count jobs by status
SELECT 
  status,
  COUNT(*) as count
FROM "AiJob"
GROUP BY status
ORDER BY count DESC;

