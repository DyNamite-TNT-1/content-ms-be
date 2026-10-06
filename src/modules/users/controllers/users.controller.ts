import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../services/index.js';
import { CreateUserDto } from '../dto/index.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @ApiOperation({ summary: 'Lấy danh sách tất cả người dùng' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng' })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Lấy chi tiết người dùng theo ID' })
  @ApiResponse({ status: 200, description: 'Chi tiết người dùng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Tạo người dùng mới' })
  @ApiResponse({ status: 201, description: 'Người dùng đã được tạo' })
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @ApiOperation({ summary: 'Xóa người dùng theo ID' })
  @ApiResponse({ status: 200, description: 'Người dùng đã được xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @ApiOperation({ summary: 'Lấy danh sách bài viết của người dùng' })
  @ApiResponse({ status: 200, description: 'Danh sách bài viết' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  @Get(':id/posts')
  findPosts(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findPostsByUser(id);
  }
}
