const { getStoreSettings } = require('./lib/utils/store-settings.js');
const { createTestimonial } = require('./lib/email/components.js');

async function debugNewsletter() {
  try {
    console.log('Getting store settings...');
    const storeSettings = await getStoreSettings();
    console.log('Store settings:', {
      storeName: storeSettings.storeName,
      storeUrl: storeSettings.storeUrl
    });
    
    // Test the testimonial creation
    const testimonialText = `Newsletter-ul de la ${storeSettings.storeName} este minunat! Primești informații valoroase despre educația STEM și oferte exclusive.`;
    console.log('Testimonial text:', testimonialText);
    
    const testimonialHtml = createTestimonial(
      testimonialText,
      "Maria Ionescu", 
      "Mamă de 2 copii",
      5
    );
    
    console.log('Generated HTML contains store name:', testimonialHtml.includes(storeSettings.storeName));
    console.log('Generated HTML contains template syntax:', testimonialHtml.includes('${storeSettings.storeName}'));
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugNewsletter();
