const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function optimizeHeroImage() {
  const inputPath = path.join(
    __dirname,
    "../public/images/homepage_hero_banner_01.png"
  );
  const outputDir = path.join(__dirname, "../public/images/optimized");

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    console.log("📷 Optimizing hero image...");

    // Get original file size
    const originalStats = fs.statSync(inputPath);
    console.log(
      `📊 Original size: ${(originalStats.size / 1024 / 1024).toFixed(2)}MB`
    );

    // Optimize for different screen sizes
    const sizes = [
      { width: 1920, suffix: "xl" },
      { width: 1280, suffix: "lg" },
      { width: 768, suffix: "md" },
      { width: 640, suffix: "sm" },
    ];

    // Generate optimized WebP versions
    const optimizedImages = await Promise.all(
      sizes.map(async ({ width, suffix }) => {
        const outputPath = path.join(
          outputDir,
          `homepage_hero_banner_01_${suffix}.webp`
        );

        await sharp(inputPath)
          .resize(width, null, {
            // null maintains aspect ratio
            withoutEnlargement: true,
            fit: "inside",
          })
          .webp({
            quality: 85, // Good balance of quality vs size
            effort: 6,
          })
          .toFile(outputPath);

        const stats = fs.statSync(outputPath);
        console.log(`✅ ${suffix}: ${(stats.size / 1024).toFixed(0)}KB`);

        return {
          suffix,
          size: stats.size,
          path: outputPath,
        };
      })
    );

    // Generate fallback JPEG version
    const jpegPath = path.join(
      outputDir,
      "homepage_hero_banner_01_fallback.jpg"
    );
    await sharp(inputPath)
      .resize(1920, null, {
        withoutEnlargement: true,
        fit: "inside",
      })
      .jpeg({
        quality: 80,
        mozjpeg: true,
      })
      .toFile(jpegPath);

    const jpegStats = fs.statSync(jpegPath);
    console.log(`✅ JPEG fallback: ${(jpegStats.size / 1024).toFixed(0)}KB`);

    console.log("\n🎉 Image optimization complete!");
    console.log("📁 Optimized images saved to:", outputDir);

    // Calculate total savings
    const totalOptimizedSize =
      optimizedImages.reduce((sum, img) => sum + img.size, 0) + jpegStats.size;
    const savings = (
      ((originalStats.size - totalOptimizedSize) / originalStats.size) *
      100
    ).toFixed(1);
    console.log(`💰 Size reduction: ${savings}%`);
  } catch (error) {
    console.error("❌ Error optimizing image:", error);
    process.exit(1);
  }
}

optimizeHeroImage();
