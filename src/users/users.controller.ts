import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('profile')
  async getProfile(@Request() req: any): Promise<User> {
    const userId = req.user?.userId;
    if (!userId) throw new NotFoundException('User not authenticated');
    
    const user = await this.usersService.getProfile(userId);
    if (!user) throw new NotFoundException('Profile not found');
    return user;
  }

  @Patch('profile')
  async updateProfile(@Body() body: Partial<User>, @Request() req: any): Promise<User> {
    const userId = req.user?.userId;
    if (!userId) throw new NotFoundException('User not authenticated');
    
    const updated = await this.usersService.updateProfile(userId, body);
    if (!updated) throw new NotFoundException('Profile not found');
    return updated;
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  @Post()
  async create(@Body() body: Partial<User>): Promise<User> {
    return this.usersService.create(body);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<User>,
  ): Promise<User> {
    const updated = await this.usersService.update(id, body);
    if (!updated) throw new NotFoundException(`User with id ${id} not found`);
    return updated;
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    const deleted = await this.usersService.delete(id);
    if (!deleted) throw new NotFoundException(`User with id ${id} not found`);
    return { message: `User with id ${id} deleted successfully` };
  }
}
