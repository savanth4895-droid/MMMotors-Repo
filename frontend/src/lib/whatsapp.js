/**
 * WhatsApp Integration Utilities for MMMotors
 * 
 * Uses WhatsApp Web URL scheme to send messages.
 * Works on both desktop (opens WhatsApp Web) and mobile (opens WhatsApp app).
 */

/**
 * Format Indian mobile number for WhatsApp.
 * Handles numbers with/without country code, +91 prefix, or spaces.
 */
export function formatWhatsAppNumber(mobile) {
  if (!mobile) return null;
  
  // Remove all non-digit characters
  let cleaned = mobile.replace(/\D/g, '');
  
  // If starts with 0, remove leading 0
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // If 10 digits, add India country code
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  // If starts with 91 and is 12 digits, it's correct
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned;
  }
  
  // Return as-is if it's already a valid international number
  return cleaned.length >= 10 ? cleaned : null;
}

/**
 * Open WhatsApp with a pre-filled message.
 */
export function openWhatsApp(mobile, message = '') {
  const number = formatWhatsAppNumber(mobile);
  if (!number) {
    console.warn('Invalid mobile number for WhatsApp:', mobile);
    return false;
  }
  
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${number}?text=${encodedMessage}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

// ==================== Pre-built Message Templates ====================

/**
 * Service Reminder message
 */
export function sendServiceReminder(customerName, mobile, vehicleNumber, vehicleBrand, vehicleModel, lastServiceDate) {
  const message = `🔧 *Service Reminder - M M Motors*

Dear *${customerName}*,

Your vehicle *${vehicleBrand || ''} ${vehicleModel || ''}* (${vehicleNumber}) is due for service.
${lastServiceDate ? `\nLast service date: ${lastServiceDate}` : ''}

Regular servicing keeps your vehicle in top condition and ensures safety.

📞 Call us or reply to this message to book your service appointment.

Thank you for choosing M M Motors! 🏍️`;

  return openWhatsApp(mobile, message);
}

/**
 * Service Completion notification
 */
export function sendServiceCompletion(customerName, mobile, vehicleNumber, jobCardNumber, serviceType, amount) {
  const message = `✅ *Service Completed - M M Motors*

Dear *${customerName}*,

Your vehicle service has been completed!

📋 *Job Card:* ${jobCardNumber}
🏍️ *Vehicle:* ${vehicleNumber}
🔧 *Service:* ${serviceType}
💰 *Amount:* ₹${parseFloat(amount || 0).toLocaleString('en-IN')}

Your vehicle is ready for pickup. Please visit our service center at your convenience.

Thank you for choosing M M Motors! 🙏`;

  return openWhatsApp(mobile, message);
}

/**
 * Sale / Invoice message
 */
export function sendSaleInvoice(customerName, mobile, invoiceNumber, vehicleBrand, vehicleModel, vehicleColor, amount, paymentMethod) {
  const message = `🎉 *Congratulations on your new ride! - M M Motors*

Dear *${customerName}*,

Thank you for your purchase!

📋 *Invoice:* ${invoiceNumber}
🏍️ *Vehicle:* ${vehicleBrand || ''} ${vehicleModel || ''} (${vehicleColor || ''})
💰 *Amount:* ₹${parseFloat(amount || 0).toLocaleString('en-IN')}
💳 *Payment:* ${paymentMethod || 'N/A'}

For any queries regarding your vehicle, feel free to contact us.

Wishing you happy and safe rides! 🏍️✨

*M M Motors*`;

  return openWhatsApp(mobile, message);
}

/**
 * Spare Parts Bill message
 */
export function sendSparePartsBill(customerName, mobile, billNumber, totalAmount, items) {
  const itemList = (items || [])
    .slice(0, 5)
    .map((item, i) => `  ${i + 1}. ${item.name || item.part_name || 'Part'} × ${item.quantity || 1} = ₹${parseFloat(item.total || item.amount || 0).toLocaleString('en-IN')}`)
    .join('\n');

  const message = `🧾 *Spare Parts Bill - M M Motors*

Dear *${customerName}*,

Here is your spare parts bill:

📋 *Bill No:* ${billNumber}
${itemList ? `\n📦 *Items:*\n${itemList}` : ''}
${(items || []).length > 5 ? `  ...and ${items.length - 5} more items\n` : ''}
💰 *Total Amount:* ₹${parseFloat(totalAmount || 0).toLocaleString('en-IN')}

Thank you for choosing M M Motors! 🙏`;

  return openWhatsApp(mobile, message);
}

/**
 * Service Bill message
 */
export function sendServiceBill(customerName, mobile, billNumber, vehicleNumber, totalAmount, items) {
  const itemList = (items || [])
    .slice(0, 5)
    .map((item, i) => `  ${i + 1}. ${item.description || item.name || 'Service'} = ₹${parseFloat(item.total || item.amount || 0).toLocaleString('en-IN')}`)
    .join('\n');

  const message = `🧾 *Service Bill - M M Motors*

Dear *${customerName}*,

Here is your service bill:

📋 *Bill No:* ${billNumber}
🏍️ *Vehicle:* ${vehicleNumber || 'N/A'}
${itemList ? `\n🔧 *Services:*\n${itemList}` : ''}
${(items || []).length > 5 ? `  ...and ${items.length - 5} more items\n` : ''}
💰 *Total Amount:* ₹${parseFloat(totalAmount || 0).toLocaleString('en-IN')}

Thank you for choosing M M Motors! 🙏`;

  return openWhatsApp(mobile, message);
}

/**
 * General custom message
 */
export function sendCustomMessage(mobile, message) {
  return openWhatsApp(mobile, message);
}

/**
 * Payment Reminder
 */
export function sendPaymentReminder(customerName, mobile, invoiceNumber, amount) {
  const message = `💳 *Payment Reminder - M M Motors*

Dear *${customerName}*,

This is a gentle reminder regarding your pending payment.

📋 *Invoice:* ${invoiceNumber}
💰 *Amount Due:* ₹${parseFloat(amount || 0).toLocaleString('en-IN')}

Please complete the payment at your earliest convenience.

For any queries, feel free to contact us.

Thank you! 🙏
*M M Motors*`;

  return openWhatsApp(mobile, message);
}
