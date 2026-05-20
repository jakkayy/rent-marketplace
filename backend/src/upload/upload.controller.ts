import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';

const imageFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    cb(new BadRequestException('Only jpg, png, and webp files are allowed'), false);
    return;
  }
  cb(null, true);
};

const multerOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
};

@Controller('upload')
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    const url = await this.storageService.upload(file);
    return { url, originalName: file.originalname, size: file.size };
  }

  @Post('multiple')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('No files provided');
    const urls = await Promise.all(files.map((f) => this.storageService.upload(f)));
    return urls.map((url, i) => ({
      url,
      originalName: files[i].originalname,
      size: files[i].size,
    }));
  }
}
