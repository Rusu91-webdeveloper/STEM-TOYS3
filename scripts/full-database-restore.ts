#!/usr/bin/env tsx

/**
 * COMPLETE Database Restore Script - TechTots STEM Store
 *
 * This script restores the ENTIRE database from backup, including:
 * - All table schemas (via Prisma migrations)
 * - All data from all tables
 * - Proper restoration order respecting foreign key constraints
 *
 * Generated on: 2025-10-05T16:38:02.921Z
 * Total records: 44
 * Tables with data: 5
 *
 * ⚠️  WARNING: This will REPLACE all existing data!
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import "dotenv/config";

const prisma = new PrismaClient();

// Complete backup data from 2025-10-05
const BACKUP_DATA = {
  "User": [
    {
      "id": "cmgdx24au00001kvqi8dgqsg1",
      "name": "Rusu",
      "email": "rusu.emanuel.webdeveloper@gmail.com",
      "phone": null,
      "password": "$2b$12$gcBFkPT4rgRaMQrLt5DMD.jU7T/kkDQe0a.m6c.U8L.aWddJTqpGC",
      "role": "ADMIN",
      "emailVerified": "2025-10-05T16:28:33.989Z",
      "verificationToken": null,
      "isActive": true,
      "createdAt": "2025-10-05T16:28:33.990Z",
      "updatedAt": "2025-10-05T16:28:33.990Z"
    }
  ],
  "PasswordResetToken": [],
  "Session": [],
  "Address": [],
  "PaymentCard": [],
  "Wishlist": [],
  "Category": [
    {
      "id": "cmgdww3y400001k7sgjj9f1tx",
      "name": "Science",
      "slug": "science",
      "description": "Science toys and educational materials for hands-on learning and discovery",
      "parentId": null,
      "image": null,
      "isActive": true,
      "metadata": {
        "icon": "Science",
        "color": "from-blue-600 to-blue-700",
        "stemCategory": "SCIENCE"
      }
    },
    {
      "id": "cmgdww40k00011k7siov5jjwv",
      "name": "Technology",
      "slug": "technology",
      "description": "Technology toys including coding, electronics, and digital design kits",
      "parentId": null,
      "image": null,
      "isActive": true,
      "metadata": {
        "icon": "Technology",
        "color": "from-green-600 to-green-700",
        "stemCategory": "TECHNOLOGY"
      }
    },
    {
      "id": "cmgdww41t00021k7s2cxkt8ve",
      "name": "Engineering",
      "slug": "engineering",
      "description": "Engineering toys for building, construction, and problem-solving activities",
      "parentId": null,
      "image": null,
      "isActive": true,
      "metadata": {
        "icon": "Engineering",
        "color": "from-yellow-600 to-yellow-700",
        "stemCategory": "ENGINEERING"
      }
    },
    {
      "id": "cmgdww44400041k7sg6bgaff5",
      "name": "Educational Books",
      "slug": "educational-books",
      "description": "Multi-disciplinary STEM toys that combine multiple areas of science, technology, engineering, and mathematics",
      "parentId": null,
      "image": null,
      "isActive": true,
      "metadata": {
        "icon": "Logic",
        "color": "from-indigo-600 via-indigo-700 to-purple-700",
        "stemCategory": "GENERAL"
      }
    },
    {
      "id": "cmgdww42y00031k7seewqkgev",
      "name": "Math",
      "slug": "mathematics",
      "description": "Mathematics toys and games for developing logical thinking and numerical skills",
      "parentId": null,
      "image": null,
      "isActive": true,
      "metadata": {
        "icon": "Math",
        "color": "from-red-600 to-red-700",
        "stemCategory": "MATHEMATICS"
      }
    }
  ],
  "Product": [],
  "MarketingCost": [],
  "ProductCost": [],
  "Review": [],
  "Blog": [],
  "ContentVersion": [],
  "Book": [],
  "DigitalFile": [],
  "Language": [
    {
      "id": "cmgdx24kh00011kvqmbcirmkn",
      "name": "English",
      "code": "en",
      "nativeName": "English",
      "isAvailable": true
    },
    {
      "id": "cmgdx24nd00021kvqnz74j1qg",
      "name": "Romanian",
      "code": "ro",
      "nativeName": "Română",
      "isAvailable": true
    }
  ],
  "DigitalDownload": [],
  "Order": [],
  "OrderItem": [],
  "OrderStatusHistory": [],
  "Return": [],
  "StoreSettings": [],
  "Newsletter": [],
  "Coupon": [],
  "CouponUsage": [],
  "EmailTemplate": [
    {
      "id": "welcome-email",
      "name": "Welcome Email",
      "slug": "welcome",
      "subject": "Bun venit la TechTots STEM Store! 🎉",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Bun venit la TechTots!</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                🎉 Bun venit la TechTots!\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                Jucării STEM pentru Minți Curioase\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut, {{userName}}! 👋\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Mulțumim că te-ai alăturat comunității noastre de entuziaști STEM! \n                Suntem încântați să te avem alături în călătoria de descoperire a științei și tehnologiei.\n            </p>\n            \n            <div style=\"background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;\">\n                <h3 style=\"color: #1e40af; margin: 0 0 10px 0; font-size: 18px;\">\n                    🚀 Ce poți face acum:\n                </h3>\n                <ul style=\"color: #374151; margin: 0; padding-left: 20px;\">\n                    <li>Explorează colecția noastră de jucării STEM</li>\n                    <li>Configurează profilul tău și preferințele</li>\n                    <li>Alătură-te newsletter-ului pentru oferte exclusive</li>\n                    <li>Urmărește-ne pe rețelele sociale</li>\n                </ul>\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{siteUrl}}/products\" \n                   style=\"background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);\">\n                    🛍️ Începe să cumperi\n                </a>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong><br>\n                Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "authentication",
      "isActive": true,
      "metadata": {
        "tags": [
          "welcome",
          "onboarding",
          "authentication"
        ],
        "priority": 1,
        "description": "Email de bun venit pentru utilizatori noi",
        "estimatedOpenRate": 0.85
      },
      "createdAt": "2025-10-05T16:18:27.823Z",
      "updatedAt": "2025-10-05T16:18:27.823Z",
      "createdBy": "system",
      "variables": [
        "userName",
        "siteUrl"
      ]
    },
    {
      "id": "email-verification",
      "name": "Email Verification",
      "slug": "email-verification",
      "subject": "Verifică-ți adresa de email - TechTots",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Verifică-ți email-ul</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                📧 Verifică-ți email-ul\n            </h1>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut, {{userName}}!\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Pentru a finaliza înregistrarea contului tău, te rugăm să verifici adresa de email \n                făcând clic pe butonul de mai jos.\n            </p>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{verificationLink}}\" \n                   style=\"background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);\">\n                    ✅ Verifică email-ul\n                </a>\n            </div>\n            \n            <div style=\"background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <p style=\"margin: 0; color: #92400e; font-size: 14px;\">\n                    <strong>⚠️ Important:</strong> Acest link va expira în 24 de ore din motive de securitate.\n                </p>\n            </div>\n            \n            <p style=\"color: #6b7280; font-size: 14px; margin-top: 30px;\">\n                Dacă butonul nu funcționează, copiază și lipește acest link în browser:<br>\n                <a href=\"{{verificationLink}}\" style=\"color: #3b82f6; word-break: break-all;\">{{verificationLink}}</a>\n            </p>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "authentication",
      "isActive": true,
      "metadata": {
        "tags": [
          "verification",
          "authentication",
          "security"
        ],
        "priority": 1,
        "description": "Email pentru verificarea adresei de email",
        "estimatedOpenRate": 0.75
      },
      "createdAt": "2025-10-05T16:18:27.956Z",
      "updatedAt": "2025-10-05T16:18:27.956Z",
      "createdBy": "system",
      "variables": [
        "userName",
        "verificationLink"
      ]
    },
    {
      "id": "order-confirmation",
      "name": "Order Confirmation",
      "slug": "order-confirmation",
      "subject": "Confirmare comandă #{{order.number}} - TechTots",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Confirmare comandă</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                ✅ Comanda confirmată!\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                Comanda #{{order.number}}\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Mulțumim pentru comandă, {{customerName}}! 🎉\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;\">\n                Am primit comanda ta și o procesăm acum. Vei primi un email de confirmare \n                când comanda va fi expediată.\n            </p>\n            \n            <!-- Order Summary -->\n            <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <h3 style=\"color: #1f2937; margin: 0 0 15px 0; font-size: 18px;\">\n                    📦 Detalii comandă\n                </h3>\n                <div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;\">\n                    <div>\n                        <strong style=\"color: #374151;\">Număr comandă:</strong><br>\n                        <span style=\"color: #1f2937;\">#{{order.number}}</span>\n                    </div>\n                    <div>\n                        <strong style=\"color: #374151;\">Data:</strong><br>\n                        <span style=\"color: #1f2937;\">{{orderDate}}</span>\n                    </div>\n                </div>\n                <div style=\"border-top: 1px solid #e5e7eb; padding-top: 15px;\">\n                    <div style=\"display: flex; justify-content: space-between; align-items: center;\">\n                        <strong style=\"color: #1f2937; font-size: 18px;\">Total:</strong>\n                        <span style=\"color: #1f2937; font-size: 20px; font-weight: 700;\">{{order.total}} RON</span>\n                    </div>\n                </div>\n            </div>\n            \n            <!-- Items -->\n            <div style=\"margin: 20px 0;\">\n                <h3 style=\"color: #1f2937; margin: 0 0 15px 0; font-size: 18px;\">\n                    🛍️ Produse comandate\n                </h3>\n                {{#each items}}\n                <div style=\"border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 10px;\">\n                    <div style=\"display: flex; justify-content: space-between; align-items: center;\">\n                        <div>\n                            <strong style=\"color: #1f2937;\">{{this.name}}</strong><br>\n                            <span style=\"color: #6b7280; font-size: 14px;\">Cantitate: {{this.quantity}}</span>\n                        </div>\n                        <div style=\"text-align: right;\">\n                            <span style=\"color: #1f2937; font-weight: 600;\">{{this.price}} RON</span>\n                        </div>\n                    </div>\n                </div>\n                {{/each}}\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{siteUrl}}/account/orders/{{order.number}}\" \n                   style=\"background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);\">\n                    📋 Vezi comanda\n                </a>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>\n                Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "orders",
      "isActive": true,
      "metadata": {
        "tags": [
          "order",
          "confirmation",
          "ecommerce"
        ],
        "priority": 1,
        "description": "Email de confirmare pentru comenzi",
        "estimatedOpenRate": 0.9
      },
      "createdAt": "2025-10-05T16:18:28.041Z",
      "updatedAt": "2025-10-05T16:18:28.041Z",
      "createdBy": "system",
      "variables": [
        "customerName",
        "order.number",
        "orderDate",
        "order.total",
        "items",
        "siteUrl"
      ]
    },
    {
      "id": "newsletter-welcome",
      "name": "Newsletter Welcome",
      "slug": "newsletter-welcome",
      "subject": "Bun venit în comunitatea TechTots! 🚀",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Newsletter TechTots</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                🚀 Bun venit în comunitatea TechTots!\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                Ultimele noutăți STEM direct în inbox-ul tău\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut! 👋\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Mulțumim că te-ai abonat la newsletter-ul nostru! Ești acum parte din comunitatea \n                de părinți și educatori care își doresc să inspireze dragostea pentru știință și tehnologie.\n            </p>\n            \n            <div style=\"background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;\">\n                <h3 style=\"color: #1e40af; margin: 0 0 15px 0; font-size: 18px;\">\n                    📧 Ce vei primi în newsletter:\n                </h3>\n                <ul style=\"color: #374151; margin: 0; padding-left: 20px;\">\n                    <li>Noutăți despre jucării STEM noi</li>\n                    <li>Ghiduri educaționale pentru părinți</li>\n                    <li>Oferte exclusive și reduceri</li>\n                    <li>Idei de activități științifice pentru acasă</li>\n                    <li>Interviuri cu experți în educație STEM</li>\n                </ul>\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{siteUrl}}/products\" \n                   style=\"background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);\">\n                    🛍️ Explorează produsele\n                </a>\n            </div>\n            \n            <div style=\"background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <p style=\"margin: 0; color: #92400e; font-size: 14px;\">\n                    <strong>💡 Sfat:</strong> Adaugă adresa noastră în lista de contacte pentru a ne asigura \n                    că newsletter-ul ajunge în inbox-ul tău, nu în spam.\n                </p>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>\n                <a href=\"{{unsubscribeUrl}}\" style=\"color: #6b7280; text-decoration: underline;\">Dezabonează-te</a> | \n                <a href=\"{{siteUrl}}/privacy\" style=\"color: #6b7280; text-decoration: underline;\">Politica de confidențialitate</a>\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "marketing",
      "isActive": true,
      "metadata": {
        "tags": [
          "newsletter",
          "welcome",
          "marketing"
        ],
        "priority": 2,
        "description": "Email de bun venit pentru newsletter",
        "estimatedOpenRate": 0.8
      },
      "createdAt": "2025-10-05T16:18:28.131Z",
      "updatedAt": "2025-10-05T16:18:28.131Z",
      "createdBy": "system",
      "variables": [
        "siteUrl",
        "unsubscribeUrl"
      ]
    },
    {
      "id": "password-change-confirmation",
      "name": "Password Change Confirmation",
      "slug": "password-change-confirmation",
      "subject": "Parola a fost schimbată cu succes - TechTots",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Parola schimbată</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                🔒 Parola schimbată cu succes\n            </h1>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut, {{userName}}! 👋\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Parola contului tău TechTots a fost schimbată cu succes la {{changeTime}}.\n            </p>\n            \n            <div style=\"background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;\">\n                <h3 style=\"color: #155724; margin: 0 0 10px 0; font-size: 18px;\">\n                    ✅ Schimbare confirmată\n                </h3>\n                <p style=\"color: #155724; margin: 0;\">\n                    Parola ta a fost actualizată cu succes. Contul tău este sigur.\n                </p>\n            </div>\n            \n            <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <h3 style=\"color: #1f2937; margin: 0 0 15px 0; font-size: 18px;\">\n                    📱 Detalii despre schimbare\n                </h3>\n                <p style=\"color: #374151; margin: 5px 0;\"><strong>Ora:</strong> {{changeTime}}</p>\n                <p style=\"color: #374151; margin: 5px 0;\"><strong>Dispozitiv:</strong> {{deviceInfo}}</p>\n                <p style=\"color: #374151; margin: 5px 0;\"><strong>IP:</strong> {{ipAddress}}</p>\n            </div>\n            \n            <div style=\"background-color: #fff3cd; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <p style=\"margin: 0; color: #92400e; font-size: 14px;\">\n                    <strong>⚠️ Important:</strong> Dacă nu ai făcut această schimbare, te rugăm să ne contactezi imediat la support@techtots.ro\n                </p>\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{siteUrl}}/account\" \n                   style=\"background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);\">\n                    🔐 Accesează contul\n                </a>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>\n                Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "authentication",
      "isActive": true,
      "metadata": {
        "tags": [
          "password",
          "security",
          "authentication"
        ],
        "priority": 1,
        "description": "Confirmare schimbare parolă",
        "estimatedOpenRate": 0.95
      },
      "createdAt": "2025-10-05T16:18:28.219Z",
      "updatedAt": "2025-10-05T16:18:28.219Z",
      "createdBy": "system",
      "variables": [
        "userName",
        "changeTime",
        "deviceInfo",
        "ipAddress",
        "siteUrl"
      ]
    },
    {
      "id": "new-device-login",
      "name": "New Device Login Alert",
      "slug": "new-device-login",
      "subject": "Conectare de pe dispozitiv nou - TechTots",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Conectare dispozitiv nou</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                📱 Conectare de pe dispozitiv nou\n            </h1>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut, {{userName}}! 👋\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Am detectat o conectare la contul tău TechTots de pe un dispozitiv nou la {{loginTime}}.\n            </p>\n            \n            <div style=\"background-color: #fff3cd; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;\">\n                <h3 style=\"color: #856404; margin: 0 0 10px 0; font-size: 18px;\">\n                    🔍 Detalii despre conectare\n                </h3>\n                <p style=\"color: #856404; margin: 5px 0;\"><strong>Ora:</strong> {{loginTime}}</p>\n                <p style=\"color: #856404; margin: 5px 0;\"><strong>Dispozitiv:</strong> {{deviceInfo}}</p>\n                <p style=\"color: #856404; margin: 5px 0;\"><strong>Locație:</strong> {{location}}</p>\n                <p style=\"color: #856404; margin: 5px 0;\"><strong>IP:</strong> {{ipAddress}}</p>\n            </div>\n            \n            <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <h3 style=\"color: #1f2937; margin: 0 0 15px 0; font-size: 18px;\">\n                    ✅ Ești tu?\n                </h3>\n                <p style=\"color: #374151; margin: 0;\">\n                    Dacă ai fost tu care te-ai conectat, nu trebuie să faci nimic. \n                    Dacă nu recunoști această activitate, te rugăm să schimbi parola imediat.\n                </p>\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{siteUrl}}/account/security\" \n                   style=\"background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);\">\n                    🔒 Verifică securitatea\n                </a>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>\n                Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "authentication",
      "isActive": true,
      "metadata": {
        "tags": [
          "security",
          "login",
          "device",
          "authentication"
        ],
        "priority": 1,
        "description": "Alertă conectare dispozitiv nou",
        "estimatedOpenRate": 0.9
      },
      "createdAt": "2025-10-05T16:18:28.307Z",
      "updatedAt": "2025-10-05T16:18:28.307Z",
      "createdBy": "system",
      "variables": [
        "userName",
        "loginTime",
        "deviceInfo",
        "location",
        "ipAddress",
        "siteUrl"
      ]
    },
    {
      "id": "order-processing",
      "name": "Order Processing",
      "slug": "order-processing",
      "subject": "Comanda #{{order.number}} este în procesare - TechTots",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Comanda în procesare</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                ⚙️ Comanda în procesare\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                Comanda #{{order.number}}\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut, {{customerName}}! 👋\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Comanda ta a fost confirmată și este acum în procesare. Echipa noastră se ocupă de pregătirea comenzii pentru expediere.\n            </p>\n            \n            <div style=\"background-color: #e0f2fe; border-left: 4px solid #0288d1; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;\">\n                <h3 style=\"color: #01579b; margin: 0 0 10px 0; font-size: 18px;\">\n                    📦 Statusul comenzii\n                </h3>\n                <p style=\"color: #01579b; margin: 0;\">\n                    <strong>În procesare</strong> - Pregătim produsele pentru expediere\n                </p>\n            </div>\n            \n            <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <h3 style=\"color: #1f2937; margin: 0 0 15px 0; font-size: 18px;\">\n                    📋 Detalii comandă\n                </h3>\n                <div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;\">\n                    <div>\n                        <strong style=\"color: #374151;\">Număr comandă:</strong><br>\n                        <span style=\"color: #1f2937;\">#{{order.number}}</span>\n                    </div>\n                    <div>\n                        <strong style=\"color: #374151;\">Data comenzii:</strong><br>\n                        <span style=\"color: #1f2937;\">{{orderDate}}</span>\n                    </div>\n                </div>\n                <div>\n                    <strong style=\"color: #374151;\">Livrare estimată:</strong><br>\n                    <span style=\"color: #1f2937;\">{{estimatedDelivery}}</span>\n                </div>\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{siteUrl}}/account/orders/{{order.number}}\" \n                   style=\"background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);\">\n                    📋 Urmărește comanda\n                </a>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>\n                Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "orders",
      "isActive": true,
      "metadata": {
        "tags": [
          "order",
          "processing",
          "status"
        ],
        "priority": 1,
        "description": "Notificare comandă în procesare",
        "estimatedOpenRate": 0.85
      },
      "createdAt": "2025-10-05T16:18:28.393Z",
      "updatedAt": "2025-10-05T16:18:28.393Z",
      "createdBy": "system",
      "variables": [
        "customerName",
        "orderNumber",
        "orderDate",
        "estimatedDelivery",
        "siteUrl"
      ]
    },
    {
      "id": "order-shipped",
      "name": "Order Shipped",
      "slug": "order-shipped",
      "subject": "Comanda #{{order.number}} a fost expediată! 🚚",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Comanda expediată</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                🚚 Comanda a fost expediată!\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                Comanda #{{order.number}}\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut, {{customerName}}! 🎉\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Comanda ta a fost expediată cu succes! Produsele sunt pe drum către tine.\n            </p>\n            \n            <div style=\"background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;\">\n                <h3 style=\"color: #155724; margin: 0 0 10px 0; font-size: 18px;\">\n                    📦 Informații despre expediere\n                </h3>\n                <p style=\"color: #155724; margin: 5px 0;\"><strong>Număr de urmărire:</strong> {{trackingNumber}}</p>\n                <p style=\"color: #155724; margin: 5px 0;\"><strong>Curier:</strong> {{carrier}}</p>\n                <p style=\"color: #155724; margin: 5px 0;\"><strong>Data expedierii:</strong> {{shippingDate}}</p>\n            </div>\n            \n            <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <h3 style=\"color: #1f2937; margin: 0 0 15px 0; font-size: 18px;\">\n                    🚚 Urmărește-ți comanda\n                </h3>\n                <p style=\"color: #374151; margin: 0;\">\n                    Folosește numărul de urmărire pentru a vedea unde se află comanda ta în timp real.\n                </p>\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{trackingUrl}}\" \n                   style=\"background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);\">\n                    🚚 Urmărește comanda\n                </a>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>\n                Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "orders",
      "isActive": true,
      "metadata": {
        "tags": [
          "order",
          "shipped",
          "tracking"
        ],
        "priority": 1,
        "description": "Notificare comandă expediată",
        "estimatedOpenRate": 0.9
      },
      "createdAt": "2025-10-05T16:18:28.480Z",
      "updatedAt": "2025-10-05T16:18:28.480Z",
      "createdBy": "system",
      "variables": [
        "customerName",
        "orderNumber",
        "trackingNumber",
        "carrier",
        "shippingDate",
        "trackingUrl"
      ]
    },
    {
      "id": "order-delivered",
      "name": "Order Delivered",
      "slug": "order-delivered",
      "subject": "Comanda #{{order.number}} a fost livrată! 📦",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Comanda livrată</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                📦 Comanda a fost livrată!\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                Comanda #{{order.number}}\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut, {{customerName}}! 🎉\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Comanda ta a fost livrată cu succes! Sperăm că te vei bucura de produsele comandate.\n            </p>\n            \n            <div style=\"background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;\">\n                <h3 style=\"color: #155724; margin: 0 0 10px 0; font-size: 18px;\">\n                    ✅ Livrare confirmată\n                </h3>\n                <p style=\"color: #155724; margin: 5px 0;\"><strong>Data livrării:</strong> {{deliveryDate}}</p>\n                <p style=\"color: #155724; margin: 5px 0;\"><strong>Status:</strong> Livrat cu succes</p>\n            </div>\n            \n            <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <h3 style=\"color: #1f2937; margin: 0 0 15px 0; font-size: 18px;\">\n                    ⭐ Evaluează-ți experiența\n                </h3>\n                <p style=\"color: #374151; margin: 0;\">\n                    Ne-ar face plăcere să știm cum ți-a plăcut comanda! Evaluează produsele și experiența ta de cumpărare.\n                </p>\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{reviewUrl}}\" \n                   style=\"background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);\">\n                    ⭐ Evaluează comanda\n                </a>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>\n                Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "orders",
      "isActive": true,
      "metadata": {
        "tags": [
          "order",
          "delivered",
          "review"
        ],
        "priority": 1,
        "description": "Notificare comandă livrată",
        "estimatedOpenRate": 0.85
      },
      "createdAt": "2025-10-05T16:18:28.570Z",
      "updatedAt": "2025-10-05T16:18:28.570Z",
      "createdBy": "system",
      "variables": [
        "customerName",
        "orderNumber",
        "deliveryDate",
        "reviewUrl",
        "siteUrl"
      ]
    },
    {
      "id": "order-cancelled",
      "name": "Order Cancelled",
      "slug": "order-cancelled",
      "subject": "Comanda #{{order.number}} a fost anulată - TechTots",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Comanda anulată</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                ❌ Comanda a fost anulată\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                Comanda #{{order.number}}\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut, {{customerName}}! 👋\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Comanda ta a fost anulată. Înțelegem că poate fi dezamăgitor și ne cerem scuze pentru orice inconveniență.\n            </p>\n            \n            <div style=\"background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;\">\n                <h3 style=\"color: #721c24; margin: 0 0 10px 0; font-size: 18px;\">\n                    📋 Detalii despre anulare\n                </h3>\n                <p style=\"color: #721c24; margin: 5px 0;\"><strong>Motivul anulării:</strong> {{cancellationReason}}</p>\n                <p style=\"color: #721c24; margin: 5px 0;\"><strong>Data anulării:</strong> {{cancellationDate}}</p>\n            </div>\n            \n            <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <h3 style=\"color: #1f2937; margin: 0 0 15px 0; font-size: 18px;\">\n                    💰 Informații despre rambursare\n                </h3>\n                <p style=\"color: #374151; margin: 0;\">\n                    {{refundInfo}} Dacă ai întrebări despre rambursare, te rugăm să ne contactezi.\n                </p>\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{siteUrl}}/products\" \n                   style=\"background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);\">\n                    🛍️ Explorează produsele\n                </a>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>\n                Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "orders",
      "isActive": true,
      "metadata": {
        "tags": [
          "order",
          "cancelled",
          "refund"
        ],
        "priority": 1,
        "description": "Notificare comandă anulată",
        "estimatedOpenRate": 0.9
      },
      "createdAt": "2025-10-05T16:18:28.656Z",
      "updatedAt": "2025-10-05T16:18:28.656Z",
      "createdBy": "system",
      "variables": [
        "customerName",
        "orderNumber",
        "cancellationReason",
        "cancellationDate",
        "refundInfo",
        "siteUrl"
      ]
    },
    {
      "id": "order-failed",
      "name": "Order Failed",
      "slug": "order-failed",
      "subject": "Probleme cu comanda #{{order.number}} - TechTots",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Comanda eșuată</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                ⚠️ Problema cu comanda\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                Comanda #{{order.number}}\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut, {{customerName}}! 👋\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Ne pare rău să te anunțăm că a apărut o problemă cu comanda ta. Echipa noastră lucrează pentru a rezolva situația.\n            </p>\n            \n            <div style=\"background-color: #fff3cd; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;\">\n                <h3 style=\"color: #856404; margin: 0 0 10px 0; font-size: 18px;\">\n                    🔍 Detalii despre problemă\n                </h3>\n                <p style=\"color: #856404; margin: 5px 0;\"><strong>Motivul:</strong> {{failureReason}}</p>\n                <p style=\"color: #856404; margin: 5px 0;\"><strong>Data detectării:</strong> {{failureDate}}</p>\n            </div>\n            \n            <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <h3 style=\"color: #1f2937; margin: 0 0 15px 0; font-size: 18px;\">\n                    🛠️ Ce facem acum\n                </h3>\n                <p style=\"color: #374151; margin: 0;\">\n                    Echipa noastră lucrează pentru a rezolva problema. Te vom contacta în cel mai scurt timp posibil cu o soluție.\n                </p>\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{retryUrl}}\" \n                   style=\"background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);\">\n                    🔄 Încearcă din nou\n                </a>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>\n                Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "orders",
      "isActive": true,
      "metadata": {
        "tags": [
          "order",
          "failed",
          "error"
        ],
        "priority": 1,
        "description": "Notificare comandă eșuată",
        "estimatedOpenRate": 0.95
      },
      "createdAt": "2025-10-05T16:18:28.741Z",
      "updatedAt": "2025-10-05T16:18:28.741Z",
      "createdBy": "system",
      "variables": [
        "customerName",
        "orderNumber",
        "failureReason",
        "failureDate",
        "retryUrl",
        "siteUrl"
      ]
    },
    {
      "id": "blog-post-notification",
      "name": "Blog Post Notification",
      "slug": "blog-post-notification",
      "subject": "Nou articol: {{blogTitle}} - TechTots",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Nou articol TechTots</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                📝 Nou articol pe blog\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                Descoperă ultimele noutăți STEM\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut, {{subscriberName}}! 👋\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Am publicat un nou articol pe blogul nostru și am vrut să îl împărtășim cu tine!\n            </p>\n            \n            <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;\">\n                <h3 style=\"color: #1f2937; margin: 0 0 15px 0; font-size: 20px;\">\n                    {{blogTitle}}\n                </h3>\n                <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin: 0;\">\n                    {{blogExcerpt}}\n                </p>\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{blogUrl}}\" \n                   style=\"background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);\">\n                    📖 Citește articolul\n                </a>\n            </div>\n            \n            <div style=\"background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;\">\n                <h3 style=\"color: #1e40af; margin: 0 0 10px 0; font-size: 18px;\">\n                    💡 De ce să citești?\n                </h3>\n                <ul style=\"color: #374151; margin: 0; padding-left: 20px;\">\n                    <li>Ghiduri practice pentru părinți</li>\n                    <li>Idei de activități STEM pentru acasă</li>\n                    <li>Noutăți despre educația științifică</li>\n                    <li>Interviuri cu experți în domeniu</li>\n                </ul>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>\n                <a href=\"{{unsubscribeUrl}}\" style=\"color: #6b7280; text-decoration: underline;\">Dezabonează-te</a> | \n                <a href=\"{{siteUrl}}/privacy\" style=\"color: #6b7280; text-decoration: underline;\">Politica de confidențialitate</a>\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "marketing",
      "isActive": true,
      "metadata": {
        "tags": [
          "blog",
          "newsletter",
          "content"
        ],
        "priority": 2,
        "description": "Notificare articol nou pe blog",
        "estimatedOpenRate": 0.75
      },
      "createdAt": "2025-10-05T16:18:28.827Z",
      "updatedAt": "2025-10-05T16:18:28.827Z",
      "createdBy": "system",
      "variables": [
        "subscriberName",
        "blogTitle",
        "blogExcerpt",
        "blogUrl",
        "unsubscribeUrl",
        "siteUrl"
      ]
    },
    {
      "id": "coupon-distribution",
      "name": "Coupon Distribution",
      "slug": "coupon-distribution",
      "subject": "🎁 Ofertă specială pentru tine! {{discountAmount}} reducere - TechTots",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Ofertă specială TechTots</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                🎁 Ofertă specială!\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                {{discountAmount}} reducere pentru tine\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut, {{customerName}}! 👋\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Am pregătit o ofertă specială doar pentru tine! Folosește codul de reducere de mai jos pentru a economisi la următoarea ta comandă.\n            </p>\n            \n            <div style=\"background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center;\">\n                <h3 style=\"color: white; margin: 0 0 15px 0; font-size: 24px;\">\n                    🎫 Codul tău de reducere\n                </h3>\n                <div style=\"background: white; border-radius: 8px; padding: 20px; margin: 15px 0;\">\n                    <span style=\"color: #1f2937; font-size: 32px; font-weight: 700; letter-spacing: 2px;\">{{couponCode}}</span>\n                </div>\n                <p style=\"color: white; margin: 10px 0 0 0; font-size: 16px;\">\n                    Valabil până la {{expiryDate}}\n                </p>\n            </div>\n            \n            <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <h3 style=\"color: #1f2937; margin: 0 0 15px 0; font-size: 18px;\">\n                    🛍️ Cum să folosești codul\n                </h3>\n                <ol style=\"color: #374151; margin: 0; padding-left: 20px;\">\n                    <li>Adaugă produsele dorite în coș</li>\n                    <li>La finalizarea comenzii, introdu codul {{couponCode}}</li>\n                    <li>Reducerea se va aplica automat</li>\n                    <li>Finalizează comanda și bucură-te de economii!</li>\n                </ol>\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{siteUrl}}/products\" \n                   style=\"background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);\">\n                    🛒 Cumpără acum\n                </a>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>\n                <a href=\"{{unsubscribeUrl}}\" style=\"color: #6b7280; text-decoration: underline;\">Dezabonează-te</a> | \n                <a href=\"{{siteUrl}}/privacy\" style=\"color: #6b7280; text-decoration: underline;\">Politica de confidențialitate</a>\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "marketing",
      "isActive": true,
      "metadata": {
        "tags": [
          "coupon",
          "promotion",
          "discount"
        ],
        "priority": 2,
        "description": "Distribuție cupoane de reducere",
        "estimatedOpenRate": 0.8
      },
      "createdAt": "2025-10-05T16:18:28.914Z",
      "updatedAt": "2025-10-05T16:18:28.914Z",
      "createdBy": "system",
      "variables": [
        "customerName",
        "couponCode",
        "discountAmount",
        "expiryDate",
        "siteUrl",
        "unsubscribeUrl"
      ]
    },
    {
      "id": "flash-sale-alert",
      "name": "Flash Sale Alert",
      "slug": "flash-sale-alert",
      "subject": "⚡ Vânzare flash! {{saleTitle}} - TechTots",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Vânzare flash TechTots</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                ⚡ VÂNZARE FLASH!\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                {{saleTitle}}\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut, {{customerName}}! 🚨\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Oferte incredibile pentru o perioadă limitată! Nu rata această oportunitate unică de a economisi la jucăriile STEM preferate.\n            </p>\n            \n            <div style=\"background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center;\">\n                <h3 style=\"color: white; margin: 0 0 15px 0; font-size: 24px;\">\n                    🔥 {{discountPercent}}% REDUCERE\n                </h3>\n                <p style=\"color: white; margin: 10px 0 0 0; font-size: 18px;\">\n                    Valabil până la {{saleEndTime}}\n                </p>\n            </div>\n            \n            <div style=\"background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;\">\n                <h3 style=\"color: #991b1b; margin: 0 0 10px 0; font-size: 18px;\">\n                    ⏰ Atenție! Timp limitat\n                </h3>\n                <p style=\"color: #991b1b; margin: 0;\">\n                    Această ofertă expiră în curând! Grăbește-te să nu ratezi șansa de a economisi.\n                </p>\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{siteUrl}}/products\" \n                   style=\"background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);\">\n                    ⚡ Cumpără acum\n                </a>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>\n                <a href=\"{{unsubscribeUrl}}\" style=\"color: #6b7280; text-decoration: underline;\">Dezabonează-te</a> | \n                <a href=\"{{siteUrl}}/privacy\" style=\"color: #6b7280; text-decoration: underline;\">Politica de confidențialitate</a>\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "marketing",
      "isActive": true,
      "metadata": {
        "tags": [
          "flash-sale",
          "promotion",
          "urgent"
        ],
        "priority": 1,
        "description": "Alertă vânzare flash",
        "estimatedOpenRate": 0.85
      },
      "createdAt": "2025-10-05T16:18:29.009Z",
      "updatedAt": "2025-10-05T16:18:29.009Z",
      "createdBy": "system",
      "variables": [
        "customerName",
        "saleTitle",
        "discountPercent",
        "saleEndTime",
        "siteUrl",
        "unsubscribeUrl"
      ]
    },
    {
      "id": "supplier-registration-confirmation",
      "name": "Supplier Registration Confirmation",
      "slug": "supplier-registration-confirmation",
      "subject": "Confirmare înregistrare furnizor - TechTots",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Confirmare înregistrare furnizor</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                🏢 Confirmare înregistrare furnizor\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                {{companyName}}\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut, {{contactPersonName}}! 👋\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Mulțumim pentru înregistrarea ca furnizor la TechTots! Am primit cererea ta și o analizăm.\n            </p>\n            \n            <div style=\"background-color: #e0f2fe; border-left: 4px solid #0288d1; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;\">\n                <h3 style=\"color: #01579b; margin: 0 0 10px 0; font-size: 18px;\">\n                    📋 Următorii pași\n                </h3>\n                <ul style=\"color: #01579b; margin: 0; padding-left: 20px;\">\n                    <li>Verificăm documentele încărcate</li>\n                    <li>Analizăm profilul companiei</li>\n                    <li>Contactăm pentru întrebări suplimentare (dacă este necesar)</li>\n                    <li>Te notificăm despre decizia de aprobare</li>\n                </ul>\n            </div>\n            \n            <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <h3 style=\"color: #1f2937; margin: 0 0 15px 0; font-size: 18px;\">\n                    📊 Detalii înregistrare\n                </h3>\n                <p style=\"color: #374151; margin: 5px 0;\"><strong>Companie:</strong> {{companyName}}</p>\n                <p style=\"color: #374151; margin: 5px 0;\"><strong>Persoană de contact:</strong> {{contactPersonName}}</p>\n                <p style=\"color: #374151; margin: 5px 0;\"><strong>Email:</strong> {{contactPersonEmail}}</p>\n                <p style=\"color: #374151; margin: 5px 0;\"><strong>Data înregistrării:</strong> {{registrationDate}}</p>\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{siteUrl}}/supplier/dashboard\" \n                   style=\"background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);\">\n                    📊 Accesează dashboard-ul\n                </a>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>\n                Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "suppliers",
      "isActive": true,
      "metadata": {
        "tags": [
          "supplier",
          "registration",
          "confirmation"
        ],
        "priority": 1,
        "description": "Confirmare înregistrare furnizor",
        "estimatedOpenRate": 0.9
      },
      "createdAt": "2025-10-05T16:18:29.096Z",
      "updatedAt": "2025-10-05T16:18:29.096Z",
      "createdBy": "system",
      "variables": [
        "companyName",
        "contactPersonName",
        "contactPersonEmail",
        "registrationDate",
        "siteUrl"
      ]
    },
    {
      "id": "supplier-approval",
      "name": "Supplier Approval",
      "slug": "supplier-approval",
      "subject": "Felicitări! Contul de furnizor a fost aprobat - TechTots",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Furnizor aprobat</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                🎉 Felicitări! Ești aprobat!\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                {{companyName}} este acum furnizor TechTots\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut, {{contactPersonName}}! 🚀\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Suntem încântați să te anunțăm că {{companyName}} a fost aprobat ca furnizor oficial TechTots! \n                Acum poți începe să adaugi produse și să construiești afacerea ta cu noi.\n            </p>\n            \n            <div style=\"background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;\">\n                <h3 style=\"color: #155724; margin: 0 0 10px 0; font-size: 18px;\">\n                    ✅ Ce poți face acum\n                </h3>\n                <ul style=\"color: #155724; margin: 0; padding-left: 20px;\">\n                    <li>Adaugă produse în catalogul tău</li>\n                    <li>Configurează prețurile și stocurile</li>\n                    <li>Urmărește comenzile și vânzările</li>\n                    <li>Accesează rapoartele de performanță</li>\n                </ul>\n            </div>\n            \n            <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <h3 style=\"color: #1f2937; margin: 0 0 15px 0; font-size: 18px;\">\n                    📊 Detalii cont\n                </h3>\n                <p style=\"color: #374151; margin: 5px 0;\"><strong>Companie:</strong> {{companyName}}</p>\n                <p style=\"color: #374151; margin: 5px 0;\"><strong>Comision:</strong> {{commissionRate}}%</p>\n                <p style=\"color: #374151; margin: 5px 0;\"><strong>Termeni de plată:</strong> {{paymentTerms}} zile</p>\n                <p style=\"color: #374151; margin: 5px 0;\"><strong>Valoare minimă comandă:</strong> {{minimumOrderValue}} RON</p>\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{siteUrl}}/supplier/dashboard\" \n                   style=\"background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);\">\n                    🚀 Începe să adaugi produse\n                </a>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>\n                Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "suppliers",
      "isActive": true,
      "metadata": {
        "tags": [
          "supplier",
          "approval",
          "success"
        ],
        "priority": 1,
        "description": "Notificare aprobare furnizor",
        "estimatedOpenRate": 0.95
      },
      "createdAt": "2025-10-05T16:18:29.181Z",
      "updatedAt": "2025-10-05T16:18:29.181Z",
      "createdBy": "system",
      "variables": [
        "companyName",
        "contactPersonName",
        "commissionRate",
        "paymentTerms",
        "minimumOrderValue",
        "siteUrl"
      ]
    },
    {
      "id": "supplier-rejection",
      "name": "Supplier Rejection",
      "slug": "supplier-rejection",
      "subject": "Decizie privind cererea de furnizor - TechTots",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Cerere furnizor respinsă</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                📋 Decizie privind cererea\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                {{companyName}}\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut, {{contactPersonName}}! 👋\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Mulțumim pentru interesul arătat față de parteneriatul cu TechTots. \n                După o analiză atentă, am luat decizia să nu aprobăm cererea de furnizor în acest moment.\n            </p>\n            \n            <div style=\"background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;\">\n                <h3 style=\"color: #721c24; margin: 0 0 10px 0; font-size: 18px;\">\n                    📝 Motivele deciziei\n                </h3>\n                <p style=\"color: #721c24; margin: 0;\">{{rejectionReason}}</p>\n            </div>\n            \n            <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <h3 style=\"color: #1f2937; margin: 0 0 15px 0; font-size: 18px;\">\n                    🔄 Ce poți face în viitor\n                </h3>\n                <ul style=\"color: #374151; margin: 0; padding-left: 20px;\">\n                    <li>Îmbunătățește profilul companiei</li>\n                    <li>Completează documentația lipsă</li>\n                    <li>Contactează-ne pentru clarificări</li>\n                    <li>Reîncearcă după 6 luni</li>\n                </ul>\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{siteUrl}}/contact\" \n                   style=\"background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);\">\n                    💬 Contactează-ne\n                </a>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>\n                Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "suppliers",
      "isActive": true,
      "metadata": {
        "tags": [
          "supplier",
          "rejection",
          "feedback"
        ],
        "priority": 1,
        "description": "Notificare respingere furnizor",
        "estimatedOpenRate": 0.9
      },
      "createdAt": "2025-10-05T16:18:29.264Z",
      "updatedAt": "2025-10-05T16:18:29.264Z",
      "createdBy": "system",
      "variables": [
        "companyName",
        "contactPersonName",
        "rejectionReason",
        "siteUrl"
      ]
    },
    {
      "id": "admin-new-order",
      "name": "Admin New Order Notification",
      "slug": "admin-new-order",
      "subject": "🛒 Comandă nouă #{{order.number}} - TechTots Admin",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Comandă nouă - Admin</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                🛒 Comandă nouă\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                Comanda #{{order.number}}\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Notificare comandă nouă! 📦\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                A fost plasată o comandă nouă pe platforma TechTots. Detaliile comenzii sunt prezentate mai jos.\n            </p>\n            \n            <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <h3 style=\"color: #1f2937; margin: 0 0 15px 0; font-size: 18px;\">\n                    📋 Detalii comandă\n                </h3>\n                <div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;\">\n                    <div>\n                        <strong style=\"color: #374151;\">Număr comandă:</strong><br>\n                        <span style=\"color: #1f2937;\">#{{order.number}}</span>\n                    </div>\n                    <div>\n                        <strong style=\"color: #374151;\">Client:</strong><br>\n                        <span style=\"color: #1f2937;\">{{customerName}}</span>\n                    </div>\n                    <div>\n                        <strong style=\"color: #374151;\">Email client:</strong><br>\n                        <span style=\"color: #1f2937;\">{{customerEmail}}</span>\n                    </div>\n                    <div>\n                        <strong style=\"color: #374151;\">Total:</strong><br>\n                        <span style=\"color: #1f2937; font-weight: 700;\">{{order.total}} RON</span>\n                    </div>\n                </div>\n            </div>\n            \n            <div style=\"background-color: #e0f2fe; border-left: 4px solid #0288d1; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;\">\n                <h3 style=\"color: #01579b; margin: 0 0 10px 0; font-size: 18px;\">\n                    🛍️ Produse comandate\n                </h3>\n                {{#each orderItems}}\n                <div style=\"border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 10px;\">\n                    <div style=\"display: flex; justify-content: space-between; align-items: center;\">\n                        <div>\n                            <strong style=\"color: #1f2937;\">{{this.name}}</strong><br>\n                            <span style=\"color: #6b7280; font-size: 14px;\">Cantitate: {{this.quantity}}</span>\n                        </div>\n                        <div style=\"text-align: right;\">\n                            <span style=\"color: #1f2937; font-weight: 600;\">{{this.price}} RON</span>\n                        </div>\n                    </div>\n                </div>\n                {{/each}}\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{adminUrl}}/orders/{{order.number}}\" \n                   style=\"background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);\">\n                    📊 Vezi comanda în admin\n                </a>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Admin Panel<br>\n                Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "admin",
      "isActive": true,
      "metadata": {
        "tags": [
          "admin",
          "order",
          "notification"
        ],
        "priority": 1,
        "description": "Notificare comandă nouă pentru admin",
        "estimatedOpenRate": 0.95
      },
      "createdAt": "2025-10-05T16:18:29.351Z",
      "updatedAt": "2025-10-05T16:18:29.351Z",
      "createdBy": "system",
      "variables": [
        "order.number",
        "customerName",
        "customerEmail",
        "order.total",
        "orderItems",
        "adminUrl"
      ]
    },
    {
      "id": "admin-high-value-order",
      "name": "Admin High Value Order Notification",
      "slug": "admin-high-value-order",
      "subject": "💰 Comandă de valoare mare #{{order.number}} - TechTots Admin",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Comandă de valoare mare - Admin</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                💰 Comandă de valoare mare!\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                Comanda #{{order.number}} - {{order.total}} RON\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Atenție! Comandă de valoare mare! 🚨\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                A fost plasată o comandă cu valoare mare pe platforma TechTots. Această comandă necesită atenție specială.\n            </p>\n            \n            <div style=\"background-color: #fff3cd; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;\">\n                <h3 style=\"color: #856404; margin: 0 0 10px 0; font-size: 18px;\">\n                    ⚠️ Acțiuni recomandate\n                </h3>\n                <ul style=\"color: #856404; margin: 0; padding-left: 20px;\">\n                    <li>Verifică disponibilitatea produselor</li>\n                    <li>Contactează clientul pentru confirmare</li>\n                    <li>Pregătește ambalarea specială</li>\n                    <li>Planifică livrarea cu asigurare</li>\n                </ul>\n            </div>\n            \n            <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <h3 style=\"color: #1f2937; margin: 0 0 15px 0; font-size: 18px;\">\n                    📊 Detalii comandă\n                </h3>\n                <div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;\">\n                    <div>\n                        <strong style=\"color: #374151;\">Număr comandă:</strong><br>\n                        <span style=\"color: #1f2937;\">#{{order.number}}</span>\n                    </div>\n                    <div>\n                        <strong style=\"color: #374151;\">Client:</strong><br>\n                        <span style=\"color: #1f2937;\">{{customerName}}</span>\n                    </div>\n                    <div>\n                        <strong style=\"color: #374151;\">Email client:</strong><br>\n                        <span style=\"color: #1f2937;\">{{customerEmail}}</span>\n                    </div>\n                    <div>\n                        <strong style=\"color: #374151;\">Total:</strong><br>\n                        <span style=\"color: #1f2937; font-weight: 700; font-size: 18px;\">{{order.total}} RON</span>\n                    </div>\n                </div>\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{adminUrl}}/orders/{{order.number}}\" \n                   style=\"background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);\">\n                    📊 Vezi comanda în admin\n                </a>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Admin Panel<br>\n                Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "admin",
      "isActive": true,
      "metadata": {
        "tags": [
          "admin",
          "high-value",
          "order",
          "priority"
        ],
        "priority": 1,
        "description": "Notificare comandă de valoare mare pentru admin",
        "estimatedOpenRate": 0.98
      },
      "createdAt": "2025-10-05T16:18:29.437Z",
      "updatedAt": "2025-10-05T16:18:29.437Z",
      "createdBy": "system",
      "variables": [
        "order.number",
        "customerName",
        "customerEmail",
        "order.total",
        "adminUrl"
      ]
    },
    {
      "id": "return-request-confirmation",
      "name": "Return Request Confirmation",
      "slug": "return-request-confirmation",
      "subject": "Confirmare cerere de returnare #{{returnId}} - TechTots",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Confirmare cerere returnare</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                🔄 Cerere de returnare confirmată\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                Cerere #{{returnId}}\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut, {{customerName}}! 👋\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Am primit cererea ta de returnare și o procesăm. Vei primi o notificare când cererea va fi aprobată.\n            </p>\n            \n            <div style=\"background-color: #e0f2fe; border-left: 4px solid #0288d1; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;\">\n                <h3 style=\"color: #01579b; margin: 0 0 10px 0; font-size: 18px;\">\n                    📋 Detalii cerere\n                </h3>\n                <p style=\"color: #01579b; margin: 5px 0;\"><strong>Număr cerere:</strong> #{{returnId}}</p>\n                <p style=\"color: #01579b; margin: 5px 0;\"><strong>Comanda:</strong> #{{order.number}}</p>\n                <p style=\"color: #01579b; margin: 5px 0;\"><strong>Motivul:</strong> {{reason}}</p>\n                <p style=\"color: #01579b; margin: 5px 0;\"><strong>Data:</strong> {{requestDate}}</p>\n            </div>\n            \n            <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <h3 style=\"color: #1f2937; margin: 0 0 15px 0; font-size: 18px;\">\n                    📦 Următorii pași\n                </h3>\n                <ol style=\"color: #374151; margin: 0; padding-left: 20px;\">\n                    <li>Analizăm cererea (1-2 zile lucrătoare)</li>\n                    <li>Te notificăm despre aprobare/respingere</li>\n                    <li>Dacă este aprobată, primești instrucțiuni de returnare</li>\n                    <li>Procesăm rambursarea după primirea produsului</li>\n                </ol>\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{siteUrl}}/account/returns/{{returnId}}\" \n                   style=\"background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);\">\n                    📋 Vezi cererea\n                </a>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>\n                Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "returns",
      "isActive": true,
      "metadata": {
        "tags": [
          "return",
          "confirmation",
          "customer"
        ],
        "priority": 1,
        "description": "Confirmare cerere de returnare",
        "estimatedOpenRate": 0.9
      },
      "createdAt": "2025-10-05T16:18:29.525Z",
      "updatedAt": "2025-10-05T16:18:29.525Z",
      "createdBy": "system",
      "variables": [
        "customerName",
        "returnId",
        "order.number",
        "reason",
        "requestDate",
        "siteUrl"
      ]
    },
    {
      "id": "digital-product-delivery",
      "name": "Digital Product Delivery",
      "slug": "digital-product-delivery",
      "subject": "📚 Produsul digital este gata! - TechTots",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Produs digital livrat</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                📚 Produsul digital este gata!\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                {{productName}}\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut, {{customerName}}! 🎉\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Produsul digital pe care l-ai comandat este gata pentru descărcare! Poți accesa conținutul folosind linkurile de mai jos.\n            </p>\n            \n            <div style=\"background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;\">\n                <h3 style=\"color: #1e40af; margin: 0 0 10px 0; font-size: 18px;\">\n                    📖 Detalii produs\n                </h3>\n                <p style=\"color: #1e40af; margin: 5px 0;\"><strong>Nume:</strong> {{productName}}</p>\n                <p style=\"color: #1e40af; margin: 5px 0;\"><strong>Autor:</strong> {{author}}</p>\n                <p style=\"color: #1e40af; margin: 5px 0;\"><strong>Format:</strong> {{format}}</p>\n                <p style=\"color: #1e40af; margin: 5px 0;\"><strong>Mărime:</strong> {{fileSize}}</p>\n            </div>\n            \n            <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <h3 style=\"color: #1f2937; margin: 0 0 15px 0; font-size: 18px;\">\n                    🔗 Linkuri de descărcare\n                </h3>\n                {{#each downloadLinks}}\n                <div style=\"border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 10px;\">\n                    <div style=\"display: flex; justify-content: space-between; align-items: center;\">\n                        <div>\n                            <strong style=\"color: #1f2937;\">{{format}}</strong><br>\n                            <span style=\"color: #6b7280; font-size: 14px;\">{{language}}</span>\n                        </div>\n                        <div>\n                            <a href=\"{{url}}\" \n                               style=\"background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;\">\n                                📥 Descarcă\n                            </a>\n                        </div>\n                    </div>\n                </div>\n                {{/each}}\n            </div>\n            \n            <div style=\"background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <p style=\"margin: 0; color: #92400e; font-size: 14px;\">\n                    <strong>⚠️ Important:</strong> Linkurile de descărcare expiră în {{expiryDays}} zile. \n                    Descarcă produsul cât mai curând posibil.\n                </p>\n            </div>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{siteUrl}}/account/digital-library\" \n                   style=\"background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);\">\n                    📚 Biblioteca digitală\n                </a>\n            </div>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>\n                Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "digital",
      "isActive": true,
      "metadata": {
        "tags": [
          "digital",
          "download",
          "ebook",
          "delivery"
        ],
        "priority": 1,
        "description": "Livrare produs digital",
        "estimatedOpenRate": 0.95
      },
      "createdAt": "2025-10-05T16:18:29.611Z",
      "updatedAt": "2025-10-05T16:18:29.611Z",
      "createdBy": "system",
      "variables": [
        "customerName",
        "productName",
        "author",
        "format",
        "fileSize",
        "downloadLinks",
        "expiryDays",
        "siteUrl"
      ]
    },
    {
      "id": "password-reset",
      "name": "Password Reset",
      "slug": "password-reset",
      "subject": "Resetare parolă - TechTots",
      "content": "\n<!DOCTYPE html>\n<html lang=\"ro\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Resetare parolă</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff;\">\n        <!-- Header -->\n        <div style=\"background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 20px; text-align: center;\">\n            <h1 style=\"color: white; margin: 0; font-size: 28px; font-weight: 700;\">\n                🔒 Resetare parolă\n            </h1>\n            <p style=\"color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;\">\n                TechTots STEM Store\n            </p>\n        </div>\n        \n        <!-- Content -->\n        <div style=\"padding: 40px 20px;\">\n            <h2 style=\"color: #1f2937; margin: 0 0 20px 0; font-size: 24px;\">\n                Salut! 👋\n            </h2>\n            \n            <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;\">\n                Am primit o cerere de resetare a parolei pentru contul tău TechTots. \n                Dacă ai făcut această cerere, fă clic pe butonul de mai jos pentru a reseta parola.\n            </p>\n            \n            <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{resetLink}}\" \n                   style=\"background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);\">\n                    🔑 Resetează parola\n                </a>\n            </div>\n            \n            <div style=\"background-color: #f8d7da; border: 1px solid #dc3545; border-radius: 8px; padding: 20px; margin: 20px 0;\">\n                <p style=\"margin: 0; color: #721c24; font-size: 14px;\">\n                    <strong>⚠️ Important:</strong> Acest link va expira în 1 oră din motive de securitate. \n                    Dacă nu ai cerut resetarea parolei, ignoră acest email.\n                </p>\n            </div>\n            \n            <p style=\"color: #6b7280; font-size: 14px; margin-top: 30px;\">\n                Dacă butonul nu funcționează, copiază și lipește acest link în browser:<br>\n                <a href=\"{{resetLink}}\" style=\"color: #3b82f6; word-break: break-all;\">{{resetLink}}</a>\n            </p>\n        </div>\n        \n        <!-- Footer -->\n        <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;\">\n            <p style=\"margin: 0; color: #6b7280; font-size: 14px;\">\n                <strong>TechTots STEM Store</strong> - Jucării STEM pentru Minți Curioase<br>\n                Mehedinti 54-56, Cluj-Napoca, Cluj | +40 771 248 029\n            </p>\n        </div>\n    </div>\n</body>\n</html>",
      "category": "authentication",
      "isActive": true,
      "metadata": {
        "tags": [
          "password",
          "reset",
          "security",
          "authentication"
        ],
        "priority": 1,
        "description": "Email pentru resetarea parolei",
        "estimatedOpenRate": 0.8
      },
      "createdAt": "2025-10-05T16:18:29.698Z",
      "updatedAt": "2025-10-05T16:18:29.698Z",
      "createdBy": "system",
      "variables": [
        "resetLink"
      ]
    }
  ],
  "EmailLog": [],
  "EmailCampaign": [],
  "EmailEvent": [],
  "EmailSequence": [],
  "EmailSequenceStep": [],
  "EmailSequenceUser": [],
  "ConversionLog": [
    {
      "id": "cmgdmpnrp0001ib04f6qeb55y",
      "conversionId": "conv_1759664326416_9vvsniatk",
      "type": "scroll",
      "category": "engagement",
      "action": "scroll_90%",
      "elementData": {
        "text": "Page scroll",
        "tagName": "body"
      },
      "pageData": {
        "url": "https://www.techtots.ro/categories",
        "title": "",
        "referrer": "https://l.instagram.com/"
      },
      "userData": {
        "sessionId": "session_1759664313176_0k7hc2mzu",
        "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G100 Instagram 400.1.0.29.75 (iPhone14,2; iOS 18_6_2; en_GB; en-GB; scale=3.00; 1170x2532; IABMV/1; 799622199) NW/3",
        "isAuthenticated": false
      },
      "contextData": {
        "timeOnPage": 20661,
        "scrollDepth": 90,
        "previousActions": [
          "personalized_recommendations",
          "cta",
          "scroll_25%",
          "scroll_50%",
          "scroll_75%"
        ]
      },
      "metadata": {
        "scrollDepth": 90,
        "trackingMethod": "auto"
      },
      "timestamp": "2025-10-05T11:38:46.416Z",
      "createdAt": "2025-10-05T11:38:56.533Z"
    },
    {
      "id": "cmgdmpnx90002ib04kwe5fp17",
      "conversionId": "conv_1759664326177_uwqqfa4y5",
      "type": "scroll",
      "category": "engagement",
      "action": "scroll_75%",
      "elementData": {
        "text": "Page scroll",
        "tagName": "body"
      },
      "pageData": {
        "url": "https://www.techtots.ro/categories",
        "title": "",
        "referrer": "https://l.instagram.com/"
      },
      "userData": {
        "sessionId": "session_1759664313176_0k7hc2mzu",
        "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G100 Instagram 400.1.0.29.75 (iPhone14,2; iOS 18_6_2; en_GB; en-GB; scale=3.00; 1170x2532; IABMV/1; 799622199) NW/3",
        "isAuthenticated": false
      },
      "contextData": {
        "timeOnPage": 20422,
        "scrollDepth": 75,
        "previousActions": [
          "personalized_recommendations",
          "cta",
          "scroll_25%",
          "scroll_50%"
        ]
      },
      "metadata": {
        "scrollDepth": 75,
        "trackingMethod": "auto"
      },
      "timestamp": "2025-10-05T11:38:46.177Z",
      "createdAt": "2025-10-05T11:38:56.532Z"
    },
    {
      "id": "cmgdmpo7e0003ib04a56cmct3",
      "conversionId": "conv_1759664322456_qq2c6x7on",
      "type": "scroll",
      "category": "engagement",
      "action": "scroll_25%",
      "elementData": {
        "text": "Page scroll",
        "tagName": "body"
      },
      "pageData": {
        "url": "https://www.techtots.ro/categories",
        "title": "",
        "referrer": "https://l.instagram.com/"
      },
      "userData": {
        "sessionId": "session_1759664313176_0k7hc2mzu",
        "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G100 Instagram 400.1.0.29.75 (iPhone14,2; iOS 18_6_2; en_GB; en-GB; scale=3.00; 1170x2532; IABMV/1; 799622199) NW/3",
        "isAuthenticated": false
      },
      "contextData": {
        "timeOnPage": 16701,
        "scrollDepth": 25,
        "previousActions": [
          "personalized_recommendations",
          "cta"
        ]
      },
      "metadata": {
        "scrollDepth": 25,
        "trackingMethod": "auto"
      },
      "timestamp": "2025-10-05T11:38:42.456Z",
      "createdAt": "2025-10-05T11:38:56.531Z"
    },
    {
      "id": "cmgdmpo7p0005ib04mqjxueae",
      "conversionId": "conv_1759664313181_rtyf00el8",
      "type": "click",
      "category": "cta",
      "action": "cta",
      "elementData": {
        "href": "https://www.techtots.ro/categories",
        "text": "Recomandări Personalizate",
        "tagName": "a",
        "className": "w-full xs:w-auto min-h-[48px] px-6 py-3 bg-white/20 text-white border border-white/30 hover:bg-white/30 rounded-lg text-sm sm:text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent text-center flex items-center justify-center"
      },
      "pageData": {
        "url": "https://www.techtots.ro/?fbclid=PAZXh0bgNhZW0CMTEAAad_HLYagUZLKaJ2kqy_1kiT6sj6Sj8DKLVjvgNypZjbWrPY2J_AZ9292zhUOA_aem_Cx5yCltwmufAQX32UFKGhg",
        "title": "Transform Your Child Into a STEM Genius - TechTots Romania",
        "referrer": "https://l.instagram.com/"
      },
      "userData": {
        "sessionId": "session_1759664313176_0k7hc2mzu",
        "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G100 Instagram 400.1.0.29.75 (iPhone14,2; iOS 18_6_2; en_GB; en-GB; scale=3.00; 1170x2532; IABMV/1; 799622199) NW/3",
        "isAuthenticated": false
      },
      "contextData": {
        "timeOnPage": 7426,
        "scrollDepth": 0,
        "previousActions": [
          "personalized_recommendations"
        ]
      },
      "metadata": {
        "eventType": "click",
        "autoTracked": true,
        "trackingMethod": "manual"
      },
      "timestamp": "2025-10-05T11:38:33.181Z",
      "createdAt": "2025-10-05T11:38:56.531Z"
    },
    {
      "id": "cmgdmpo7p0004ib045hpw2uuh",
      "conversionId": "conv_1759664313176_3cwbnoqs3",
      "type": "click",
      "category": "cta",
      "action": "personalized_recommendations",
      "elementData": {
        "href": "https://www.techtots.ro/categories",
        "text": "Recomandări Personalizate",
        "tagName": "a",
        "className": "w-full xs:w-auto min-h-[48px] px-6 py-3 bg-white/20 text-white border border-white/30 hover:bg-white/30 rounded-lg text-sm sm:text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent text-center flex items-center justify-center"
      },
      "pageData": {
        "url": "https://www.techtots.ro/?fbclid=PAZXh0bgNhZW0CMTEAAad_HLYagUZLKaJ2kqy_1kiT6sj6Sj8DKLVjvgNypZjbWrPY2J_AZ9292zhUOA_aem_Cx5yCltwmufAQX32UFKGhg",
        "title": "Transform Your Child Into a STEM Genius - TechTots Romania",
        "referrer": "https://l.instagram.com/"
      },
      "userData": {
        "sessionId": "session_1759664313176_0k7hc2mzu",
        "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G100 Instagram 400.1.0.29.75 (iPhone14,2; iOS 18_6_2; en_GB; en-GB; scale=3.00; 1170x2532; IABMV/1; 799622199) NW/3",
        "isAuthenticated": false
      },
      "contextData": {
        "timeOnPage": 7421,
        "scrollDepth": 0,
        "previousActions": []
      },
      "metadata": {
        "elementId": "",
        "elementHref": "https://www.techtots.ro/categories",
        "elementText": "Recomandări Personalizate",
        "elementType": "a",
        "elementClass": "w-full xs:w-auto min-h-[48px] px-6 py-3 bg-white/20 text-white border border-white/30 hover:bg-white/30 rounded-lg text-sm sm:text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent text-center flex items-center justify-center",
        "trackingMethod": "manual"
      },
      "timestamp": "2025-10-05T11:38:33.176Z",
      "createdAt": "2025-10-05T11:38:56.531Z"
    },
    {
      "id": "cmgdmpo7y0006ib049knk9rra",
      "conversionId": "conv_1759664324093_1545o8e6u",
      "type": "scroll",
      "category": "engagement",
      "action": "scroll_50%",
      "elementData": {
        "text": "Page scroll",
        "tagName": "body"
      },
      "pageData": {
        "url": "https://www.techtots.ro/categories",
        "title": "",
        "referrer": "https://l.instagram.com/"
      },
      "userData": {
        "sessionId": "session_1759664313176_0k7hc2mzu",
        "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G100 Instagram 400.1.0.29.75 (iPhone14,2; iOS 18_6_2; en_GB; en-GB; scale=3.00; 1170x2532; IABMV/1; 799622199) NW/3",
        "isAuthenticated": false
      },
      "contextData": {
        "timeOnPage": 18338,
        "scrollDepth": 50,
        "previousActions": [
          "personalized_recommendations",
          "cta",
          "scroll_25%"
        ]
      },
      "metadata": {
        "scrollDepth": 50,
        "trackingMethod": "auto"
      },
      "timestamp": "2025-10-05T11:38:44.093Z",
      "createdAt": "2025-10-05T11:38:56.532Z"
    },
    {
      "id": "cmgdwm6750002la04wa4qum3c",
      "conversionId": "conv_1759680944355_dvg130u0k",
      "type": "scroll",
      "category": "engagement",
      "action": "scroll_25%",
      "elementData": {
        "text": "Page scroll",
        "tagName": "body"
      },
      "pageData": {
        "url": "https://www.techtots.ro/",
        "title": "Transform Your Child Into a STEM Genius - TechTots Romania",
        "referrer": "https://www.techtots.ro/"
      },
      "userData": {
        "sessionId": "session_1759565108389_s2hotxix3",
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        "isAuthenticated": false
      },
      "contextData": {
        "timeOnPage": 4633,
        "scrollDepth": 25,
        "previousActions": []
      },
      "metadata": {
        "scrollDepth": 25,
        "trackingMethod": "auto"
      },
      "timestamp": "2025-10-05T16:15:44.355Z",
      "createdAt": "2025-10-05T16:16:09.954Z"
    },
    {
      "id": "cmgdwm6cl0003la04gpjnvbpz",
      "conversionId": "conv_1759680963744_wr341my7r",
      "type": "form_submit",
      "category": "form",
      "action": "form_submit",
      "elementData": {
        "text": "Get Free Resources",
        "tagName": "form",
        "className": "flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-md sm:max-w-lg mx-auto justify-center items-center"
      },
      "pageData": {
        "url": "https://www.techtots.ro/products",
        "title": "Products | NextCommerce",
        "referrer": "https://www.techtots.ro/"
      },
      "userData": {
        "sessionId": "session_1759565108389_s2hotxix3",
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        "isAuthenticated": false
      },
      "contextData": {
        "timeOnPage": 24022,
        "scrollDepth": 90,
        "previousActions": [
          "scroll_25%",
          "scroll_50%",
          "scroll_75%",
          "scroll_90%",
          "header_link_click",
          "form_submit",
          "form_submit"
        ]
      },
      "metadata": {
        "eventType": "submit",
        "formFields": {},
        "autoTracked": true,
        "trackingMethod": "manual"
      },
      "timestamp": "2025-10-05T16:16:03.744Z",
      "createdAt": "2025-10-05T16:16:09.955Z"
    },
    {
      "id": "cmgdwm6f70004la04ezfusky4",
      "conversionId": "conv_1759680945315_aavgrzpr8",
      "type": "scroll",
      "category": "engagement",
      "action": "scroll_90%",
      "elementData": {
        "text": "Page scroll",
        "tagName": "body"
      },
      "pageData": {
        "url": "https://www.techtots.ro/",
        "title": "Transform Your Child Into a STEM Genius - TechTots Romania",
        "referrer": "https://www.techtots.ro/"
      },
      "userData": {
        "sessionId": "session_1759565108389_s2hotxix3",
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        "isAuthenticated": false
      },
      "contextData": {
        "timeOnPage": 5593,
        "scrollDepth": 90,
        "previousActions": [
          "scroll_25%",
          "scroll_50%",
          "scroll_75%"
        ]
      },
      "metadata": {
        "scrollDepth": 90,
        "trackingMethod": "auto"
      },
      "timestamp": "2025-10-05T16:15:45.315Z",
      "createdAt": "2025-10-05T16:16:09.955Z"
    },
    {
      "id": "cmgdwm6hx0005la048k480b1s",
      "conversionId": "conv_1759680946817_7bdha8i6o",
      "type": "click",
      "category": "cta",
      "action": "header_link_click",
      "elementData": {
        "href": "https://www.techtots.ro/products",
        "text": "Products",
        "tagName": "a",
        "className": "relative group px-3 2xl:px-4 py-2 text-sm 2xl:text-base font-medium transition-all duration-200 rounded-md cursor-pointer whitespace-nowrap flex items-center gap-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50"
      },
      "pageData": {
        "url": "https://www.techtots.ro/",
        "title": "Transform Your Child Into a STEM Genius - TechTots Romania",
        "referrer": "https://www.techtots.ro/"
      },
      "userData": {
        "sessionId": "session_1759565108389_s2hotxix3",
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        "isAuthenticated": false
      },
      "contextData": {
        "timeOnPage": 7095,
        "scrollDepth": 90,
        "previousActions": [
          "scroll_25%",
          "scroll_50%",
          "scroll_75%",
          "scroll_90%"
        ]
      },
      "metadata": {
        "elementId": "",
        "elementHref": "https://www.techtots.ro/products",
        "elementText": "Products",
        "elementType": "a",
        "elementClass": "relative group px-3 2xl:px-4 py-2 text-sm 2xl:text-base font-medium transition-all duration-200 rounded-md cursor-pointer whitespace-nowrap flex items-center gap-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50",
        "trackingMethod": "manual"
      },
      "timestamp": "2025-10-05T16:15:46.817Z",
      "createdAt": "2025-10-05T16:16:09.955Z"
    },
    {
      "id": "cmgdwm6nf0006la044oqt8ogu",
      "conversionId": "conv_1759680944855_zrmi8l4bm",
      "type": "scroll",
      "category": "engagement",
      "action": "scroll_75%",
      "elementData": {
        "text": "Page scroll",
        "tagName": "body"
      },
      "pageData": {
        "url": "https://www.techtots.ro/",
        "title": "Transform Your Child Into a STEM Genius - TechTots Romania",
        "referrer": "https://www.techtots.ro/"
      },
      "userData": {
        "sessionId": "session_1759565108389_s2hotxix3",
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        "isAuthenticated": false
      },
      "contextData": {
        "timeOnPage": 5133,
        "scrollDepth": 75,
        "previousActions": [
          "scroll_25%",
          "scroll_50%"
        ]
      },
      "metadata": {
        "scrollDepth": 75,
        "trackingMethod": "auto"
      },
      "timestamp": "2025-10-05T16:15:44.855Z",
      "createdAt": "2025-10-05T16:16:09.954Z"
    },
    {
      "id": "cmgdwm6np0007la044flc0m90",
      "conversionId": "conv_1759680955324_v76vq8fnn",
      "type": "form_submit",
      "category": "form",
      "action": "form_submit",
      "elementData": {
        "text": "Get Free Resources",
        "tagName": "form",
        "className": "flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-md sm:max-w-lg mx-auto justify-center items-center"
      },
      "pageData": {
        "url": "https://www.techtots.ro/products",
        "title": "Products | NextCommerce",
        "referrer": "https://www.techtots.ro/"
      },
      "userData": {
        "sessionId": "session_1759565108389_s2hotxix3",
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        "isAuthenticated": false
      },
      "contextData": {
        "timeOnPage": 15602,
        "scrollDepth": 90,
        "previousActions": [
          "scroll_25%",
          "scroll_50%",
          "scroll_75%",
          "scroll_90%",
          "header_link_click"
        ]
      },
      "metadata": {
        "eventType": "submit",
        "formFields": {},
        "autoTracked": true,
        "trackingMethod": "manual"
      },
      "timestamp": "2025-10-05T16:15:55.324Z",
      "createdAt": "2025-10-05T16:16:09.954Z"
    },
    {
      "id": "cmgdwm6nu0008la04cap059s1",
      "conversionId": "conv_1759680956904_i97typ34u",
      "type": "form_submit",
      "category": "form",
      "action": "form_submit",
      "elementData": {
        "text": "Get Free Resources",
        "tagName": "form",
        "className": "flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-md sm:max-w-lg mx-auto justify-center items-center"
      },
      "pageData": {
        "url": "https://www.techtots.ro/products",
        "title": "Products | NextCommerce",
        "referrer": "https://www.techtots.ro/"
      },
      "userData": {
        "sessionId": "session_1759565108389_s2hotxix3",
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        "isAuthenticated": false
      },
      "contextData": {
        "timeOnPage": 17183,
        "scrollDepth": 90,
        "previousActions": [
          "scroll_25%",
          "scroll_50%",
          "scroll_75%",
          "scroll_90%",
          "header_link_click",
          "form_submit"
        ]
      },
      "metadata": {
        "eventType": "submit",
        "formFields": {},
        "autoTracked": true,
        "trackingMethod": "manual"
      },
      "timestamp": "2025-10-05T16:15:56.904Z",
      "createdAt": "2025-10-05T16:16:09.954Z"
    },
    {
      "id": "cmgdwm6o70009la04ojw67aff",
      "conversionId": "conv_1759680944754_z76wpvx95",
      "type": "scroll",
      "category": "engagement",
      "action": "scroll_50%",
      "elementData": {
        "text": "Page scroll",
        "tagName": "body"
      },
      "pageData": {
        "url": "https://www.techtots.ro/",
        "title": "Transform Your Child Into a STEM Genius - TechTots Romania",
        "referrer": "https://www.techtots.ro/"
      },
      "userData": {
        "sessionId": "session_1759565108389_s2hotxix3",
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        "isAuthenticated": false
      },
      "contextData": {
        "timeOnPage": 5032,
        "scrollDepth": 50,
        "previousActions": [
          "scroll_25%"
        ]
      },
      "metadata": {
        "scrollDepth": 50,
        "trackingMethod": "auto"
      },
      "timestamp": "2025-10-05T16:15:44.754Z",
      "createdAt": "2025-10-05T16:16:09.954Z"
    }
  ],
  "FacebookPixelEvent": [],
  "RomanianViralContent": [],
  "FacebookPixelConfig": [],
  "InstagramPixelConfig": [],
  "TikTokPixelConfig": [],
  "SEOAnalytics": [],
  "PerformanceMetric": [],
  "Supplier": [],
  "SupplierOrder": [],
  "SupplierOrderTracking": [],
  "SupplierInvoice": [],
  "SupplierMessage": [],
  "SupplierNotification": [],
  "SupplierSupportTicket": [],
  "SupplierTicketResponse": [],
  "SupplierAnnouncement": [],
  "SupplierPerformanceMetrics": [],
  "Ticket": [],
  "AutomationWorkflow": [],
  "Campaign": [],
  "CampaignApplication": [],
  "ImageMetadata": [],
  "ImageProcessingLog": []
};

// Tables in dependency order (DO NOT CHANGE)
const RESTORE_ORDER = [
  "User",
  "PasswordResetToken",
  "Session",
  "Address",
  "PaymentCard",
  "Wishlist",
  "Category",
  "Product",
  "MarketingCost",
  "ProductCost",
  "Review",
  "Blog",
  "ContentVersion",
  "Book",
  "DigitalFile",
  "Language",
  "DigitalDownload",
  "Order",
  "OrderItem",
  "OrderStatusHistory",
  "Return",
  "StoreSettings",
  "Newsletter",
  "Coupon",
  "CouponUsage",
  "EmailTemplate",
  "EmailLog",
  "EmailCampaign",
  "EmailEvent",
  "EmailSequence",
  "EmailSequenceStep",
  "EmailSequenceUser",
  "ConversionLog",
  "FacebookPixelEvent",
  "RomanianViralContent",
  "FacebookPixelConfig",
  "InstagramPixelConfig",
  "TikTokPixelConfig",
  "SEOAnalytics",
  "PerformanceMetric",
  "Supplier",
  "SupplierOrder",
  "SupplierOrderTracking",
  "SupplierInvoice",
  "SupplierMessage",
  "SupplierNotification",
  "SupplierSupportTicket",
  "SupplierTicketResponse",
  "SupplierAnnouncement",
  "SupplierPerformanceMetrics",
  "Ticket",
  "AutomationWorkflow",
  "Campaign",
  "CampaignApplication",
  "ImageMetadata",
  "ImageProcessingLog"
];

async function restoreCompleteDatabase() {
  console.log("🔄 Starting COMPLETE database restoration...");
  console.log("⚠️  This will replace ALL existing data!");
  console.log("");

  try {
    // Step 1: Reset database (optional - uncomment if needed)
    console.log("📋 Step 1: Preparing database...");

    // Uncomment the next line if you want to completely reset the database
    // WARNING: This will DELETE ALL EXISTING DATA!
    // await resetDatabase();

    // Step 2: Ensure schema is up to date
    console.log("📋 Step 2: Ensuring schema is current...");
    try {
      execSync('npx prisma db push --accept-data-loss', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log("   ✅ Schema updated successfully");
    } catch (error) {
      console.log("   ⚠️  Schema update may have issues, continuing...");
    }

    // Step 3: Restore data in dependency order
    console.log("\n📋 Step 3: Restoring data...");

    let totalRestored = 0;

    for (const tableName of RESTORE_ORDER) {
      const data = BACKUP_DATA[tableName];
      if (!data || data.length === 0) {
        console.log(`   ⏭️  Skipping ${tableName} (no data)`);
        continue;
      }

      console.log(`   📥 Restoring ${tableName} (${data.length} records)...`);

      const model = prisma[tableName.charAt(0).toLowerCase() + tableName.slice(1)] as any;
      let restoredCount = 0;

      for (const record of data) {
        try {
          // Remove id, createdAt, updatedAt to avoid conflicts
          const { id, createdAt, updatedAt, ...recordData } = record;

          await model.upsert({
            where: getUniqueWhereClause(tableName, record),
            update: recordData,
            create: recordData,
          });
          restoredCount++;
        } catch (error) {
          console.error(`     ❌ Error restoring ${tableName} record:`, error.message);
        }
      }

      totalRestored += restoredCount;
      console.log(`     ✅ Restored ${restoredCount} records to ${tableName}`);
    }

    // Step 4: Verification
    console.log("\n📋 Step 4: Verification...");
    const verificationResults = await verifyRestoration(BACKUP_DATA);

    console.log("\n🎉 Database restoration completed!");
    console.log(`📊 Total records restored: ${totalRestored}`);

    if (verificationResults.issues.length > 0) {
      console.log("\n⚠️  Some tables had restoration issues:");
      verificationResults.issues.forEach(issue => {
        console.log(`   • ${issue}`);
      });
    }

    console.log("\n✅ Restoration Summary:");
    console.log(`   • Expected records: 44`);
    console.log(`   • Restored records: ${totalRestored}`);
    console.log(`   • Tables processed: ${RESTORE_ORDER.length}`);

  } catch (error) {
    console.error("❌ Error during restoration:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function resetDatabase() {
  console.log("🗑️  Resetting database (this will delete ALL data)...");

  // Delete all data in reverse dependency order
  const reverseOrder = [...RESTORE_ORDER].reverse();

  for (const tableName of reverseOrder) {
    try {
      const model = prisma[tableName.charAt(0).toLowerCase() + tableName.slice(1)] as any;
      await model.deleteMany();
      console.log(`   🗑️  Cleared ${tableName}`);
    } catch (error) {
      console.log(`   ⚠️  Could not clear ${tableName}:`, error.message);
    }
  }

  console.log("✅ Database reset complete");
}

async function verifyRestoration(backupData: Record<string, any[]>): Promise<{ issues: string[] }> {
  const issues: string[] = [];

  for (const tableName of RESTORE_ORDER) {
    try {
      const model = prisma[tableName.charAt(0).toLowerCase() + tableName.slice(1)] as any;
      const currentCount = await model.count();
      const expectedCount = backupData[tableName]?.length || 0;

      if (currentCount !== expectedCount) {
        issues.push(`${tableName}: Expected ${expectedCount}, got ${currentCount}`);
      }
    } catch (error) {
      issues.push(`${tableName}: Could not verify (${error.message})`);
    }
  }

  return { issues };
}

function getUniqueWhereClause(tableName: string, record: any) {
  switch (tableName) {
    case "User":
      return { email: record.email };
    case "Category":
      return { slug: record.slug };
    case "Language":
      return { code: record.code };
    case "EmailTemplate":
      return { slug: record.slug };
    case "Product":
      return record.sku ? { sku: record.sku } : { id: record.id };
    case "Book":
      return { slug: record.slug };
    case "Order":
      return { orderNumber: record.orderNumber };
    case "Coupon":
      return { code: record.code };
    case "Supplier":
      return { email: record.email };
    case "Session":
      return { sessionToken: record.sessionToken };
    // Add more unique constraints as needed
    default:
      return { id: record.id };
  }
}

// Run the restoration
if (require.main === module) {
  // Simple confirmation prompt
  console.log("⚠️  DATABASE RESTORATION WARNING ⚠️");
  console.log("This will replace ALL data in your database!");
  console.log("Make sure you have a backup of current data if needed.");
  console.log("");
  console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...");

  setTimeout(() => {
    restoreCompleteDatabase();
  }, 5000);
}
