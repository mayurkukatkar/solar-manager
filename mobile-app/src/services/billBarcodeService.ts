/**
 * Machine-Readable Barcode & QR Code Decoder for Indian Electricity Bills
 * Specifically decodes:
 * 1. MSEDCL 50-digit Code 128 / 2-of-5 Barcode printed at the bottom of bills
 *    Structure: [BU:4][PC:1][ConsumerNo:12][DueDate:8][AmountPaise:11]...
 *    Example: 39054410010537316031120260000049700060002310260050
 * 2. MSEDCL UPI QR Code printed at top-right
 *    Structure: upi://pay?pa=...&am=4970.00&tr=410010537316...
 * 3. Generic 12-digit Consumer Number Barcodes
 */

export interface DecodedBillCode {
  consumerNumber?: string;
  billingUnit?: string;
  billAmount?: number;
  dueDate?: string;
  discomName?: string;
  rawCode: string;
  codeType: 'MSEDCL_BARCODE' | 'UPI_QR' | 'RAW_CONSUMER_NO' | 'UNKNOWN';
}

export function parseBillBarcodeOrQr(scannedString: string): DecodedBillCode {
  const raw = (scannedString || '').trim();

  // 1. MSEDCL Official Bottom Barcode (~45 to 55 digits)
  // e.g. 39054410010537316031120260000049700060002310260050
  const digitsOnly = raw.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 25 && /^[0-9]+$/.test(digitsOnly)) {
    // If it starts with 4-digit BU and has 12-digit consumer number
    const bu = digitsOnly.substring(0, 4);
    const consumerNumber = digitsOnly.substring(5, 17); // 12 digits

    let billAmount: number | undefined = undefined;
    let dueDate: string | undefined = undefined;

    if (digitsOnly.length >= 25) {
      const rawDate = digitsOnly.substring(17, 25); // DDMMYYYY
      if (rawDate.length === 8) {
        dueDate = `${rawDate.substring(0, 2)}-${rawDate.substring(2, 4)}-${rawDate.substring(4, 8)}`;
      }
    }

    if (digitsOnly.length >= 36) {
      // Amount in paise: e.g. 00000497000 -> 4970.00
      const amtSegment = digitsOnly.substring(25, 36);
      const parsedPaise = parseInt(amtSegment, 10);
      if (!isNaN(parsedPaise) && parsedPaise > 0) {
        billAmount = Math.round(parsedPaise / 100);
      }
    }

    return {
      consumerNumber,
      billingUnit: bu,
      billAmount,
      dueDate,
      discomName: 'MSEDCL (Mahavitaran)',
      rawCode: raw,
      codeType: 'MSEDCL_BARCODE',
    };
  }

  // 2. UPI QR Code from Bill (e.g. upi://pay?pa=msedcl@sbi&pn=MSEDCL&am=4970.00&tr=410010537316...)
  if (raw.toLowerCase().includes('upi://pay') || raw.toLowerCase().includes('msedcl')) {
    let billAmount: number | undefined = undefined;
    let consumerNumber: string | undefined = undefined;

    const amMatch = raw.match(/[?&]am=([0-9]+(?:\.[0-9]+)?)/i);
    if (amMatch) {
      billAmount = Math.round(parseFloat(amMatch[1]));
    }

    const trMatch = raw.match(/[?&](?:tr|tid|ref|mc)=([0-9]{12})/i) ||
                    raw.match(/\b(4100[0-9]{8})\b/) ||
                    raw.match(/\b([0-9]{12})\b/);
    if (trMatch) {
      consumerNumber = trMatch[1];
    }

    return {
      consumerNumber,
      billingUnit: consumerNumber ? consumerNumber.substring(0, 4) : undefined,
      billAmount,
      discomName: 'MSEDCL (Mahavitaran)',
      rawCode: raw,
      codeType: 'UPI_QR',
    };
  }

  // 3. Raw 12-digit Consumer Number (printed as barcode or QR)
  const consMatch = raw.match(/\b([0-9]{12})\b/);
  if (consMatch) {
    const cn = consMatch[1];
    return {
      consumerNumber: cn,
      billingUnit: cn.substring(0, 4),
      discomName: 'MSEDCL (Mahavitaran)',
      rawCode: raw,
      codeType: 'RAW_CONSUMER_NO',
    };
  }

  return {
    rawCode: raw,
    codeType: 'UNKNOWN',
  };
}
