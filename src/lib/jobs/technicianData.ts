// ==============================================================================
// src/lib/jobs/technicianData.ts — Technician Field Data Parser & Serializer
// ==============================================================================

export interface TechnicianBillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // in dollars
  taxable: boolean;
}

export interface TechnicianPhoto {
  id: string;
  url: string;
  tag: 'before' | 'after' | 'damaged_part' | 'permit';
  caption: string;
  timestamp: string;
}

export interface TechnicianCompletionData {
  summaryNotes: string;
  customerSignerName?: string;
  customerSignature?: string; // base64 or data URL
  signedAt?: string;
  photos: TechnicianPhoto[];
  billItems: TechnicianBillItem[];
}

const SECTION_SUMMARY = '[TECHNICIAN WORK SUMMARY]';
const SECTION_SIGNATURE = '[CUSTOMER SIGNATURE ON GLASS]';
const SECTION_PHOTOS = '[BEFORE & AFTER PHOTOS JSON]';
const SECTION_BILLABLES = '[TECHNICIAN BILLABLE ITEMS]';

/**
 * Serializes technician completion inputs into structured internal_notes.
 */
export function serializeTechnicianData(data: TechnicianCompletionData): string {
  const parts: string[] = [];

  // 1. Work Summary
  if (data.summaryNotes && typeof data.summaryNotes === 'string' && data.summaryNotes.trim()) {
    parts.push(`${SECTION_SUMMARY}\n${data.summaryNotes.trim()}`);
  }

  // 2. Customer Signature
  if (data.customerSignature || data.customerSignerName) {
    const signer = data.customerSignerName?.trim() || 'Customer';
    const signedAt = data.signedAt || new Date().toISOString();
    const sigPayload = data.customerSignature ? `\nSignatureData: ${data.customerSignature}` : '';
    parts.push(`${SECTION_SIGNATURE}\nSigned by: ${signer} at ${signedAt}${sigPayload}`);
  }

  // 3. Photos JSON (clean payload)
  if (data.photos && data.photos.length > 0) {
    try {
      parts.push(`${SECTION_PHOTOS}\n${JSON.stringify(data.photos)}`);
    } catch {
      // ignore serialization error
    }
  }

  // 4. Billable Items
  if (data.billItems && data.billItems.length > 0) {
    const itemsText = data.billItems
      .map(
        (it) =>
          `• ${it.description.trim()} | Qty: ${it.quantity} | Price: ${it.unitPrice.toFixed(2)} | Taxable: ${it.taxable}`
      )
      .join('\n');
    parts.push(`${SECTION_BILLABLES}\n${itemsText}`);
  }

  return parts.join('\n\n');
}

/**
 * Parses internal_notes into a typed TechnicianCompletionData object.
 * Completely resilient to raw text, legacy formats, or empty strings.
 */
export function parseTechnicianData(rawNotes: string | null | undefined): TechnicianCompletionData {
  const result: TechnicianCompletionData = {
    summaryNotes: '',
    customerSignerName: undefined,
    customerSignature: undefined,
    signedAt: undefined,
    photos: [],
    billItems: [],
  };

  if (!rawNotes || !rawNotes.trim()) {
    return result;
  }

  const text = rawNotes.trim();

  // If structured sections exist, parse each
  if (text.includes(SECTION_SUMMARY) || text.includes(SECTION_BILLABLES) || text.includes(SECTION_SIGNATURE)) {
    // 1. Summary
    const summaryMatch = text.match(/\[TECHNICIAN WORK SUMMARY\]\n([\s\S]*?)(?=\n\n\[|$)/);
    if (summaryMatch) {
      result.summaryNotes = summaryMatch[1].trim();
    }

    // 2. Signature
    const sigMatch = text.match(/\[CUSTOMER SIGNATURE ON GLASS\]\n([\s\S]*?)(?=\n\n\[|$)/);
    if (sigMatch) {
      const sigBlock = sigMatch[1];
      const signerLine = sigBlock.match(/Signed by: (.*?) at (.*?)(\n|$)/);
      if (signerLine) {
        result.customerSignerName = signerLine[1].trim();
        result.signedAt = signerLine[2].trim();
      }
      const dataLine = sigBlock.match(/SignatureData: (data:image\/[^\s]+|[A-Za-z0-9+/=]+)/);
      if (dataLine) {
        result.customerSignature = dataLine[1].trim();
      }
    }

    // 3. Photos JSON
    const photosMatch = text.match(/\[BEFORE & AFTER PHOTOS JSON\]\n([\s\S]*?)(?=\n\n\[|$)/);
    if (photosMatch) {
      try {
        const parsedPhotos = JSON.parse(photosMatch[1].trim());
        if (Array.isArray(parsedPhotos)) {
          result.photos = parsedPhotos;
        }
      } catch {
        // Fall through
      }
    }

    // 4. Billable Items
    const billablesMatch = text.match(/\[TECHNICIAN BILLABLE ITEMS\]\n([\s\S]*?)(?=\n\n\[|$)/);
    if (billablesMatch) {
      const lines = billablesMatch[1].split('\n').map((l) => l.trim()).filter(Boolean);
      lines.forEach((line, idx) => {
        // format: • Description | Qty: 1 | Price: 85.00 | Taxable: true
        const clean = line.replace(/^[•\-*]\s*/, '');
        const segments = clean.split('|').map((s) => s.trim());
        if (segments.length >= 3) {
          const desc = segments[0];
          let qty = 1;
          let price = 0;
          let taxable = true;

          const qtyMatch = segments[1]?.match(/Qty:\s*(\d+(?:\.\d+)?)/i);
          if (qtyMatch) qty = parseFloat(qtyMatch[1]);

          const priceMatch = segments[2]?.match(/Price:\s*\$?(\d+(?:\.\d+)?)/i);
          if (priceMatch) price = parseFloat(priceMatch[1]);

          if (segments[3]) {
            const taxMatch = segments[3]?.match(/Taxable:\s*(true|false)/i);
            if (taxMatch) taxable = taxMatch[1].toLowerCase() === 'true';
          }

          result.billItems.push({
            id: `tech-billable-${idx}-${Date.now()}`,
            description: desc,
            quantity: qty,
            unitPrice: price,
            taxable,
          });
        } else if (clean) {
          // Fallback single line item
          result.billItems.push({
            id: `tech-billable-${idx}-${Date.now()}`,
            description: clean,
            quantity: 1,
            unitPrice: 95.0,
            taxable: true,
          });
        }
      });
    }

    return result;
  }

  // Legacy or unformatted notes: Treat raw text as summary, and inspect for bullet items
  result.summaryNotes = text;
  const rawLines = text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('•') || l.startsWith('-'));
  if (rawLines.length > 0) {
    rawLines.forEach((line, idx) => {
      let clean = line.replace(/^[•\-]\s*/, '').trim();
      let qty = 1;
      let price = 120.0;
      let taxable = true;

      const qtyMatch = clean.match(/\(Qty:\s*(\d+(?:\.\d+)?)\)/i);
      if (qtyMatch) {
        qty = parseFloat(qtyMatch[1]);
        clean = clean.replace(/\(Qty:\s*\d+(?:\.\d+)?\)/i, '').trim();
      }

      const priceMatch = clean.match(/\$(\d+(?:\.\d+)?)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1]);
      }

      result.billItems.push({
        id: `legacy-item-${idx}-${Date.now()}`,
        description: clean,
        quantity: qty,
        unitPrice: price,
        taxable,
      });
    });
  }

  return result;
}
