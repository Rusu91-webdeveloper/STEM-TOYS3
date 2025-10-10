#!/bin/bash

# =============================================================================
# DATABASE SAFETY SETUP
# =============================================================================
# This script helps you set up separate local and production databases
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

clear

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              DATABASE SAFETY SETUP WIZARD                        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}This wizard will help you set up safe database configuration.${NC}"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}✗ .env.local not found${NC}"
    echo ""
    echo "Creating .env.local from env.example..."
    if [ -f env.example ]; then
        cp env.example .env.local
        echo -e "${GREEN}✓ .env.local created${NC}"
    else
        echo -e "${RED}✗ env.example not found${NC}"
        exit 1
    fi
fi

# Load current DATABASE_URL
if [ -f .env.local ]; then
    export $(grep DATABASE_URL .env.local | xargs)
fi

echo ""
echo -e "${YELLOW}Current Configuration:${NC}"
echo -e "DATABASE_URL: ${DATABASE_URL:0:50}..."
echo ""

# Ask questions
echo -e "${BLUE}Step 1: What is your PRODUCTION database URL?${NC}"
echo -e "${YELLOW}(This should be from Neon, Railway, or your hosting provider)${NC}"
read -p "Production URL: " PROD_URL

echo ""
echo -e "${BLUE}Step 2: Choose your local development database:${NC}"
echo "  1) Local PostgreSQL (localhost)"
echo "  2) New Neon free database (cloud)"
echo "  3) I'll set it up later"
read -p "Choice [1-3]: " DB_CHOICE

case $DB_CHOICE in
    1)
        echo ""
        echo -e "${YELLOW}Setting up local PostgreSQL...${NC}"
        
        # Check if PostgreSQL is installed
        if command -v psql &> /dev/null; then
            echo -e "${GREEN}✓ PostgreSQL found${NC}"
            
            # Try to create database
            echo "Creating local database 'stemtoys_dev'..."
            createdb stemtoys_dev 2>/dev/null || echo -e "${YELLOW}Database may already exist${NC}"
            
            LOCAL_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
            echo -e "${GREEN}✓ Local database ready${NC}"
        else
            echo -e "${RED}✗ PostgreSQL not installed${NC}"
            echo ""
            echo "Install with:"
            echo "  macOS: brew install postgresql@16"
            echo "  Ubuntu: sudo apt-get install postgresql"
            echo ""
            LOCAL_URL="postgresql://postgres:postgres@localhost:5432/stemtoys_dev"
            echo -e "${YELLOW}⚠️  Install PostgreSQL, then run: createdb stemtoys_dev${NC}"
        fi
        ;;
    2)
        echo ""
        echo -e "${YELLOW}Please create a new database at https://neon.tech${NC}"
        echo ""
        echo "Steps:"
        echo "  1. Go to https://console.neon.tech"
        echo "  2. Click 'New Project'"
        echo "  3. Name it 'stemtoys-dev'"
        echo "  4. Copy the connection string"
        echo ""
        read -p "Paste your new Neon database URL: " LOCAL_URL
        ;;
    3)
        echo ""
        echo -e "${YELLOW}⚠️  You'll need to set DATABASE_URL_LOCAL manually later${NC}"
        LOCAL_URL=""
        ;;
    *)
        echo -e "${RED}✗ Invalid choice${NC}"
        exit 1
        ;;
esac

# Update .env.local
echo ""
echo -e "${YELLOW}Updating .env.local...${NC}"

# Backup current .env.local
cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)

# Update or add variables
if grep -q "DATABASE_URL_PRODUCTION" .env.local; then
    sed -i.bak "s|DATABASE_URL_PRODUCTION=.*|DATABASE_URL_PRODUCTION=$PROD_URL|" .env.local
else
    echo "" >> .env.local
    echo "# Production Database (DO NOT USE IN DEVELOPMENT)" >> .env.local
    echo "DATABASE_URL_PRODUCTION=$PROD_URL" >> .env.local
fi

if [ ! -z "$LOCAL_URL" ]; then
    if grep -q "DATABASE_URL_LOCAL" .env.local; then
        sed -i.bak "s|DATABASE_URL_LOCAL=.*|DATABASE_URL_LOCAL=$LOCAL_URL|" .env.local
    else
        echo "DATABASE_URL_LOCAL=$LOCAL_URL" >> .env.local
    fi
    
    # Update main DATABASE_URL for development
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=$LOCAL_URL|" .env.local
fi

# Ensure NODE_ENV is development
sed -i.bak "s|NODE_ENV=.*|NODE_ENV=development|" .env.local

# Clean up backup files
rm -f .env.local.bak

echo -e "${GREEN}✓ .env.local updated${NC}"

# Summary
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    SETUP COMPLETE!                               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Development: DATABASE_URL_LOCAL"
echo -e "  Production: DATABASE_URL_PRODUCTION"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Backup your production database:"
echo -e "     ${BLUE}npm run backup${NC}"
echo ""
echo -e "  2. Initialize local database:"
echo -e "     ${BLUE}npx prisma migrate deploy${NC}"
echo ""
echo -e "  3. Seed with test data:"
echo -e "     ${BLUE}npm run seed${NC}"
echo ""
echo -e "  4. Check safety before migrations:"
echo -e "     ${BLUE}npm run db:check${NC}"
echo ""
echo -e "${GREEN}Your production data is now protected!${NC}"
echo ""

