# NestJS — Giải thích đơn giản

> Ví dụ lấy từ project `content-ms`.

---

## 1. DTO

**DTO (Data Transfer Object)** là class định nghĩa **hình dạng dữ liệu** gửi vào hoặc trả ra.

Thay vì nhận `body` kiểu `any`, bạn khai báo rõ ràng những field nào được phép và kiểu dữ liệu là gì.

```typescript
// src/modules/posts/dto/filter-posts.dto.ts
export class FilterPostsDto {
  keyword?: string;
  page?: number;
  limit?: number;
}
```

Dùng trong controller:
```typescript
@Get('filter')
filter(@Query() dto: FilterPostsDto) {
  // dto.keyword, dto.page, dto.limit đều đã có type
}
```

**Tại sao cần DTO?** Không có DTO, NestJS nhận `body` là plain object — không biết field nào đúng, không validate được, Swagger cũng không hiểu cấu trúc.

---

## 2. Validator

Validator kiểm tra dữ liệu đầu vào có đúng format không trước khi vào controller.

NestJS dùng thư viện `class-validator`. Bạn gắn decorator lên từng field của DTO:

```typescript
// src/modules/posts/dto/filter-posts.dto.ts
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterPostsDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)   // query param luôn là string, cần convert sang number
  page?: number;
}
```

Cấu hình validator toàn app trong `app.module.ts`:

```typescript
// src/app.module.ts
{
  provide: APP_PIPE,
  useValue: new ValidationPipe({
    whitelist: true,            // tự bỏ các field không có trong DTO
    forbidNonWhitelisted: true, // trả lỗi 400 nếu client gửi field lạ
    transform: true,            // tự convert kiểu dữ liệu
  }),
}
```

Khi client gửi sai, NestJS tự động trả lỗi 400 mà không cần bạn viết thêm code kiểm tra.

---

## 3. Transform

Transform biến đổi dữ liệu — thường dùng để:
- **Chuẩn hóa input** (trim khoảng trắng, lowercase...)
- **Convert kiểu** (string → number)
- **Lọc output** (ẩn field nhạy cảm trước khi trả về client)

**Chuẩn hóa input** với `@Transform`:

```typescript
// src/modules/posts/dto/filter-posts.dto.ts
import { Transform } from 'class-transformer';

export class FilterPostsDto {
  @Transform(({ value }) => value?.trim())  // bỏ khoảng trắng đầu/cuối
  keyword?: string;
}
```

**Lọc output** với `@Exclude` / `@Expose` — ví dụ ẩn field `createdAt`, `updatedAt` khi trả về user:

```typescript
// src/modules/users/dto/user-response.dto.ts
import { Exclude, Expose } from 'class-transformer';

@Exclude()                  // mặc định ẩn tất cả field
export class UserResponseDto {
  @Expose() id: number;     // chỉ 3 field này mới ra ngoài
  @Expose() name: string;
  @Expose() email: string;
  // createdAt, updatedAt bị ẩn vì không có @Expose
}
```

Dùng trong service:

```typescript
import { plainToInstance } from 'class-transformer';

const user = await this.usersRepo.findById(id); // entity từ DB, có đủ mọi field
return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
// kết quả chỉ còn: { id, name, email }
```

---

## 4. Swagger

Swagger tự động tạo trang tài liệu API tại `/api`. Bạn có thể test endpoint trực tiếp trên trình duyệt mà không cần Postman.

**Cấu hình trong `main.ts`:**

```typescript
// src/main.ts
const config = new DocumentBuilder()
  .setTitle('Content Microservice API')
  .setDescription('API quản lý Post và Comment')
  .setVersion('1.0')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document); // trang Swagger ở /api
```

**Thêm mô tả cho từng endpoint trong controller:**

```typescript
// src/modules/posts/controllers/posts.controller.ts
@ApiTags('posts')             // nhóm các endpoint trong Swagger UI
@Controller('posts')
export class PostsController {

  @ApiOperation({ summary: 'Lấy danh sách tất cả bài viết' })
  @ApiResponse({ status: 200, description: 'Danh sách bài viết' })
  @Get()
  findAll() { ... }

  @ApiOperation({ summary: 'Lấy chi tiết bài viết theo ID' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  @Get(':id')
  findOne(@Param('id') id: number) { ... }
}
```

Mở `http://localhost:3000/api` là thấy ngay toàn bộ API được document.

---

## 5. Abstract

Abstract class là class **chưa hoàn chỉnh** — nó khai báo những method *bắt buộc phải có*, nhưng không implement. Class con phải implement đầy đủ mới dùng được.

**Ví dụ trong project:** `BaseService` khai báo 3 method CRUD cơ bản mà mọi service đều phải có:

```typescript
// src/common/base.service.ts
export abstract class BaseService<T> {
  abstract findAll(): Promise<T[]>;
  abstract findOne(id: number): Promise<T>;
  abstract remove(id: number): Promise<void>;
}
```

`PostsService` extend và implement đầy đủ:

```typescript
// src/modules/posts/services/posts.service.ts
@Injectable()
export class PostsService extends BaseService<Post> {

  findAll(): Promise<Post[]> {
    return this.postsRepo.findAll();
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.postsRepo.findById(id);
    if (!post) throw new NotFoundException(`Post #${id} not found`);
    return post;
  }

  async remove(id: number): Promise<void> {
    const post = await this.findOne(id);
    await this.postsRepo.remove(post);
  }
}
```

**Tại sao dùng?** Nếu sau này thêm `NewsService`, `CommentsService`... bạn biết chắc chúng đều có `findAll`, `findOne`, `remove` — không cần đoán.

---

## 6. Interceptors

Interceptor can thiệp vào **trước và sau** khi controller xử lý request. Dùng khi bạn muốn làm gì đó với *mọi* request/response mà không phải viết lại trong từng controller.

**Ví dụ trong project:** `TransformInterceptor` wrap mọi response thành format chuẩn:

```typescript
// src/common/interceptors/transform.interceptor.ts
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

Trước khi có interceptor, controller trả:
```json
{ "id": 1, "title": "Hello" }
```

Sau khi có interceptor, mọi response đều tự động thành:
```json
{
  "success": true,
  "data": { "id": 1, "title": "Hello" },
  "timestamp": "2026-10-06T10:00:00.000Z"
}
```

Đăng ký global trong `app.module.ts` để áp dụng cho toàn app:

```typescript
// src/app.module.ts
{
  provide: APP_INTERCEPTOR,
  useClass: TransformInterceptor, // NestJS tự khởi tạo
}
```


---

## 7. DI (Dependency Injection)

Thay vì class tự tạo dependency bằng `new`, NestJS sẽ **tự tạo và truyền vào** cho bạn.

```typescript
// ❌ Không dùng DI — tự tạo thủ công
class UsersController {
  private usersService = new UsersService(); // phụ thuộc cứng
}

// ✅ Dùng DI — NestJS tự inject
class UsersController {
  constructor(private readonly usersService: UsersService) {}
}
```

**Tại sao cần?** Khi test, bạn có thể thay `UsersService` thật bằng mock mà không sửa controller.

---

### Cách tổ chức trong NestJS

Có 3 thành phần chính:

**1. Provider** — class có thể được inject, đánh dấu bằng `@Injectable()`:

```typescript
// src/modules/users/services/users.service.ts
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepository,   // NestJS inject UsersRepository
    private readonly postsRepo: PostsRepository,   // NestJS inject PostsRepository
  ) {}
}
```

**2. Module** — nơi đăng ký provider và khai báo cái nào được dùng ra ngoài:

```typescript
// src/modules/users/users.module.ts
@Module({
  imports: [UsersDbModule, PostsDbModule], // import module chứa UsersRepository, PostsRepository
  controllers: [UsersController],
  providers: [UsersService],              // đăng ký UsersService vào DI container
  exports: [UsersService],               // cho phép module khác inject UsersService
})
export class UsersModule {}
```

**3. Consumer** — controller hoặc service nhận dependency qua constructor:

```typescript
// src/modules/posts/services/posts.service.ts
@Injectable()
export class PostsService extends BaseService<Post> {
  constructor(
    private readonly postsRepo: PostsRepository,
    private readonly usersRepo: UsersRepository, // lấy từ PostsDbModule + UsersDbModule
  ) {
    super();
  }
}
```

---

### Luồng hoạt động

```
app khởi động
   ↓
NestJS đọc @Module() → biết cần tạo những provider nào
   ↓
Tạo UsersRepository → inject vào UsersService
Tạo PostsRepository → inject vào UsersService, PostsService
   ↓
Tạo UsersService, PostsService (đã có đủ dependency)
   ↓
Tạo Controller (inject Service vào)
   ↓
Sẵn sàng nhận request
```
