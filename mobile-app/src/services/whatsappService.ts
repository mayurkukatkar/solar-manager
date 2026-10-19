import { Linking, Alert } from 'react-native';

export interface WhatsAppPitchData {
  customerName: string;
  customerPhone?: string;
  systemCapacityKw: number;
  grossAmount: number;
  subsidyAmount: number;
  netPayable: number;
  monthlySavings: number;
  lifetimeSavings: number;
  companyName?: string;
  repName?: string;
  repPhone?: string;
  language?: 'EN' | 'HI' | 'MR';
}

export function formatIndianCurrency(num: number): string {
  if (!num && num !== 0) return '0';
  return Math.round(num).toLocaleString('en-IN');
}

export function generateWhatsAppMessage(data: WhatsAppPitchData): string {
  const lang = data.language || 'EN';
  const gross = formatIndianCurrency(data.grossAmount);
  const subsidy = formatIndianCurrency(data.subsidyAmount);
  const net = formatIndianCurrency(data.netPayable);
  const savings = formatIndianCurrency(data.monthlySavings);
  const lifetime = formatIndianCurrency(data.lifetimeSavings);
  const company = data.companyName || 'Solar Energy Solutions';
  const rep = data.repName || 'Solar Advisor';

  if (lang === 'MR') {
    return `☀️ *${company} - रूफटॉप सोलर प्रस्तावना* ☀️

आदरणीय *${data.customerName}* जी,
नमस्कार! आपल्या घरासाठी/प्रतिष्ठानासाठी तयार केलेला रूफटॉप सोलर प्रस्ताव खालीलप्रमाणे आहे:

⚡ *सिस्टम क्षमता*: ${data.systemCapacityKw} kWp ऑन-ग्रीड सोलर
💰 *सोलर सिस्टम एकूण खर्च (सर्व GST सह)*: ₹${gross}
🎁 *पीएम सूर्य घर शासकीय अनुदान*: -₹${subsidy}
👉 *आपली निव्वळ गुंतवणूक*: *₹${net}*
📉 *अंदाजित मासिक वीज बचत*: ₹${savings}/महिना
🌱 *२५ वर्षांची एकूण बचत*: ₹${lifetime}

📄 यासोबत विस्तृत तांत्रिक व आर्थिक कोटेशन (PDF) जोडले आहे. कृपया तपासावे.
आपल्या सोयीनुसार प्रत्यक्ष साईट सर्व्हे किंवा मंजुरीसाठी संपर्क करा!

सस्नेह,
*${rep}* | ${company}
📞 संपर्क: ${data.repPhone || ''}`;
  }

  if (lang === 'HI') {
    return `☀️ *${company} - रूफटॉप सोलर प्रस्ताव* ☀️

नमस्ते *${data.customerName}* जी,
आपके घर/प्रतिष्ठान के लिए विशेष रूप से तैयार किया गया सोलर कोटेशन:

⚡ *सिस्टम क्षमता*: ${data.systemCapacityKw} kWp ग्रिड-टाईड सोलर
💰 *सोलर सिस्टम कुल लागत (सभी GST सहित)*: ₹${gross}
🎁 *पीएम सूर्य घर सरकारी सब्सिडी*: -₹${subsidy}
👉 *आपकी कुल शुद्ध लागत*: *₹${net}*
📉 *अनुमानित मासिक बचत*: ₹${savings}/माह
🌱 *25 वर्षों में कुल बचत*: ₹${lifetime}

📄 विस्तृत तकनीकी व वित्तीय कोटेशन (PDF) संलग्न है। 
साइट सर्वे व तत्काल सब्सिडी बुकिंग के लिए हमसे संपर्क करें!

 सादर,
*${rep}* | ${company}
📞 संपर्क: ${data.repPhone || ''}`;
  }

  // Default English
  return `☀️ *${company} — Solar Rooftop Proposal* ☀️

Dear *${data.customerName}*,
Thank you for connecting with us. We are delighted to present your customized Solar Rooftop Proposal:

⚡ *System Capacity*: ${data.systemCapacityKw} kWp On-Grid System
💰 *Solar System Cost (Incl. All GST)*: ₹${gross}
🎁 *PM Surya Ghar Central Subsidy*: -₹${subsidy}
👉 *Net Customer Investment*: *₹${net}*
📉 *Estimated Monthly Bill Savings*: ₹${savings}/month
🌱 *25-Year Cumulative Savings*: ₹${lifetime}

📄 Please find attached your detailed technical & financial proposal (PDF).
Feel free to reach out to lock in your subsidy quota and schedule the installation!

Warm regards,
*${rep}* | ${company}
📞 ${data.repPhone || ''}`;
}

export async function openWhatsAppWithPitch(data: WhatsAppPitchData): Promise<boolean> {
  const text = generateWhatsAppMessage(data);
  const cleanPhone = (data.customerPhone || '').replace(/[^0-9]/g, '');
  
  // Format with country code 91 if 10 digits
  const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  
  const encodedText = encodeURIComponent(text);
  const url = targetPhone
    ? `whatsapp://send?phone=${targetPhone}&text=${encodedText}`
    : `whatsapp://send?text=${encodedText}`;

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    } else {
      // Fallback web url
      const webUrl = targetPhone
        ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodedText}`
        : `https://api.whatsapp.com/send?text=${encodedText}`;
      await Linking.openURL(webUrl);
      return true;
    }
  } catch (err: any) {
    Alert.alert('WhatsApp Error', 'Could not open WhatsApp on this device. Please verify WhatsApp is installed.');
    return false;
  }
}
