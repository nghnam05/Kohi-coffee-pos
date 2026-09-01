import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 0. Tăng dung lượng nhận payload cho JSON (phục vụ Upload ảnh Base64)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // 1. Kích hoạt Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động loại bỏ các trường không được khai báo trong DTO
      forbidNonWhitelisted: true, // Ném ra lỗi báo cáo nếu request gửi lên chứa các trường không hợp lệ
      transform: true, // Tự động chuyển đổi kiểu dữ liệu của payload theo đúng định dạng của DTO
    }),
  );

  // 2. Kích hoạt CORS toàn cục
  app.enableCors({
    origin: '*', // Trong môi trường production thực tế, bạn nên thay thế bằng domain của Frontend Next.js
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 3. Cài đặt tiền tố API toàn cục
  app.setGlobalPrefix('/api/v1');

  // Khởi động HTTP Server
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  
  console.log(`Backend Application is running on port: ${port}`);
}
bootstrap();
