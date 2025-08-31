// PII Protection utilities for Buddy chatbot
// Detects and masks personally identifiable information

export interface PIIDetectionResult {
  hasPII: boolean;
  detectedTypes: string[];
  maskedContent: string;
  originalContent: string;
}

export interface PIIProtectionSettings {
  maskEmails: boolean;
  maskPhoneNumbers: boolean;
  maskNames: boolean;
  maskAddresses: boolean;
  maskCreditCards: boolean;
  maskSSNs: boolean;
  allowedDomains: string[];
}

class PIIProtector {
  private settings: PIIProtectionSettings;

  // Common German and English names (simplified list)
  private commonNames = [
    // German names
    'alexander', 'andreas', 'christian', 'daniel', 'david', 'florian', 'jan', 'jonas', 'julian', 'lukas',
    'marcel', 'markus', 'martin', 'matthias', 'michael', 'nico', 'patrick', 'paul', 'sebastian', 'stefan',
    'thomas', 'tim', 'tobias', 'anna', 'christina', 'daniela', 'elena', 'emma', 'hannah', 'julia',
    'katharina', 'laura', 'lea', 'lena', 'lisa', 'marie', 'melanie', 'nadine', 'nicole', 'sabrina',
    'sandra', 'sarah', 'stefanie', 'vanessa',
    // English names
    'james', 'john', 'robert', 'michael', 'william', 'david', 'richard', 'joseph', 'thomas', 'christopher',
    'charles', 'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua',
    'mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica', 'sarah', 'karen',
    'nancy', 'lisa', 'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle'
  ];

  // Regex patterns for different PII types
  private patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /(?:\+49|0)[\s\-]?(?:\([0-9]{2,5}\)|[0-9]{2,5})[\s\-]?[0-9]{3,}[\s\-]?[0-9]{2,}/g,
    germanPhone: /(?:0[1-9][0-9]{1,4}[\s\-]?[0-9]{3,}[\s\-]?[0-9]{2,})|(?:\+49[\s\-]?[1-9][0-9]{1,4}[\s\-]?[0-9]{3,}[\s\-]?[0-9]{2,})/g,
    creditCard: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    ssn: /\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b/g,
    germanId: /\b[0-9]{11}\b/g, // Simplified German ID pattern
    address: /\b\d+\s+[A-Za-z\s]+(?:Straße|Str\.|Street|St\.|Avenue|Ave\.|Road|Rd\.)\b/gi,
    postalCode: /\b\d{5}(?:-\d{4})?\b/g,
    germanPostalCode: /\b[0-9]{5}\b/g
  };

  constructor(settings?: Partial<PIIProtectionSettings>) {
    this.settings = {
      maskEmails: true,
      maskPhoneNumbers: true,
      maskNames: false, // Names are tricky to detect accurately
      maskAddresses: true,
      maskCreditCards: true,
      maskSSNs: true,
      allowedDomains: ['studybuddy.app', 'ufs.de'], // Allowed domains that won't be masked
      ...settings
    };
  }

  updateSettings(newSettings: Partial<PIIProtectionSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  detectAndMaskPII(content: string): PIIDetectionResult {
    let maskedContent = content;
    const detectedTypes: string[] = [];
    let hasPII = false;

    // Email detection and masking
    if (this.settings.maskEmails) {
      const emailMatches = content.match(this.patterns.email);
      if (emailMatches) {
        emailMatches.forEach(email => {
          const domain = email.split('@')[1];
          if (!this.settings.allowedDomains.includes(domain)) {
            maskedContent = maskedContent.replace(email, '[E-MAIL ENTFERNT]');
            detectedTypes.push('email');
            hasPII = true;
          }
        });
      }
    }

    // Phone number detection and masking
    if (this.settings.maskPhoneNumbers) {
      if (this.patterns.phone.test(content) || this.patterns.germanPhone.test(content)) {
        maskedContent = maskedContent.replace(this.patterns.phone, '[TELEFONNUMMER ENTFERNT]');
        maskedContent = maskedContent.replace(this.patterns.germanPhone, '[TELEFONNUMMER ENTFERNT]');
        detectedTypes.push('phone');
        hasPII = true;
      }
    }

    // Credit card detection and masking
    if (this.settings.maskCreditCards) {
      if (this.patterns.creditCard.test(content)) {
        maskedContent = maskedContent.replace(this.patterns.creditCard, '[KREDITKARTE ENTFERNT]');
        detectedTypes.push('creditCard');
        hasPII = true;
      }
    }

    // SSN detection and masking
    if (this.settings.maskSSNs) {
      if (this.patterns.ssn.test(content) || this.patterns.germanId.test(content)) {
        maskedContent = maskedContent.replace(this.patterns.ssn, '[SOZIALVERSICHERUNGSNUMMER ENTFERNT]');
        maskedContent = maskedContent.replace(this.patterns.germanId, '[AUSWEISNUMMER ENTFERNT]');
        detectedTypes.push('ssn');
        hasPII = true;
      }
    }

    // Address detection and masking
    if (this.settings.maskAddresses) {
      if (this.patterns.address.test(content)) {
        maskedContent = maskedContent.replace(this.patterns.address, '[ADRESSE ENTFERNT]');
        detectedTypes.push('address');
        hasPII = true;
      }
      
      // Postal codes
      if (this.patterns.postalCode.test(content) || this.patterns.germanPostalCode.test(content)) {
        maskedContent = maskedContent.replace(this.patterns.postalCode, '[PLZ ENTFERNT]');
        maskedContent = maskedContent.replace(this.patterns.germanPostalCode, '[PLZ ENTFERNT]');
        detectedTypes.push('postalCode');
        hasPII = true;
      }
    }

    // Name detection (basic implementation)
    if (this.settings.maskNames) {
      const words = content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        const cleanWord = word.replace(/[^a-z]/g, '');
        if (this.commonNames.includes(cleanWord) && cleanWord.length > 2) {
          const regex = new RegExp(`\\b${word}\\b`, 'gi');
          maskedContent = maskedContent.replace(regex, '[NAME ENTFERNT]');
          detectedTypes.push('name');
          hasPII = true;
        }
      });
    }

    return {
      hasPII,
      detectedTypes: [...new Set(detectedTypes)], // Remove duplicates
      maskedContent,
      originalContent: content
    };
  }

  // Check if content is safe to send (no PII detected)
  isSafeContent(content: string): boolean {
    const result = this.detectAndMaskPII(content);
    return !result.hasPII;
  }

  // Get a warning message for detected PII
  getPIIWarning(detectedTypes: string[]): string {
    const typeMessages = {
      email: 'E-Mail-Adressen',
      phone: 'Telefonnummern',
      name: 'Namen',
      address: 'Adressen',
      creditCard: 'Kreditkartennummern',
      ssn: 'Sozialversicherungsnummern',
      postalCode: 'Postleitzahlen'
    };

    const detectedNames = detectedTypes.map(type => typeMessages[type as keyof typeof typeMessages]).filter(Boolean);
    
    if (detectedNames.length === 0) return '';
    
    const typeList = detectedNames.join(', ');
    return `⚠️ Persönliche Daten erkannt: ${typeList}. Diese wurden automatisch entfernt, um Ihre Privatsphäre zu schützen.`;
  }
}

// Export singleton instance
export const piiProtector = new PIIProtector();

// Export class for custom instances
export { PIIProtector };

// Utility function for quick PII checking
export const checkForPII = (content: string): PIIDetectionResult => {
  return piiProtector.detectAndMaskPII(content);
};

// Utility function to get privacy settings from localStorage
export const getPrivacySettings = (): PIIProtectionSettings => {
  try {
    const saved = localStorage.getItem('buddy-privacy-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        maskEmails: parsed.sharePersonalInfo !== true,
        maskPhoneNumbers: parsed.sharePersonalInfo !== true,
        maskNames: parsed.sharePersonalInfo !== true,
        maskAddresses: parsed.sharePersonalInfo !== true,
        maskCreditCards: true, // Always mask credit cards
        maskSSNs: true, // Always mask SSNs
        allowedDomains: ['studybuddy.app', 'ufs.de']
      };
    }
  } catch (error) {
    console.error('Failed to load privacy settings:', error);
  }
  
  // Default settings
  return {
    maskEmails: true,
    maskPhoneNumbers: true,
    maskNames: false,
    maskAddresses: true,
    maskCreditCards: true,
    maskSSNs: true,
    allowedDomains: ['studybuddy.app', 'ufs.de']
  };
};

// Update PII protector settings based on user privacy preferences
export const updatePIIProtectorFromSettings = () => {
  const settings = getPrivacySettings();
  piiProtector.updateSettings(settings);
};