# Bài tập NestJS: Content Microservice

## Tổng quan

Xây dựng REST API (Swagger) cho hệ thống quản lý bài post và comment, sử dụng PostgreSQL.

### Entities

- **User**: người dùng (tác giả của post, người comment)
- **Post**: bài viết, có tác giả là User
- **Comment**: bình luận của Post, có người comment là User

### Relationships

```
User (1) ──────< Post (nhiều)      [author]
User (1) ──────< Comment (nhiều)   [commenter]
Post (1) ──────< Comment (nhiều)   [comments]
```

### APIs cần build

| Method | URL                                   | Chức năng              |
| ------ | ------------------------------------- | ---------------------- |
| GET    | /users                                | Lấy danh sách users    |
| POST   | /users                                | Tạo user mới           |
| GET    | /posts                                | Lấy danh sách posts    |
| GET    | /posts/:id                            | Lấy chi tiết post      |
| POST   | /posts                                | Tạo post mới           |
| PATCH  | /posts/:id                            | Sửa post               |
| DELETE | /posts/:id                            | Xoá post               |
| GET    | /posts/:postId/comments               | Lấy comments của post  |
| POST   | /posts/:postId/comments               | Thêm comment vào post  |
| PATCH  | /posts/:postId/comments/:id           | Sửa comment            |
| DELETE | /posts/:postId/comments/:id           | Xoá comment            |

---

## STEP 1 — Cài dependencies

```bash
npm install @nestjs/typeorm typeorm pg @nestjs/config
npm install @nestjs/swagger
npm install class-validator class-transformer
```

**Giải thích từng package:**

| Package              | Mục đích                                           |
| -------------------- | -------------------------------------------------- |
| `@nestjs/typeorm`    | NestJS module wrapper cho TypeORM                  |
| `typeorm`            | ORM để tương tác với PostgreSQL                    |
| `pg`                 | PostgreSQL driver                                  |
| `@nestjs/config`     | Đọc biến môi trường từ `.env`                      |
| `@nestjs/swagger`    | Tự động generate Swagger UI                        |
| `class-validator`    | Validate dữ liệu input bằng decorator              |
| `class-transformer`  | Transform plain object → class instance (cho DTO)  |

---

## STEP 2 — Tạo file `.env`

Tạo file `.env` ở root project:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=content_ms
```

> **Lưu ý:** Tạo database `content_ms` trong PostgreSQL trước khi chạy.

---

## STEP 3 — Cấu hình Database trong `AppModule`

**File:** `src/app.module.ts`

Thêm `ConfigModule` và `TypeOrmModule` vào imports:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    // 1. Load biến môi trường từ .env, dùng được toàn app (isGlobal: true)
    ConfigModule.forRoot({ isGlobal: true }),

    // 2. Kết nối PostgreSQL qua TypeORM
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT'),
        username: config.get('DATABASE_USER'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity.{ts,js}'],
        synchronize: true, // DEV ONLY: tự tạo/update bảng theo entity
      }),
    }),
  ],
})
export class AppModule {}
```

> **`synchronize: true`**: TypeORM tự động tạo/sửa schema DB theo entity. Chỉ dùng khi dev, không dùng production.

---

## STEP 4 — Tạo User module

### Cấu trúc file

```
src/
└── users/
    ├── entities/
    │   └── user.entity.ts
    ├── dto/
    │   └── create-user.dto.ts
    ├── users.service.ts
    └── users.module.ts
    └── users.controller.ts
```

### 4.1 — Tạo Entity `user.entity.ts`

Entity = class ánh xạ đến 1 bảng trong DB.

```typescript
// src/users/entities/user.entity.ts
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')          // → tên bảng trong DB là "users"
export class User {
  @PrimaryGeneratedColumn()
  id: number;             // tự tăng

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @CreateDateColumn()
  createdAt: Date;        // TypeORM tự set khi INSERT

  @UpdateDateColumn()
  updatedAt: Date;        // TypeORM tự set khi UPDATE

  // Relationships (define sau khi có Post và Comment entity)
  // @OneToMany(() => Post, (post) => post.author)
  // posts: Post[];
}
```

### 4.2 — Tạo DTO `create-user.dto.ts`

DTO (Data Transfer Object) = shape của dữ liệu đầu vào từ request body.

```typescript
// src/users/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'a@example.com' })
  @IsEmail()
  email: string;
}
```

### 4.3 — Tạo Service `users.service.ts`

Service = nơi chứa business logic. Controller gọi Service, Service gọi Repository.

```typescript
// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  create(dto: CreateUserDto): Promise<User> {
    const user = this.userRepo.create(dto); // tạo instance
    return this.userRepo.save(user);        // INSERT vào DB
  }
}
```

### 4.4 — Tạo Controller `users.controller.ts`

Controller = nơi nhận HTTP request, gọi Service, trả response.

```typescript
// src/users/users.controller.ts
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@ApiTags('users')           // group trong Swagger UI
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}
```

### 4.5 — Tạo Module `users.module.ts`

Module = đóng gói 1 feature, khai báo providers và exports.

```typescript
// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // đăng ký UserRepository
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],  // export để PostsModule dùng được
})
export class UsersModule {}
```

### 4.6 — Import UsersModule vào AppModule

```typescript
// src/app.module.ts — thêm vào imports[]
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot(...),
    TypeOrmModule.forRootAsync(...),
    UsersModule,  // ← thêm vào đây
  ],
})
export class AppModule {}
```

---

## STEP 5 — Tạo Post module

### Cấu trúc file

```
src/
└── posts/
    ├── entities/
    │   └── post.entity.ts
    ├── dto/
    │   ├── create-post.dto.ts
    │   └── update-post.dto.ts
    ├── posts.service.ts
    ├── posts.controller.ts
    └── posts.module.ts
```

### 5.1 — Entity `post.entity.ts`

```typescript
// src/posts/entities/post.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  // Relationship: Many posts → One user (author)
  // { eager: true } = TypeORM tự JOIN khi find post
  @ManyToOne(() => User, { eager: true, nullable: false })
  author: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationship với Comment (define sau)
  // @OneToMany(() => Comment, (comment) => comment.post)
  // comments: Comment[];
}
```

> **`@ManyToOne`**: nhiều Post thuộc về 1 User. TypeORM tự tạo cột `authorId` trong bảng `posts`.

### 5.2 — DTO

```typescript
// src/posts/dto/create-post.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, MinLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'Tiêu đề bài viết' })
  @IsString()
  @MinLength(5)
  title: string;

  @ApiProperty({ example: 'Nội dung bài viết...' })
  @IsString()
  @MinLength(10)
  content: string;

  @ApiProperty({ example: 1, description: 'ID của tác giả' })
  @IsNumber()
  authorId: number;
}
```

```typescript
// src/posts/dto/update-post.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto.js';

// PartialType: tất cả field của CreatePostDto đều trở thành optional
// Dùng từ @nestjs/swagger (không phải @nestjs/mapped-types) để Swagger hiểu
export class UpdatePostDto extends PartialType(CreatePostDto) {}
```

### 5.3 — Service `posts.service.ts`

```typescript
// src/posts/posts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly usersService: UsersService,
  ) {}

  findAll(): Promise<Post[]> {
    return this.postRepo.find();
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException(`Post #${id} not found`);
    return post;
  }

  async create(dto: CreatePostDto): Promise<Post> {
    const author = await this.usersService.findOne(dto.authorId);
    const post = this.postRepo.create({ ...dto, author });
    return this.postRepo.save(post);
  }

  async update(id: number, dto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id); // ném 404 nếu không tìm thấy
    Object.assign(post, dto);
    return this.postRepo.save(post);
  }

  async remove(id: number): Promise<void> {
    const post = await this.findOne(id);
    await this.postRepo.remove(post);
  }
}
```

> **Lưu ý:** `usersService.findOne` chưa có — cần thêm vào UsersService sau.

### 5.4 — Controller `posts.controller.ts`

```typescript
// src/posts/posts.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    // ParseIntPipe: tự động convert string → number, trả 400 nếu không hợp lệ
    return this.postsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.remove(id);
  }
}
```

### 5.5 — Module `posts.module.ts`

```typescript
// src/posts/posts.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity.js';
import { PostsService } from './posts.service.js';
import { PostsController } from './posts.controller.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    UsersModule,  // import để dùng UsersService
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService], // export để CommentsModule dùng
})
export class PostsModule {}
```

### 5.6 — Thêm `findOne` vào UsersService

```typescript
// Thêm vào src/users/users.service.ts
async findOne(id: number): Promise<User> {
  const user = await this.userRepo.findOne({ where: { id } });
  if (!user) throw new NotFoundException(`User #${id} not found`);
  return user;
}
```

---

## STEP 6 — Tạo Comment module

### Cấu trúc file

```
src/
└── comments/
    ├── entities/
    │   └── comment.entity.ts
    ├── dto/
    │   ├── create-comment.dto.ts
    │   └── update-comment.dto.ts
    ├── comments.service.ts
    ├── comments.controller.ts
    └── comments.module.ts
```

### 6.1 — Entity `comment.entity.ts`

```typescript
// src/comments/entities/comment.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  // Mỗi comment thuộc về 1 post
  @ManyToOne(() => Post, { nullable: false, onDelete: 'CASCADE' })
  post: Post;
  // onDelete: 'CASCADE' → khi Post bị xoá, Comment cũng tự xoá

  // Mỗi comment có 1 người viết (User)
  @ManyToOne(() => User, { eager: true, nullable: false })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 6.2 — DTOs

```typescript
// src/comments/dto/create-comment.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Bình luận hay quá!' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiProperty({ example: 1, description: 'ID của người comment' })
  @IsNumber()
  userId: number;
}
```

```typescript
// src/comments/dto/update-comment.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ example: 'Nội dung mới', required: false })
  @IsString()
  @MinLength(1)
  @IsOptional()
  content?: string;
}
```

### 6.3 — Service `comments.service.ts`

```typescript
// src/comments/comments.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';
import { PostsService } from '../posts/posts.service.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) {}

  async findByPost(postId: number): Promise<Comment[]> {
    await this.postsService.findOne(postId); // validate post tồn tại
    return this.commentRepo.find({
      where: { post: { id: postId } },
    });
  }

  async create(postId: number, dto: CreateCommentDto): Promise<Comment> {
    const post = await this.postsService.findOne(postId);
    const user = await this.usersService.findOne(dto.userId);
    const comment = this.commentRepo.create({ content: dto.content, post, user });
    return this.commentRepo.save(comment);
  }

  async update(postId: number, commentId: number, dto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.findOne(postId, commentId);
    Object.assign(comment, dto);
    return this.commentRepo.save(comment);
  }

  async remove(postId: number, commentId: number): Promise<void> {
    const comment = await this.findOne(postId, commentId);
    await this.commentRepo.remove(comment);
  }

  // Helper: tìm comment thuộc về đúng post
  private async findOne(postId: number, commentId: number): Promise<Comment> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId, post: { id: postId } },
    });
    if (!comment) throw new NotFoundException(`Comment #${commentId} not found in Post #${postId}`);
    return comment;
  }
}
```

### 6.4 — Controller `comments.controller.ts`

```typescript
// src/comments/comments.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';

@ApiTags('comments')
@Controller('posts/:postId/comments')  // nested route
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  findAll(@Param('postId', ParseIntPipe) postId: number) {
    return this.commentsService.findByPost(postId);
  }

  @Post()
  create(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(postId, dto);
  }

  @Patch(':id')
  update(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(postId, id, dto);
  }

  @Delete(':id')
  remove(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.commentsService.remove(postId, id);
  }
}
```

### 6.5 — Module `comments.module.ts`

```typescript
// src/comments/comments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity.js';
import { CommentsService } from './comments.service.js';
import { CommentsController } from './comments.controller.js';
import { PostsModule } from '../posts/posts.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    PostsModule,
    UsersModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
```

### 6.6 — Import vào AppModule

```typescript
// src/app.module.ts
import { CommentsModule } from './comments/comments.module.js';
import { PostsModule } from './posts/posts.module.js';

@Module({
  imports: [
    ConfigModule.forRoot(...),
    TypeOrmModule.forRootAsync(...),
    UsersModule,
    PostsModule,
    CommentsModule,
  ],
})
export class AppModule {}
```

---

## STEP 7 — Setup Swagger trong `main.ts`

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Enable global validation (dùng class-validator decorators trong DTO)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // tự động strip field không có trong DTO
      forbidNonWhitelisted: true, // trả 400 nếu có field lạ
      transform: true,       // tự convert string → number cho @Param
    }),
  );

  // 2. Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Content Microservice API')
    .setDescription('API quản lý Post và Comment')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  // → Swagger UI tại: http://localhost:3000/api

  await app.listen(process.env.PORT ?? 3000);
  console.log('Server running on http://localhost:3000');
  console.log('Swagger UI: http://localhost:3000/api');
}
await bootstrap();
```

---

## STEP 8 — Chạy và kiểm tra

```bash
# Chạy development server
npm run start:dev

# Mở Swagger UI
open http://localhost:3000/api
```

### Thứ tự test trên Swagger:

1. **POST /users** — Tạo 2 users (user A và user B)
2. **POST /posts** — Tạo post với `authorId` của user A
3. **GET /posts** — Kiểm tra post vừa tạo
4. **POST /posts/:postId/comments** — Thêm comment với `userId` của user B
5. **GET /posts/:postId/comments** — Kiểm tra comment
6. **PATCH /posts/:id** — Sửa nội dung post
7. **PATCH /posts/:postId/comments/:id** — Sửa comment
8. **DELETE /posts/:postId/comments/:id** — Xoá comment
9. **DELETE /posts/:id** — Xoá post (comment sẽ bị xoá theo `CASCADE`)

---

## Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách fix |
| --- | ----------- | -------- |
| `Cannot find module ... .js` | ESM import thiếu `.js` | Thêm `.js` vào cuối import |
| `Connection refused` | PostgreSQL chưa chạy | Khởi động PostgreSQL |
| `password authentication failed` | Sai credentials DB | Kiểm tra `.env` |
| `class-validator not working` | Thiếu `useGlobalPipes` | Thêm `ValidationPipe` vào `main.ts` |
| `Column ... of relation ... does not exist` | Entity thay đổi nhưng DB chưa sync | Restart server (với `synchronize: true`) |

---

## Checklist hoàn thành

- [ ] STEP 1: Cài dependencies
- [ ] STEP 2: Tạo `.env`
- [ ] STEP 3: Cấu hình TypeORM trong AppModule
- [ ] STEP 4: Tạo User module (entity, dto, service, controller, module)
- [ ] STEP 5: Tạo Post module (entity, dto, service, controller, module)
- [ ] STEP 6: Tạo Comment module (entity, dto, service, controller, module)
- [ ] STEP 7: Setup Swagger + ValidationPipe trong `main.ts`
- [ ] STEP 8: Chạy và test trên Swagger UI
