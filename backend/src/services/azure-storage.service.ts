import { Service } from 'typedi';
import { BlobServiceClient, ContainerClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob';
import { HttpException } from '@exceptions/HttpException';

@Service()
export class AzureStorageService {
  private readonly blobServiceClient: BlobServiceClient;
  private readonly containerClient: ContainerClient;

  constructor() {
    if (!process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_STORAGE_CONNECTION_STRING.trim() === '') {
      throw new HttpException(500, 'Azure Storage connection string not configured');
    }

    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    
    this.containerClient = this.blobServiceClient.getContainerClient(
      process.env.AZURE_STORAGE_CONTAINER_NAME || 'session-recordings'
    );
  }

  /**
   * Initialize the container if it doesn't exist
   */
  public async initializeContainer(): Promise<void> {
    try {
      await this.containerClient.createIfNotExists();
    } catch (error) {
      throw new HttpException(500, `Failed to initialize Azure storage container: ${error.message}`);
    }
  }

  /**
   * Upload a recording file to Azure Blob Storage
   */
  public async uploadRecording(
    buffer: Buffer, 
    fileName: string, 
    contentType: string = 'video/webm'
  ): Promise<string> {
    try {
      await this.initializeContainer();

      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      
      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: contentType,
        },
        metadata: {
          uploadedAt: new Date().toISOString(),
          type: 'session-recording'
        }
      });

      return blockBlobClient.url;
    } catch (error) {
      throw new HttpException(500, `Failed to upload recording to Azure Storage: ${error.message}`);
    }
  }

  /**
   * Get a signed download URL for a recording (valid for 24 hours)
   */
  public async getRecordingUrl(fileName: string): Promise<string> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      
      // Generate SAS token for private blob access
      const sasOptions = {
        containerName: this.containerClient.containerName,
        blobName: fileName,
        permissions: BlobSASPermissions.parse('r'), // read permission
        startsOn: new Date(),
        expiresOn: new Date(new Date().valueOf() + 86400 * 1000), // 24 hours
      };

      // Extract account name and key from connection string
      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
      const accountNameMatch = /AccountName=([^;]+)/.exec(connectionString);
      const accountKeyMatch = /AccountKey=([^;]+)/.exec(connectionString);
      const accountName = accountNameMatch ? accountNameMatch[1] : undefined;
      const accountKey = accountKeyMatch ? accountKeyMatch[1] : undefined;
      
      if (!accountName || !accountKey) {
        throw new Error('Cannot extract account credentials from connection string');
      }

      const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
      const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
      
      return `${blockBlobClient.url}?${sasToken}`;
    } catch (error) {
      throw new HttpException(500, `Failed to generate recording URL: ${error.message}`);
    }
  }

  /**
   * Delete a recording from Azure Blob Storage
   */
  public async deleteRecording(fileName: string): Promise<void> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      await blockBlobClient.deleteIfExists();
    } catch (error) {
      throw new HttpException(500, `Failed to delete recording: ${error.message}`);
    }
  }

  /**
   * List all recordings for a specific session
   */
  public async listSessionRecordings(sessionId: string): Promise<string[]> {
    try {
      const recordings: string[] = [];
      
      for await (const blob of this.containerClient.listBlobsFlat({
        prefix: `session-${sessionId}-`
      })) {
        recordings.push(blob.name);
      }
      
      return recordings;
    } catch (error) {
      throw new HttpException(500, `Failed to list recordings: ${error.message}`);
    }
  }
}