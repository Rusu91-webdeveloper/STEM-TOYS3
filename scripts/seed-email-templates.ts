import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const emailTemplates = [
  {
    name: "Welcome Email",
    slug: "welcome-email",
    subject: "Welcome to TechTots! 🎉",
    content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to TechTots</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">Welcome to TechTots! 🎉</h1>
        <p style="font-size: 18px; color: #666;">Hi {{user.name}},</p>
    </div>
    
    <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #1e293b; margin-top: 0;">Thank you for joining our STEM community!</h2>
        <p>We're excited to have you on board. At TechTots, we believe that learning through play is the best way to inspire the next generation of innovators, scientists, and engineers.</p>
    </div>
    
    <div style="margin-bottom: 25px;">
        <h3 style="color: #1e293b;">What's next?</h3>
        <ul style="padding-left: 20px;">
            <li>Explore our curated collection of STEM toys</li>
            <li>Check out our educational blog for learning tips</li>
            <li>Join our community of curious minds</li>
            <li>Get 10% off your first order with code: WELCOME10</li>
        </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{site.url}}/products" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Start Shopping</a>
    </div>
    
    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
        <p>Questions? Contact us at <a href="mailto:support@techtots.com" style="color: #2563eb;">support@techtots.com</a></p>
        <p>© 2024 TechTots. All rights reserved.</p>
    </div>
</body>
</html>`,
    category: "welcome",
    variables: ["{{user.name}}", "{{site.url}}"],
  },
  {
    name: "Order Confirmation",
    slug: "order-confirmation",
    subject: "Order Confirmed - #{{order.number}}",
    content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #059669; margin-bottom: 10px;">Order Confirmed! ✅</h1>
        <p style="font-size: 18px; color: #666;">Hi {{user.name}},</p>
    </div>
    
    <div style="background-color: #f0fdf4; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #059669;">
        <h2 style="color: #1e293b; margin-top: 0;">Order #{{order.number}}</h2>
        <p style="margin-bottom: 15px;"><strong>Order Date:</strong> {{order.date}}</p>
        <p style="margin-bottom: 15px;"><strong>Total:</strong> $\{\{order.total\}\}</p>
        <p style="margin-bottom: 0;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Confirmed</span></p>
    </div>
    
    <div style="margin-bottom: 25px;">
        <h3 style="color: #1e293b;">Order Details</h3>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px;">
            {{order.items}}
        </div>
    </div>
    
    <div style="margin-bottom: 25px;">
        <h3 style="color: #1e293b;">Shipping Information</h3>
        <p>We'll send you a shipping confirmation email with tracking information once your order is on its way.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{site.url}}/account/orders/{{order.number}}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Order</a>
    </div>
    
    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
        <p>Questions about your order? Contact us at <a href="mailto:support@techtots.com" style="color: #2563eb;">support@techtots.com</a></p>
        <p>© 2024 TechTots. All rights reserved.</p>
    </div>
</body>
</html>`,
    category: "order-confirmation",
    variables: [
      "{{user.name}}",
      "{{order.number}}",
      "{{order.total}}",
      "{{order.date}}",
      "{{order.items}}",
      "{{site.url}}",
    ],
  },
  {
    name: "Order Shipped",
    slug: "order-shipped",
    subject: "Your order is on its way! 📦 #{{order.number}}",
    content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Shipped</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">Your order is on its way! 📦</h1>
        <p style="font-size: 18px; color: #666;">Hi {{user.name}},</p>
    </div>
    
    <div style="background-color: #eff6ff; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #2563eb;">
        <h2 style="color: #1e293b; margin-top: 0;">Order #{{order.number}} has been shipped!</h2>
        <p style="margin-bottom: 15px;"><strong>Tracking Number:</strong> {{tracking.number}}</p>
        <p style="margin-bottom: 15px;"><strong>Carrier:</strong> {{tracking.carrier}}</p>
        <p style="margin-bottom: 0;"><strong>Estimated Delivery:</strong> {{tracking.estimatedDelivery}}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{tracking.url}}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Track Package</a>
    </div>
    
    <div style="margin-bottom: 25px;">
        <h3 style="color: #1e293b;">What's next?</h3>
        <ul style="padding-left: 20px;">
            <li>Track your package using the link above</li>
            <li>You'll receive a delivery confirmation email</li>
            <li>Share your experience with a review</li>
        </ul>
    </div>
    
    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
        <p>Questions about shipping? Contact us at <a href="mailto:support@techtots.com" style="color: #2563eb;">support@techtots.com</a></p>
        <p>© 2024 TechTots. All rights reserved.</p>
    </div>
</body>
</html>`,
    category: "order-shipped",
    variables: [
      "{{user.name}}",
      "{{order.number}}",
      "{{tracking.number}}",
      "{{tracking.carrier}}",
      "{{tracking.estimatedDelivery}}",
      "{{tracking.url}}",
    ],
  },
  {
    name: "Order Delivered",
    slug: "order-delivered",
    subject: "Your order has been delivered! 🎉 #{{order.number}}",
    content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Delivered</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #059669; margin-bottom: 10px;">Your order has been delivered! 🎉</h1>
        <p style="font-size: 18px; color: #666;">Hi {{user.name}},</p>
    </div>
    
    <div style="background-color: #f0fdf4; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #059669;">
        <h2 style="color: #1e293b; margin-top: 0;">Order #{{order.number}} has arrived!</h2>
        <p style="margin-bottom: 15px;"><strong>Delivery Date:</strong> {{delivery.date}}</p>
        <p style="margin-bottom: 0;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Delivered</span></p>
    </div>
    
    <div style="margin-bottom: 25px;">
        <h3 style="color: #1e293b;">Time to explore and learn!</h3>
        <p>We hope you and your little ones enjoy the STEM toys. Here are some tips to get the most out of your new educational toys:</p>
        <ul style="padding-left: 20px;">
            <li>Read the instructions together</li>
            <li>Encourage questions and exploration</li>
            <li>Document the learning journey</li>
            <li>Share your experience with us</li>
        </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{site.url}}/account/orders/{{order.number}}/review" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Write a Review</a>
    </div>
    
    <div style="margin-bottom: 25px;">
        <h3 style="color: #1e293b;">Need help?</h3>
        <p>If you have any questions about your order or need assistance with the products, don't hesitate to reach out to our support team.</p>
    </div>
    
    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
        <p>Contact us at <a href="mailto:support@techtots.com" style="color: #2563eb;">support@techtots.com</a></p>
        <p>© 2024 TechTots. All rights reserved.</p>
    </div>
</body>
</html>`,
    category: "order-delivered",
    variables: [
      "{{user.name}}",
      "{{order.number}}",
      "{{delivery.date}}",
      "{{site.url}}",
    ],
  },
  {
    name: "Abandoned Cart Reminder",
    slug: "abandoned-cart-reminder",
    subject: "Don't forget your cart! 🛒",
    content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abandoned Cart Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #dc2626; margin-bottom: 10px;">Oops! You left something behind 🛒</h1>
        <p style="font-size: 18px; color: #666;">Hi {{user.name}},</p>
    </div>
    
    <div style="background-color: #fef2f2; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #dc2626;">
        <h2 style="color: #1e293b; margin-top: 0;">Your cart is waiting for you!</h2>
        <p>We noticed you added some amazing STEM toys to your cart but didn't complete your purchase. Don't let these educational opportunities slip away!</p>
    </div>
    
    <div style="margin-bottom: 25px;">
        <h3 style="color: #1e293b;">Your cart items:</h3>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px;">
            {{cart.items}}
        </div>
        <p style="text-align: center; margin-top: 15px; font-size: 18px; font-weight: bold;">
            Total: $\{\{cart.total\}\}
        </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{site.url}}/cart" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Complete Your Order</a>
    </div>
    
    <div style="margin-bottom: 25px;">
        <h3 style="color: #1e293b;">Why complete your purchase?</h3>
        <ul style="padding-left: 20px;">
            <li>Secure checkout with multiple payment options</li>
            <li>Fast and reliable shipping</li>
            <li>30-day return policy</li>
            <li>Educational value for your children</li>
        </ul>
    </div>
    
    <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
        <h4 style="color: #92400e; margin-top: 0;">💡 Limited Time Offer</h4>
        <p style="margin-bottom: 0;">Complete your order within 24 hours and get <strong>10% off</strong> with code: <strong>CART10</strong></p>
    </div>
    
    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
        <p>Questions? Contact us at <a href="mailto:support@techtots.com" style="color: #2563eb;">support@techtots.com</a></p>
        <p>© 2024 TechTots. All rights reserved.</p>
    </div>
</body>
</html>`,
    category: "abandoned-cart",
    variables: [
      "{{user.name}}",
      "{{cart.items}}",
      "{{cart.total}}",
      "{{site.url}}",
    ],
  },
  {
    name: "Password Reset",
    slug: "password-reset",
    subject: "Reset your TechTots password",
    content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">Password Reset Request</h1>
        <p style="font-size: 18px; color: #666;">Hi {{user.name}},</p>
    </div>
    
    <div style="background-color: #eff6ff; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #2563eb;">
        <h2 style="color: #1e293b; margin-top: 0;">Reset your password</h2>
        <p>We received a request to reset your password for your TechTots account. Click the button below to create a new password.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{resetUrl}}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
    </div>
    
    <div style="margin-bottom: 25px;">
        <h3 style="color: #1e293b;">Important information:</h3>
        <ul style="padding-left: 20px;">
            <li>This link will expire in 1 hour</li>
            <li>If you didn't request this reset, you can safely ignore this email</li>
            <li>For security, this link can only be used once</li>
        </ul>
    </div>
    
    <div style="background-color: #fef2f2; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
        <h4 style="color: #dc2626; margin-top: 0;">🔒 Security Notice</h4>
        <p style="margin-bottom: 0;">If you didn't request this password reset, please contact our support team immediately at <a href="mailto:support@techtots.com" style="color: #2563eb;">support@techtots.com</a></p>
    </div>
    
    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
        <p>Need help? Contact us at <a href="mailto:support@techtots.com" style="color: #2563eb;">support@techtots.com</a></p>
        <p>© 2024 TechTots. All rights reserved.</p>
    </div>
</body>
</html>`,
    category: "password-reset",
    variables: ["{{user.name}}", "{{resetUrl}}"],
  },
];

async function seedEmailTemplates() {
  console.log("🌱 Starting email templates seeding...");

  try {
    // Get admin user for createdBy field
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminUser) {
      throw new Error(
        "No admin user found. Please run the main seed script first."
      );
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const template of emailTemplates) {
      // Check if template already exists
      const existingTemplate = await prisma.emailTemplate.findUnique({
        where: { slug: template.slug },
      });

      if (existingTemplate) {
        console.log(
          `⏭️  Template "${template.name}" already exists, skipping...`
        );
        skippedCount++;
        continue;
      }

      // Create template
      await prisma.emailTemplate.create({
        data: {
          ...template,
          createdBy: adminUser.id,
        },
      });

      console.log(`✅ Created template: ${template.name}`);
      createdCount++;
    }

    console.log(`\n🎉 Email templates seeding completed!`);
    console.log(`📊 Created: ${createdCount} templates`);
    console.log(`⏭️  Skipped: ${skippedCount} templates (already exist)`);
    console.log(`📧 Total templates: ${createdCount + skippedCount}`);
  } catch (error) {
    console.error("❌ Error seeding email templates:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedEmailTemplates()
  .then(() => {
    console.log("✅ Email templates seeding completed successfully");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Email templates seeding failed:", error);
    process.exit(1);
  });
