// expect: sonic-be/uploaded-file-pipe
import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
} from '@nestjs/common';

@Controller('bad-upload')
export class BadUploadController {
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  upload(@UploadedFile() file: Buffer): void {
    void file;
  }
}
