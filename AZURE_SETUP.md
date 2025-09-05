# Azure Blob Storage Setup for Video Recording

This document explains how to configure Azure Blob Storage for storing session recordings.

## Prerequisites

1. Azure account with an active subscription
2. Azure Storage Account created

## Setup Steps

### 1. Create Azure Storage Account

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new Storage Account
3. Choose appropriate performance and redundancy settings
4. Note down the storage account name

### 2. Get Connection String

1. Navigate to your Storage Account in Azure Portal
2. Go to "Access keys" under "Security + networking"
3. Copy the "Connection string" from Key 1 or Key 2

### 3. Update Environment Variables

Replace the placeholder in `.env` file:

```env
# AZURE BLOB STORAGE
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=your_account;AccountKey=your_key;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=session-recordings
```

### 4. Container Configuration

The application will automatically create the container `session-recordings` with public blob access for downloading recorded videos.

## File Structure

Recordings are stored with the following naming convention:
```
session-{sessionId}-{timestamp}.webm
```

Example: `session-507f1f77bcf86cd799439011-2024-01-15T10-30-00-000Z.webm`

## Security Notes

- The container has public blob access to allow direct video playback
- Only authenticated educators can upload recordings
- Access is controlled through session participation verification
- Consider implementing Azure CDN for better video delivery performance

## Storage Costs

Video recordings can be large files. Monitor storage usage and consider:
- Lifecycle policies to move old recordings to cooler storage tiers
- Automatic deletion of recordings after a specified period
- Compression settings for recordings

## Troubleshooting

1. **Upload fails**: Check connection string and ensure container exists
2. **Access denied**: Verify Azure Storage account permissions
3. **Large file uploads**: Ensure multer file size limit accommodates video files
4. **Slow uploads**: Consider implementing resumable uploads for large files