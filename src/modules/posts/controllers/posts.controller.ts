import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PostsService } from '../services/index.js';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CreatePostDto, FilterPostsDto, UpdatePostDto } from '../dto/index.js';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({ summary: 'Lấy danh sách tất cả bài viết' })
  @ApiResponse({ status: 200, description: 'Danh sách bài viết' })
  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @ApiOperation({ summary: 'Lọc bài viết theo keyword, phân trang, và khoảng thời gian' })
  @ApiResponse({ status: 200, description: 'Kết quả lọc bài viết' })
  @Get('filter')
  filter(@Query() dto: FilterPostsDto) {
    return this.postsService.findAll();
  }

  @ApiOperation({ summary: 'Lấy chi tiết bài viết theo ID' })
  @ApiResponse({ status: 200, description: 'Chi tiết bài viết' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(id);
  }

  @ApiOperation({ summary: 'Tạo bài viết mới' })
  @ApiResponse({ status: 201, description: 'Bài viết đã được tạo' })
  @Post()
  create(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto);
  }

  @ApiOperation({ summary: 'Cập nhật bài viết theo ID' })
  @ApiResponse({ status: 200, description: 'Bài viết đã được cập nhật' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Xóa bài viết theo ID' })
  @ApiResponse({ status: 200, description: 'Bài viết đã được xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.remove(id);
  }
}
