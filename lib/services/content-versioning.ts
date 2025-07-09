import { db } from "@/lib/db";
import { StemCategory } from "@prisma/client";

export interface ContentVersion {
  id: string;
  contentId: string;
  contentType: "BLOG" | "PRODUCT" | "CATEGORY";
  version: number;
  title: string;
  content: any; // JSON object with all content fields
  changeDescription?: string;
  createdBy: string;
  createdAt: Date;
  isPublished: boolean;
}

export interface CreateVersionInput {
  contentId: string;
  contentType: "BLOG" | "PRODUCT" | "CATEGORY";
  content: any;
  changeDescription?: string;
  createdBy: string;
  isPublished?: boolean;
}

export interface ContentVersionHistory {
  versions: ContentVersion[];
  currentVersion: number;
  totalVersions: number;
}

class ContentVersioningService {
  /**
   * Create a new version of content
   */
  async createVersion(input: CreateVersionInput): Promise<ContentVersion> {
    // Get the current highest version number
    const lastVersion = await db.$queryRaw<[{ maxVersion: number | null }]>`
      SELECT MAX(version) as maxVersion 
      FROM ContentVersion 
      WHERE contentId = ${input.contentId} 
      AND contentType = ${input.contentType}
    `;

    const nextVersion = (lastVersion[0]?.maxVersion || 0) + 1;

    // Create the new version
    const version = await db.contentVersion.create({
      data: {
        contentId: input.contentId,
        contentType: input.contentType,
        version: nextVersion,
        title: input.content.title || `Version ${nextVersion}`,
        content: input.content,
        changeDescription: input.changeDescription,
        createdBy: input.createdBy,
        isPublished: input.isPublished || false,
      },
    });

    return version as ContentVersion;
  }

  /**
   * Get version history for specific content
   */
  async getVersionHistory(
    contentId: string,
    contentType: "BLOG" | "PRODUCT" | "CATEGORY"
  ): Promise<ContentVersionHistory> {
    const versions = await db.contentVersion.findMany({
      where: {
        contentId,
        contentType,
      },
      orderBy: {
        version: "desc",
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const currentVersion = Math.max(...versions.map(v => v.version), 0);

    return {
      versions: versions as ContentVersion[],
      currentVersion,
      totalVersions: versions.length,
    };
  }

  /**
   * Get a specific version
   */
  async getVersion(
    contentId: string,
    contentType: "BLOG" | "PRODUCT" | "CATEGORY",
    version: number
  ): Promise<ContentVersion | null> {
    const contentVersion = await db.contentVersion.findFirst({
      where: {
        contentId,
        contentType,
        version,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return contentVersion as ContentVersion | null;
  }

  /**
   * Restore content to a specific version
   */
  async restoreToVersion(
    contentId: string,
    contentType: "BLOG" | "PRODUCT" | "CATEGORY",
    version: number,
    restoredBy: string,
    changeDescription?: string
  ): Promise<ContentVersion> {
    // Get the version to restore
    const versionToRestore = await this.getVersion(
      contentId,
      contentType,
      version
    );

    if (!versionToRestore) {
      throw new Error(`Version ${version} not found`);
    }

    // Create a new version with the restored content
    const restoredVersion = await this.createVersion({
      contentId,
      contentType,
      content: versionToRestore.content,
      changeDescription: changeDescription || `Restored to version ${version}`,
      createdBy: restoredBy,
      isPublished: versionToRestore.isPublished,
    });

    // Update the actual content based on type
    await this.updateActualContent(
      contentId,
      contentType,
      versionToRestore.content
    );

    return restoredVersion;
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    contentId: string,
    contentType: "BLOG" | "PRODUCT" | "CATEGORY",
    fromVersion: number,
    toVersion: number
  ) {
    const [from, to] = await Promise.all([
      this.getVersion(contentId, contentType, fromVersion),
      this.getVersion(contentId, contentType, toVersion),
    ]);

    if (!from || !to) {
      throw new Error("One or both versions not found");
    }

    // Simple diff implementation - in production, use a proper diff library
    const changes = this.generateDiff(from.content, to.content);

    return {
      from: {
        version: from.version,
        title: from.title,
        createdAt: from.createdAt,
        createdBy: from.createdBy,
      },
      to: {
        version: to.version,
        title: to.title,
        createdAt: to.createdAt,
        createdBy: to.createdBy,
      },
      changes,
    };
  }

  /**
   * Automatically create version when content is updated
   */
  async autoVersion(
    contentId: string,
    contentType: "BLOG" | "PRODUCT" | "CATEGORY",
    currentContent: any,
    updatedBy: string,
    changeDescription?: string
  ): Promise<ContentVersion> {
    // Only create a version if there are actual changes
    const lastVersion = await db.contentVersion.findFirst({
      where: { contentId, contentType },
      orderBy: { version: "desc" },
    });

    // If this is the first version or content has changed
    if (
      !lastVersion ||
      this.hasContentChanged(lastVersion.content, currentContent)
    ) {
      return this.createVersion({
        contentId,
        contentType,
        content: currentContent,
        changeDescription: changeDescription || "Content updated",
        createdBy: updatedBy,
        isPublished: currentContent.isPublished || false,
      });
    }

    return lastVersion as ContentVersion;
  }

  /**
   * Clean up old versions (keep only recent ones)
   */
  async cleanupOldVersions(
    contentId: string,
    contentType: "BLOG" | "PRODUCT" | "CATEGORY",
    keepVersions: number = 10
  ): Promise<number> {
    const allVersions = await db.contentVersion.findMany({
      where: { contentId, contentType },
      orderBy: { version: "desc" },
      select: { id: true, version: true },
    });

    if (allVersions.length <= keepVersions) {
      return 0; // Nothing to clean up
    }

    const versionsToDelete = allVersions.slice(keepVersions);
    const deletedIds = versionsToDelete.map(v => v.id);

    await db.contentVersion.deleteMany({
      where: {
        id: {
          in: deletedIds,
        },
      },
    });

    return versionsToDelete.length;
  }

  /**
   * Private helper methods
   */
  private async updateActualContent(
    contentId: string,
    contentType: "BLOG" | "PRODUCT" | "CATEGORY",
    content: any
  ): Promise<void> {
    switch (contentType) {
      case "BLOG":
        await db.blog.update({
          where: { id: contentId },
          data: {
            title: content.title,
            slug: content.slug,
            excerpt: content.excerpt,
            content: content.content,
            coverImage: content.coverImage,
            categoryId: content.categoryId,
            stemCategory: content.stemCategory,
            tags: content.tags,
            isPublished: content.isPublished,
            metadata: content.metadata,
          },
        });
        break;

      case "PRODUCT":
        await db.product.update({
          where: { id: contentId },
          data: {
            name: content.name,
            slug: content.slug,
            description: content.description,
            price: content.price,
            compareAtPrice: content.compareAtPrice,
            images: content.images,
            categoryId: content.categoryId,
            isActive: content.isActive,
            metadata: content.metadata,
          },
        });
        break;

      case "CATEGORY":
        await db.category.update({
          where: { id: contentId },
          data: {
            name: content.name,
            slug: content.slug,
            description: content.description,
            image: content.image,
            isActive: content.isActive,
            metadata: content.metadata,
          },
        });
        break;
    }
  }

  private hasContentChanged(oldContent: any, newContent: any): boolean {
    // Simple deep equality check - in production, use a proper comparison library
    return JSON.stringify(oldContent) !== JSON.stringify(newContent);
  }

  private generateDiff(oldContent: any, newContent: any) {
    const changes: Array<{
      field: string;
      type: "added" | "removed" | "modified";
      oldValue?: any;
      newValue?: any;
    }> = [];

    const allKeys = new Set([
      ...Object.keys(oldContent || {}),
      ...Object.keys(newContent || {}),
    ]);

    for (const key of allKeys) {
      const oldValue = oldContent?.[key];
      const newValue = newContent?.[key];

      if (oldValue === undefined && newValue !== undefined) {
        changes.push({
          field: key,
          type: "added",
          newValue,
        });
      } else if (oldValue !== undefined && newValue === undefined) {
        changes.push({
          field: key,
          type: "removed",
          oldValue,
        });
      } else if (oldValue !== newValue) {
        changes.push({
          field: key,
          type: "modified",
          oldValue,
          newValue,
        });
      }
    }

    return changes;
  }
}

export const contentVersioningService = new ContentVersioningService();
