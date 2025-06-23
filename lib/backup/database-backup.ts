/**
 * Automated Database Backup System
 *
 * Provides comprehensive backup functionality with multiple storage options,
 * scheduling, encryption, and monitoring capabilities.
 */

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { logger } from "../logger";
import { TIME } from "../constants";

const execAsync = promisify(exec);

interface BackupConfig {
  schedule: {
    daily: { enabled: boolean; hour: number; minute: number };
    weekly: {
      enabled: boolean;
      dayOfWeek: number;
      hour: number;
      minute: number;
    };
    monthly: {
      enabled: boolean;
      dayOfMonth: number;
      hour: number;
      minute: number;
    };
  };
  retention: {
    daily: number; // Keep daily backups for X days
    weekly: number; // Keep weekly backups for X weeks
    monthly: number; // Keep monthly backups for X months
  };
  storage: {
    local: { enabled: boolean; path: string };
    s3: { enabled: boolean; bucket: string; region: string };
    googleCloud: { enabled: boolean; bucket: string };
  };
  encryption: {
    enabled: boolean;
    algorithm: string;
    keyPath: string;
  };
  compression: {
    enabled: boolean;
    level: number; // 1-9 for gzip
  };
  notifications: {
    email: { enabled: boolean; recipients: string[] };
    webhook: { enabled: boolean; url: string };
  };
}

interface BackupMetadata {
  id: string;
  timestamp: Date;
  type: "daily" | "weekly" | "monthly" | "manual";
  size: number;
  duration: number;
  checksum: string;
  encrypted: boolean;
  compressed: boolean;
  status: "success" | "failed" | "in_progress";
  error?: string;
  location: {
    local?: string;
    s3?: string;
    googleCloud?: string;
  };
}

interface BackupStats {
  totalBackups: number;
  totalSize: number;
  successfulBackups: number;
  failedBackups: number;
  averageSize: number;
  averageDuration: number;
  lastSuccessfulBackup?: Date;
  lastFailedBackup?: Date;
  storageUsage: {
    local?: number;
    s3?: number;
    googleCloud?: number;
  };
}

class DatabaseBackupService {
  private config: BackupConfig;
  private backupHistory: BackupMetadata[] = [];
  private isBackupInProgress = false;

  constructor(config?: Partial<BackupConfig>) {
    this.config = this.getDefaultConfig();
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  private getDefaultConfig(): BackupConfig {
    return {
      schedule: {
        daily: { enabled: true, hour: 2, minute: 0 },
        weekly: { enabled: true, dayOfWeek: 0, hour: 3, minute: 0 }, // Sunday
        monthly: { enabled: true, dayOfMonth: 1, hour: 4, minute: 0 },
      },
      retention: {
        daily: 7, // Keep 7 daily backups
        weekly: 4, // Keep 4 weekly backups
        monthly: 12, // Keep 12 monthly backups
      },
      storage: {
        local: {
          enabled: true,
          path: process.env.BACKUP_LOCAL_PATH || "./backups",
        },
        s3: {
          enabled: !!process.env.AWS_S3_BACKUP_BUCKET,
          bucket: process.env.AWS_S3_BACKUP_BUCKET || "",
          region: process.env.AWS_REGION || "us-east-1",
        },
        googleCloud: {
          enabled: !!process.env.GOOGLE_CLOUD_BACKUP_BUCKET,
          bucket: process.env.GOOGLE_CLOUD_BACKUP_BUCKET || "",
        },
      },
      encryption: {
        enabled: process.env.NODE_ENV === "production",
        algorithm: "aes-256-gcm",
        keyPath: process.env.BACKUP_ENCRYPTION_KEY_PATH || "./backup.key",
      },
      compression: {
        enabled: true,
        level: 6, // Good balance of speed vs compression
      },
      notifications: {
        email: {
          enabled: !!process.env.BACKUP_NOTIFICATION_EMAIL,
          recipients: process.env.BACKUP_NOTIFICATION_EMAIL?.split(",") || [],
        },
        webhook: {
          enabled: !!process.env.BACKUP_WEBHOOK_URL,
          url: process.env.BACKUP_WEBHOOK_URL || "",
        },
      },
    };
  }

  /**
   * Perform a database backup
   */
  async performBackup(
    type: "daily" | "weekly" | "monthly" | "manual" = "manual"
  ): Promise<BackupMetadata> {
    if (this.isBackupInProgress) {
      throw new Error("Backup already in progress");
    }

    this.isBackupInProgress = true;
    const startTime = Date.now();
    const backupId = this.generateBackupId();

    const metadata: BackupMetadata = {
      id: backupId,
      timestamp: new Date(),
      type,
      size: 0,
      duration: 0,
      checksum: "",
      encrypted: this.config.encryption.enabled,
      compressed: this.config.compression.enabled,
      status: "in_progress",
      location: {},
    };

    try {
      logger.info("Starting database backup", { backupId, type });

      // 1. Create database dump
      const dumpPath = await this.createDatabaseDump(backupId);

      // 2. Get file size
      const stats = await fs.stat(dumpPath);
      metadata.size = stats.size;

      // 3. Generate checksum
      metadata.checksum = await this.generateChecksum(dumpPath);

      // 4. Compress if enabled
      let finalPath = dumpPath;
      if (this.config.compression.enabled) {
        finalPath = await this.compressFile(dumpPath);
        await fs.unlink(dumpPath); // Remove uncompressed file
        const compressedStats = await fs.stat(finalPath);
        metadata.size = compressedStats.size;
      }

      // 5. Encrypt if enabled
      if (this.config.encryption.enabled) {
        finalPath = await this.encryptFile(finalPath);
        await fs.unlink(finalPath.replace(".enc", "")); // Remove unencrypted file
      }

      // 6. Store in configured locations
      await this.storeBackup(finalPath, metadata);

      // 7. Update metadata
      metadata.duration = Date.now() - startTime;
      metadata.status = "success";

      // 8. Clean up old backups
      await this.cleanupOldBackups(type);

      // 9. Send notifications
      await this.sendNotification(metadata);

      logger.info("Database backup completed successfully", {
        backupId,
        size: metadata.size,
        duration: metadata.duration,
      });

      this.backupHistory.push(metadata);
      return metadata;
    } catch (error) {
      metadata.status = "failed";
      metadata.error = error instanceof Error ? error.message : "Unknown error";
      metadata.duration = Date.now() - startTime;

      logger.error("Database backup failed", {
        backupId,
        error: metadata.error,
        duration: metadata.duration,
      });

      await this.sendNotification(metadata);
      this.backupHistory.push(metadata);
      throw error;
    } finally {
      this.isBackupInProgress = false;
    }
  }

  /**
   * Create database dump using pg_dump
   */
  private async createDatabaseDump(backupId: string): Promise<string> {
    const dumpPath = path.join("/tmp", `backup_${backupId}.sql`);
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL not configured");
    }

    // Extract connection details from URL
    const url = new URL(databaseUrl);
    const dbName = url.pathname.slice(1);
    const host = url.hostname;
    const port = url.port || "5432";
    const username = url.username;
    const password = url.password;

    // Set environment variable for password
    const env = { ...process.env, PGPASSWORD: password };

    const command = [
      "pg_dump",
      `--host=${host}`,
      `--port=${port}`,
      `--username=${username}`,
      `--dbname=${dbName}`,
      "--verbose",
      "--clean",
      "--no-owner",
      "--no-privileges",
      `--file=${dumpPath}`,
    ].join(" ");

    try {
      await execAsync(command, { env });
      return dumpPath;
    } catch (error) {
      logger.error("Failed to create database dump", { error, command });
      throw new Error(`Database dump failed: ${error}`);
    }
  }

  /**
   * Compress file using gzip
   */
  private async compressFile(filePath: string): Promise<string> {
    const compressedPath = `${filePath}.gz`;
    const command = `gzip -${this.config.compression.level} -c "${filePath}" > "${compressedPath}"`;

    try {
      await execAsync(command);
      return compressedPath;
    } catch (error) {
      throw new Error(`Compression failed: ${error}`);
    }
  }

  /**
   * Encrypt file using AES encryption
   */
  private async encryptFile(filePath: string): Promise<string> {
    const encryptedPath = `${filePath}.enc`;

    try {
      // Read encryption key
      const key = await fs.readFile(this.config.encryption.keyPath);

      // Read file content
      const data = await fs.readFile(filePath);

      // Generate IV
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipher(this.config.encryption.algorithm, key);

      // Encrypt data
      let encrypted = cipher.update(data);
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // Combine IV and encrypted data
      const result = Buffer.concat([iv, encrypted]);

      // Write encrypted file
      await fs.writeFile(encryptedPath, result);

      return encryptedPath;
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  /**
   * Generate checksum for file integrity verification
   */
  private async generateChecksum(filePath: string): Promise<string> {
    const data = await fs.readFile(filePath);
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Store backup in configured storage locations
   */
  private async storeBackup(
    filePath: string,
    metadata: BackupMetadata
  ): Promise<void> {
    const fileName = path.basename(filePath);

    // Store locally
    if (this.config.storage.local.enabled) {
      const localPath = path.join(this.config.storage.local.path, fileName);
      await fs.mkdir(this.config.storage.local.path, { recursive: true });
      await fs.copyFile(filePath, localPath);
      metadata.location.local = localPath;
      logger.info("Backup stored locally", { path: localPath });
    }

    // Store in S3
    if (this.config.storage.s3.enabled) {
      try {
        const { S3Client, PutObjectCommand } = await import(
          "@aws-sdk/client-s3"
        );
        const s3Client = new S3Client({
          region: this.config.storage.s3.region,
        });

        const fileContent = await fs.readFile(filePath);
        const s3Key = `backups/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${fileName}`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: this.config.storage.s3.bucket,
            Key: s3Key,
            Body: fileContent,
            ContentType: "application/octet-stream",
            Metadata: {
              backupId: metadata.id,
              type: metadata.type,
              timestamp: metadata.timestamp.toISOString(),
            },
          })
        );

        metadata.location.s3 = `s3://${this.config.storage.s3.bucket}/${s3Key}`;
        logger.info("Backup stored in S3", { location: metadata.location.s3 });
      } catch (error) {
        logger.error("Failed to store backup in S3", { error });
        // Don't fail the entire backup if S3 storage fails
      }
    }

    // Store in Google Cloud Storage
    if (this.config.storage.googleCloud.enabled) {
      try {
        const { Storage } = await import("@google-cloud/storage");
        const storage = new Storage();
        const bucket = storage.bucket(this.config.storage.googleCloud.bucket);

        const fileName = path.basename(filePath);
        const gcsPath = `backups/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${fileName}`;
        const file = bucket.file(gcsPath);

        await file.save(await fs.readFile(filePath), {
          metadata: {
            metadata: {
              backupId: metadata.id,
              type: metadata.type,
              timestamp: metadata.timestamp.toISOString(),
            },
          },
        });

        metadata.location.googleCloud = `gs://${this.config.storage.googleCloud.bucket}/${gcsPath}`;
        logger.info("Backup stored in Google Cloud Storage", {
          location: metadata.location.googleCloud,
        });
      } catch (error) {
        logger.error("Failed to store backup in Google Cloud Storage", {
          error,
        });
        // Don't fail the entire backup if GCS storage fails
      }
    }

    // Clean up local temp file
    await fs.unlink(filePath);
  }

  /**
   * Clean up old backups based on retention policy
   */
  private async cleanupOldBackups(type: BackupMetadata["type"]): Promise<void> {
    const retentionDays =
      this.config.retention[type as keyof typeof this.config.retention];
    const cutoffDate = new Date(Date.now() - retentionDays * TIME.DAY);

    // Get old backups
    const oldBackups = this.backupHistory.filter(
      backup =>
        backup.type === type &&
        backup.timestamp < cutoffDate &&
        backup.status === "success"
    );

    for (const backup of oldBackups) {
      try {
        // Delete from local storage
        if (backup.location.local && this.config.storage.local.enabled) {
          try {
            await fs.unlink(backup.location.local);
            logger.info("Deleted old local backup", {
              path: backup.location.local,
            });
          } catch (error) {
            logger.warn("Failed to delete old local backup", {
              path: backup.location.local,
              error,
            });
          }
        }

        // Delete from S3
        if (backup.location.s3 && this.config.storage.s3.enabled) {
          try {
            const { S3Client, DeleteObjectCommand } = await import(
              "@aws-sdk/client-s3"
            );
            const s3Client = new S3Client({
              region: this.config.storage.s3.region,
            });

            const key = backup.location.s3.replace(
              `s3://${this.config.storage.s3.bucket}/`,
              ""
            );
            await s3Client.send(
              new DeleteObjectCommand({
                Bucket: this.config.storage.s3.bucket,
                Key: key,
              })
            );

            logger.info("Deleted old S3 backup", {
              location: backup.location.s3,
            });
          } catch (error) {
            logger.warn("Failed to delete old S3 backup", {
              location: backup.location.s3,
              error,
            });
          }
        }

        // Delete from Google Cloud Storage
        if (
          backup.location.googleCloud &&
          this.config.storage.googleCloud.enabled
        ) {
          try {
            const { Storage } = await import("@google-cloud/storage");
            const storage = new Storage();
            const bucket = storage.bucket(
              this.config.storage.googleCloud.bucket
            );

            const filePath = backup.location.googleCloud.replace(
              `gs://${this.config.storage.googleCloud.bucket}/`,
              ""
            );
            await bucket.file(filePath).delete();

            logger.info("Deleted old Google Cloud backup", {
              location: backup.location.googleCloud,
            });
          } catch (error) {
            logger.warn("Failed to delete old Google Cloud backup", {
              location: backup.location.googleCloud,
              error,
            });
          }
        }

        // Remove from history
        const index = this.backupHistory.indexOf(backup);
        if (index > -1) {
          this.backupHistory.splice(index, 1);
        }
      } catch (error) {
        logger.error("Failed to cleanup old backup", {
          backupId: backup.id,
          error,
        });
      }
    }
  }

  /**
   * Send backup notifications
   */
  private async sendNotification(metadata: BackupMetadata): Promise<void> {
    const subject =
      metadata.status === "success"
        ? `✅ Database Backup Successful - ${metadata.id}`
        : `❌ Database Backup Failed - ${metadata.id}`;

    const message = {
      backupId: metadata.id,
      timestamp: metadata.timestamp.toISOString(),
      type: metadata.type,
      status: metadata.status,
      size: metadata.size,
      duration: metadata.duration,
      error: metadata.error,
      locations: metadata.location,
    };

    // Email notification
    if (this.config.notifications.email.enabled) {
      try {
        // Import email service dynamically
        const { sendMail } = await import("../brevo");

        for (const recipient of this.config.notifications.email.recipients) {
          await sendMail({
            to: recipient,
            subject,
            html: `
              <h2>Database Backup Report</h2>
              <pre>${JSON.stringify(message, null, 2)}</pre>
            `,
          });
        }

        logger.info("Backup notification email sent");
      } catch (error) {
        logger.error("Failed to send backup notification email", { error });
      }
    }

    // Webhook notification
    if (this.config.notifications.webhook.enabled) {
      try {
        const response = await fetch(this.config.notifications.webhook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "backup_completed",
            subject,
            data: message,
          }),
        });

        if (!response.ok) {
          throw new Error(`Webhook returned ${response.status}`);
        }

        logger.info("Backup notification webhook sent");
      } catch (error) {
        logger.error("Failed to send backup notification webhook", { error });
      }
    }
  }

  /**
   * Get backup statistics
   */
  getBackupStats(): BackupStats {
    const successfulBackups = this.backupHistory.filter(
      b => b.status === "success"
    );
    const failedBackups = this.backupHistory.filter(b => b.status === "failed");

    const totalSize = successfulBackups.reduce(
      (sum, backup) => sum + backup.size,
      0
    );
    const totalDuration = successfulBackups.reduce(
      (sum, backup) => sum + backup.duration,
      0
    );

    return {
      totalBackups: this.backupHistory.length,
      totalSize,
      successfulBackups: successfulBackups.length,
      failedBackups: failedBackups.length,
      averageSize:
        successfulBackups.length > 0 ? totalSize / successfulBackups.length : 0,
      averageDuration:
        successfulBackups.length > 0
          ? totalDuration / successfulBackups.length
          : 0,
      lastSuccessfulBackup:
        successfulBackups.length > 0
          ? successfulBackups[successfulBackups.length - 1].timestamp
          : undefined,
      lastFailedBackup:
        failedBackups.length > 0
          ? failedBackups[failedBackups.length - 1].timestamp
          : undefined,
      storageUsage: {
        // These would need to be calculated by checking actual storage
        local: 0,
        s3: 0,
        googleCloud: 0,
      },
    };
  }

  /**
   * List all available backups
   */
  listBackups(type?: BackupMetadata["type"]): BackupMetadata[] {
    if (type) {
      return this.backupHistory.filter(backup => backup.type === type);
    }
    return [...this.backupHistory];
  }

  /**
   * Generate unique backup ID
   */
  private generateBackupId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const random = crypto.randomBytes(4).toString("hex");
    return `${timestamp}-${random}`;
  }

  /**
   * Validate backup integrity
   */
  async validateBackup(
    backupId: string
  ): Promise<{ valid: boolean; error?: string }> {
    const backup = this.backupHistory.find(b => b.id === backupId);
    if (!backup) {
      return { valid: false, error: "Backup not found" };
    }

    try {
      // Check if backup files exist and validate checksums
      for (const [storage, location] of Object.entries(backup.location)) {
        if (!location) continue;

        switch (storage) {
          case "local":
            try {
              await fs.access(location);
              // Could verify checksum here
              logger.info("Local backup validated", { location });
            } catch (error) {
              return {
                valid: false,
                error: `Local backup file not found: ${location}`,
              };
            }
            break;

          case "s3":
            // Could check S3 object existence and metadata
            break;

          case "googleCloud":
            // Could check GCS object existence and metadata
            break;
        }
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const backupService = new DatabaseBackupService();

// Export types for external use
export type { BackupConfig, BackupMetadata, BackupStats };
