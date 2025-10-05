const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNewsletter() {
  console.log('Testing newsletter subscription...');
  
  try {
    // Check current newsletter subscriptions
    const newsletterCount = await prisma.newsletter.count();
    console.log('Current newsletter subscriptions:', newsletterCount);
    
    // Check if our test email exists
    const existing = await prisma.newsletter.findUnique({
      where: { email: 'rusuemanuel1991@gmail.com' }
    });
    console.log('Existing subscription:', existing);
    
    // Test the subscription API
    console.log('Testing newsletter API...');
    
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:3000/api/newsletter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test-newsletter@example.com',
        firstName: 'Test',
        lastName: 'User'
      })
    });
    
    const result = await response.json();
    console.log('API Response:', result);
    
    // Check if new subscription was created
    const newCount = await prisma.newsletter.count();
    console.log('New newsletter subscriptions:', newCount);
    
    // Check email logs
    const emailLogs = await prisma.emailLog.count();
    console.log('Email logs count:', emailLogs);
    
    if (emailLogs > 0) {
      const recentEmails = await prisma.emailLog.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' }
      });
      console.log('Recent emails:', recentEmails);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewsletter();
