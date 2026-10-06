# content-ms — Tài liệu Kiến trúc

> **Phiên bản**: 1.0.0  
> **Trạng thái**: Draft — chờ implement  
> **Ngày**: 2026-10-06

---

## 1. Mục tiêu

Tổ chức lại `content-ms` thành 2 tầng tách biệt, mirror triết lý `libs/` vs `apps/` của lab-app:

| Tầng | Folder | Trách nhiệm |
|---|---|---|
| **Database Layer** | `src/database/` | Giao tiếp với DB — entities, repositories, TypeORM |
| **Business Layer** | `src/modules/` | Định nghĩa nghiệp vụ — controllers, services, DTOs |

**Nguyên tắc cốt lõi**: `modules/` biết "what" cần làm, `database/` biết "how" để lấy/lưu data.

---

## 2. Cấu trúc thư mục

```
src/
├── database/                         ← "libs/" — chỉ TypeORM, không có business logic
│   ├── users/
│   │   ├── user.entity.ts
│   │   ├── users.repository.ts
│   │   ├── users-db.module.ts
│   │   └── index.ts
│   ├── posts/
│   │   ├── post.entity.ts
│   │   ├── posts.repository.ts
│   │   ├── posts-db.module.ts
│   │   └── index.ts
│   └── comments/
│       ├── comment.entity.ts
│       ├── comments.repository.ts
│       ├── comments-db.module.ts
│       └── index.ts
│
├── modules/                          ← "apps/" — business logic, không có @InjectRepository
│   ├── users/
│   │   ├── controllers/
│   │   │   ├── users.controller.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── users.service.ts
│   │   │   └── index.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user.dto.ts
│   │   │   └── index.ts
│   │   └── users.module.ts
│   ├── posts/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── dto/
│   │   └── posts.module.ts
│   └── comments/
│       ├── controllers/
│       ├── services/
│       ├── dto/
│       └── comments.module.ts
│
├── app.module.ts
└── main.ts
```

---

## 3. Database Layer (`src/database/`)

### 3.1 Trách nhiệm

- Khai báo TypeORM `@Entity`
- Wrap tất cả TypeORM query qua custom Repository class
- Không chứa business rules, không throw business exceptions
- Không import bất cứ thứ gì từ `src/modules/`

### 3.2 Repository — quy ước

Repository là class `@Injectable()` nhận `Repository<T>` từ TypeORM và expose các method trả về `T | null` hoặc `T[]`. Không bao giờ throw exception.

```typescript
// database/posts/posts.repository.ts
@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(Post)
    private readonly repo: Repository<Post>,
  ) {}

  findAll(): Promise<Post[]> {
    return this.repo.find();
  }

  findById(id: number): Promise<Post | null> {
    return this.repo.findOne({ where: { id } });
  }

  findAllByAuthorId(authorId: number): Promise<Post[]> {
    return this.repo.find({
      where: { author: { id: authorId } },
      order: { createdAt: 'DESC' },
    });
  }

  save(data: DeepPartial<Post>): Promise<Post> {
    return this.repo.save(this.repo.create(data));
  }

  async update(post: Post, changes: DeepPartial<Post>): Promise<Post> {
    Object.assign(post, changes);
    return this.repo.save(post);
  }

  remove(post: Post): Promise<Post> {
    return this.repo.remove(post);
  }
}
```

**Quy tắc**:
- Return type luôn là `T | null` cho single-result query (không throw `NotFoundException`)
- Exception là trách nhiệm của Service, không phải Repository
- Method name mô tả query, không mô tả intent nghiệp vụ (`findById`, không phải `getPostOrFail`)

### 3.3 DbModule — quy ước

Mỗi domain có 1 `*-db.module.ts` đăng ký entity và export Repository:

```typescript
// database/posts/posts-db.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Post])],
  providers: [PostsRepository],
  exports: [PostsRepository],
})
export class PostsDbModule {}
```

**Quy tắc**:
- Tên file: `{domain}-db.module.ts`
- Chỉ export Repository, không export entity, không export TypeOrmModule
- Không có `controllers`

---

## 4. Business Layer (`src/modules/`)

### 4.1 Trách nhiệm

- Định nghĩa HTTP endpoints (`Controller`)
- Chứa toàn bộ business rules, validation nghiệp vụ (`Service`)
- Khai báo request/response shape (`DTO`)
- Không chứa TypeORM code, không `@InjectRepository()`

### 4.2 Service — quy ước

Service inject Repository (không inject `Repository<T>` từ TypeORM trực tiếp). Mọi `NotFoundException` hay business exception đều throw tại đây.

```typescript
// modules/posts/services/posts.service.ts
@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepo: PostsRepository,
    private readonly usersRepo: UsersRepository, // validate author — inject repo trực tiếp
  ) {}

  async findOne(id: number): Promise<Post> {
    const post = await this.postsRepo.findById(id);
    if (!post) throw new NotFoundException(`Post #${id} not found`);
    return post;
  }

  async create(dto: CreatePostDto): Promise<Post> {
    const author = await this.usersRepo.findById(dto.authorId);
    if (!author) throw new NotFoundException(`User #${dto.authorId} not found`);
    return this.postsRepo.save({ ...dto, author });
  }
}
```

**Quy tắc**:
- Service KHÔNG dùng `@InjectRepository()` — đó là việc của `database/`
- Cross-domain validation (vd: "user có tồn tại không") → inject Repository của domain đó trực tiếp
- Cross-domain business logic phức tạp → inject Service của domain đó

### 4.3 Dependency giữa các modules

```
modules/users      →  database/users   (UsersRepository)

modules/posts      →  database/posts   (PostsRepository)
                   →  database/users   (UsersRepository — validate author)

modules/comments   →  database/comments (CommentsRepository)
                   →  database/posts    (PostsRepository — validate post tồn tại)
                   →  database/users    (UsersRepository — validate user tồn tại)
```

**Quy tắc một chiều**:
```
modules/*  →  database/*    ✅ được phép
database/*  →  modules/*    ❌ cấm tuyệt đối
modules/*  →  modules/*     ✅ được phép (khi cần business logic của domain khác)
database/*  →  database/*   ❌ cấm (repositories độc lập nhau)
```

---

## 5. Module import pattern

```typescript
// modules/posts/posts.module.ts
@Module({
  imports: [
    PostsDbModule,   // cung cấp PostsRepository
    UsersDbModule,   // cung cấp UsersRepository (để validate author)
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService], // export service nếu module khác cần business logic
})
export class PostsModule {}
```

```typescript
// modules/comments/comments.module.ts
@Module({
  imports: [
    CommentsDbModule,
    PostsDbModule,   // validate post tồn tại
    UsersDbModule,   // validate user tồn tại
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
```

---

## 6. Barrel exports (`index.ts`)

Mỗi thư mục con phải có `index.ts`. Import từ folder, không phải từ file cụ thể:

```typescript
// ✅ Đúng
import { PostsRepository } from '../database/posts';
import { PostsService } from './services';

// ❌ Sai
import { PostsRepository } from '../database/posts/posts.repository';
```

---

## 7. Quyết định kỹ thuật

| Mã | Quyết định | Phương án chọn | Lý do |
|---|---|---|---|
| BR-01 | Cross-domain validation | Inject Repository trực tiếp (không qua Service) | Tránh coupling business layer — chỉ cần check tồn tại, không cần business logic |
| BR-02 | Exception handling | Service throw, Repository trả `null` | Repository là data layer thuần túy, không biết context nghiệp vụ |
| BR-03 | Circular dependency | Loại bỏ `forwardRef` | `UsersService` không dùng `PostsService`, `forwardRef` là dead code |
| BR-04 | DB synchronize | Tắt `synchronize: true`, dùng migrations | Tránh auto-alter schema ngoài ý muốn khi deploy |

---

## 8. Anti-patterns cần tránh

```typescript
// ❌ Service inject TypeORM Repository trực tiếp
@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly repo: Repository<Post>, // ← sai: đây là việc của database/
  ) {}
}

// ❌ Repository throw business exception
findById(id: number): Promise<Post> {
  const post = await this.repo.findOne({ where: { id } });
  if (!post) throw new NotFoundException(...); // ← sai: đây là việc của Service
  return post;
}

// ❌ Database module import business module
@Module({
  imports: [PostsModule], // ← cấm tuyệt đối trong database/
})
export class PostsDbModule {}

// ❌ Circular dependency không cần thiết
@Module({
  imports: [forwardRef(() => PostsModule)], // ← nếu không thực sự dùng thì bỏ đi
})
```

---

## 9. Checklist trước khi merge

- [ ] Không có `@InjectRepository()` trong bất kỳ file nào trong `src/modules/`
- [ ] Không có business exception (`NotFoundException`, v.v.) trong `src/database/`
- [ ] Không có import từ `src/modules/` trong `src/database/`
- [ ] Mọi thư mục con đều có `index.ts`
- [ ] `synchronize: false` trong `app.module.ts`
- [ ] Build pass: `npm run build`
