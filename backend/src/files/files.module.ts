import { Module } from '@nestjs/common';
import { CloudBaseStorageService } from './cloudbase-storage.service';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({ controllers: [FilesController], providers: [FilesService, CloudBaseStorageService] })
export class FilesModule {}
