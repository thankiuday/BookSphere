const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { config } = require('../config/env');

// Configure AWS
AWS.config.update({
  accessKeyId: config.s3.accessKeyId,
  secretAccessKey: config.s3.secretAccessKey,
  region: config.s3.region
});

const s3 = new AWS.S3();

// Upload file to S3
const uploadToS3 = async (file, fileName, folder = 'books') => {
  try {
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${folder}/${uuidv4()}.${fileExtension}`;
    
    const params = {
      Bucket: config.s3.bucketName,
      Key: uniqueFileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString()
      }
    };

    const result = await s3.upload(params).promise();
    
    return {
      url: result.Location,
      key: result.Key,
      fileName: uniqueFileName
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

// Delete file from S3
const deleteFromS3 = async (fileKey) => {
  try {
    const params = {
      Bucket: config.s3.bucketName,
      Key: fileKey
    };

    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

// Generate presigned URL for temporary access
const generatePresignedUrl = async (fileKey, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: config.s3.bucketName,
      Key: fileKey,
      Expires: expiresIn
    };

    const url = await s3.getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    console.error('S3 presigned URL error:', error);
    throw new Error('Failed to generate presigned URL');
  }
};

// Check if file exists in S3
const fileExists = async (fileKey) => {
  try {
    const params = {
      Bucket: config.s3.bucketName,
      Key: fileKey
    };

    await s3.headObject(params).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
};

// Download file from S3
const downloadFromS3 = async (fileUrl) => {
  try {
    // Extract key from URL - handle both S3 URLs and presigned URLs
    let key;
    if (fileUrl.includes('amazonaws.com')) {
      // S3 URL format: https://bucket-name.s3.region.amazonaws.com/folder/filename
      const urlParts = fileUrl.split('/');
      key = urlParts.slice(3).join('/'); // Remove protocol, domain, and bucket
    } else {
      // Presigned URL or other format
      const urlParts = fileUrl.split('/');
      key = urlParts.slice(-2).join('/'); // Get the last two parts (folder/filename)
    }
    
    console.log('Extracted S3 key:', key);
    
    const params = {
      Bucket: config.s3.bucketName,
      Key: key
    };

    const result = await s3.getObject(params).promise();
    return result.Body;
  } catch (error) {
    console.error('S3 download error:', error);
    console.error('File URL:', fileUrl);
    throw new Error('Failed to download file from S3');
  }
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  generatePresignedUrl,
  fileExists,
  downloadFromS3
};
