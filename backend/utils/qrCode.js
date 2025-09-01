const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// Generate QR code for a URL
const generateQRCode = async (url, options = {}) => {
  try {
    const defaultOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#002D62', // Garden City University deep blue
        light: '#FFFFFF'
      },
      width: 300
    };

    const qrOptions = { ...defaultOptions, ...options };
    
    const qrCodeDataURL = await QRCode.toDataURL(url, qrOptions);
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Generate QR code and save to S3
const generateAndSaveQRCode = async (url, s3Utils, folder = 'qr-codes') => {
  try {
    // Generate QR code as buffer
    const qrCodeBuffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#002D62', // Garden City University deep blue
        light: '#FFFFFF'
      },
      width: 300
    });

    // Create a file-like object for S3 upload
    const qrFile = {
      buffer: qrCodeBuffer,
      mimetype: 'image/png',
      originalname: `qr-${uuidv4()}.png`
    };

    // Upload to S3
    const result = await s3Utils.uploadToS3(qrFile, qrFile.originalname, folder);
    
    return {
      url: result.url,
      key: result.key,
      dataURL: await QRCode.toDataURL(url)
    };
  } catch (error) {
    console.error('QR code generation and save error:', error);
    throw new Error('Failed to generate and save QR code');
  }
};

// Generate QR code for book subdomain
const generateBookQRCode = async (subdomain, s3Utils) => {
  try {
    const bookUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/chatwith/${subdomain}`;
    console.log('Generating QR code for URL:', bookUrl);
    
    // Generate QR code as buffer with better scanning properties
    const qrCodeBuffer = await QRCode.toBuffer(bookUrl, {
      errorCorrectionLevel: 'H', // High error correction for better scanning
      type: 'image/png',
      quality: 1.0, // Maximum quality
      margin: 4, // Larger margin for better scanning
      color: {
        dark: '#000000', // Pure black for better contrast
        light: '#FFFFFF' // Pure white background
      },
      width: 512 // Larger size for better scanning
    });

    // Create a file-like object for S3 upload
    const qrFile = {
      buffer: qrCodeBuffer,
      mimetype: 'image/png',
      originalname: `qr-${uuidv4()}.png`
    };

    // Upload to S3 (without ACL since bucket has ACLs disabled)
    const result = await s3Utils.uploadToS3(qrFile, qrFile.originalname, 'book-qr-codes');
    
    // Generate a presigned URL for public access (valid for 7 days - AWS maximum)
    const presignedUrl = await s3Utils.generatePresignedUrl(result.key, 604800); // 7 days in seconds
    
    return {
      qrCodeUrl: presignedUrl, // Use presigned URL for public access
      qrCodeKey: result.key,
      bookUrl: bookUrl,
      qrDataURL: await QRCode.toDataURL(bookUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 1.0,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 512
      }), // Keep data URL as backup
      expiresAt: new Date(Date.now() + 604800 * 1000) // 7 days from now
    };
  } catch (error) {
    console.error('Book QR code generation error:', error);
    throw new Error('Failed to generate book QR code');
  }
};

// Generate QR code with custom styling
const generateStyledQRCode = async (url, style = 'default') => {
  try {
    const styles = {
      default: {
        color: { dark: '#002D62', light: '#FFFFFF' },
        width: 300
      },
      green: {
        color: { dark: '#006A4E', light: '#FFFFFF' },
        width: 300
      },
      dark: {
        color: { dark: '#000000', light: '#FFFFFF' },
        width: 300
      },
      light: {
        color: { dark: '#002D62', light: '#F9F9F9' },
        width: 300
      }
    };

    const selectedStyle = styles[style] || styles.default;
    
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      ...selectedStyle
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('Styled QR code generation error:', error);
    throw new Error('Failed to generate styled QR code');
  }
};

// Refresh presigned URL for QR code
const refreshQRCodeUrl = async (qrCodeKey, s3Utils) => {
  try {
    const presignedUrl = await s3Utils.generatePresignedUrl(qrCodeKey, 604800); // 7 days
    return {
      qrCodeUrl: presignedUrl,
      expiresAt: new Date(Date.now() + 604800 * 1000)
    };
  } catch (error) {
    console.error('QR code URL refresh error:', error);
    throw new Error('Failed to refresh QR code URL');
  }
};

module.exports = {
  generateQRCode,
  generateAndSaveQRCode,
  generateBookQRCode,
  generateStyledQRCode,
  refreshQRCodeUrl
};
