-- Add verification fields if they don't exist already
DO $$
BEGIN
    -- Check if emailVerified column exists and add it if it doesn't
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'User'
        AND column_name = 'emailVerified'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "emailVerified" TIMESTAMP;
    END IF;

    -- Check if verificationToken column exists and add it if it doesn't
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'User'
        AND column_name = 'verificationToken'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "verificationToken" TEXT;
    END IF;
    
    -- Check if isActive column exists and add it if it doesn't
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'User'
        AND column_name = 'isActive'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END
$$; 