import {
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getBucketConfig, createS3Client } from './aws-config';

let s3ClientInstance: ReturnType<typeof createS3Client> | null = null;

function getS3Client() {
  if (!s3ClientInstance) {
    s3ClientInstance = createS3Client();
  }
  return s3ClientInstance;
}

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic = false,
) {
  const { bucketName, folderPrefix } = getBucketConfig();
  const client = getS3Client();

  const prefix = isPublic ? 'public/uploads' : 'uploads';
  const cloud_storage_path = `${folderPrefix}${prefix}/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ContentType: contentType,
    ContentDisposition: isPublic ? 'attachment' : undefined,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

  return { uploadUrl, cloud_storage_path };
}

export async function initiateMultipartUpload(
  fileName: string,
  isPublic = false,
) {
  const { bucketName, folderPrefix } = getBucketConfig();
  const client = getS3Client();

  const prefix = isPublic ? 'public/uploads' : 'uploads';
  const cloud_storage_path = `${folderPrefix}${prefix}/${Date.now()}-${fileName}`;

  const command = new CreateMultipartUploadCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ContentDisposition: isPublic ? 'attachment' : undefined,
  });

  const response = await client.send(command);

  return {
    uploadId: response.UploadId,
    cloud_storage_path,
  };
}

export async function getPresignedUrlForPart(
  cloud_storage_path: string,
  uploadId: string,
  partNumber: number,
) {
  const { bucketName } = getBucketConfig();
  const client = getS3Client();

  const command = new UploadPartCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

  return uploadUrl;
}

export async function completeMultipartUpload(
  cloud_storage_path: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[],
) {
  const { bucketName } = getBucketConfig();
  const client = getS3Client();

  const command = new CompleteMultipartUploadCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });

  await client.send(command);
}

export async function getFileUrl(
  cloud_storage_path: string,
  isPublic: boolean,
) {
  // If already a full URL (http/https), return as-is
  if (
    cloud_storage_path?.startsWith('http://') ||
    cloud_storage_path?.startsWith('https://')
  ) {
    return cloud_storage_path;
  }

  const { bucketName } = getBucketConfig();
  const client = getS3Client();

  if (isPublic) {
    const region = await client.config.region();
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ResponseContentDisposition: 'attachment',
  });

  return await getSignedUrl(client, command, { expiresIn: 3600 });
}

export async function deleteFile(cloud_storage_path: string) {
  const { bucketName } = getBucketConfig();
  const client = getS3Client();

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
  });

  await client.send(command);
}
