import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cloudbase from '@cloudbase/node-sdk';

@Injectable()
export class CloudBaseStorageService {
  private app?: ReturnType<typeof cloudbase.init>;

  constructor(private readonly config: ConfigService) {}

  async upload(cloudPath: string, content: Buffer) {
    const result = await this.client().uploadFile({ cloudPath, fileContent: content });
    try {
      const url = await this.temporaryUrl(result.fileID);
      return { fileId: result.fileID, url };
    } catch (error) {
      await this.remove(result.fileID).catch(() => undefined);
      throw error;
    }
  }

  async remove(fileId: string) {
    await this.client().deleteFile({ fileList: [fileId] });
  }

  async temporaryUrl(fileId: string, maxAge = 3600) {
    const result = await this.client().getTempFileURL({ fileList: [{ fileID: fileId, maxAge }] });
    const item = result.fileList?.[0];
    if (!item?.tempFileURL) throw new ServiceUnavailableException('云存储暂时无法生成访问地址');
    return item.tempFileURL;
  }

  private client() {
    if (this.app) return this.app;
    const env = this.config.get<string>('CLOUDBASE_ENV_ID');
    if (!env) throw new ServiceUnavailableException('尚未配置 CloudBase 云存储环境');
    const secretId = this.config.get<string>('TENCENTCLOUD_SECRET_ID');
    const secretKey = this.config.get<string>('TENCENTCLOUD_SECRET_KEY');
    this.app = cloudbase.init({
      env,
      ...(secretId && secretKey ? { secretId, secretKey } : {}),
    });
    return this.app;
  }
}
