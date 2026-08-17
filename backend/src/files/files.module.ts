import { Module } from '@nestjs/common';
import { CloudBaseStorageService } from './cloudbase-storage.service';
import { ClientFilesController, FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({ controllers: [FilesController, ClientFilesController], providers: [FilesService, CloudBaseStorageService] })
export class FilesModule {}
