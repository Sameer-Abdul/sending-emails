import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '@/email/email.module';
import { UploadModule } from '@/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EmailModule, 
    UploadModule
  ],
})
export class AppModule {}
