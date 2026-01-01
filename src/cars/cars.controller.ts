// cars.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Patch,
  Delete,
  UseGuards, 
  Request, 
  Query,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CarStatus } from './schemas/car.schema';
import { Public } from '../auth/decorators/public.decorator';

@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCarDto: CreateCarDto, @Request() req) {
    try {
      console.log('=== CREATE CAR REQUEST ===');
      console.log('User:', req.user?.userId, req.user?.username);
      console.log('DTO Data:', JSON.stringify(createCarDto, null, 2));
      console.log('Photos count:', createCarDto.photos?.length || 0);
      
      const result = await this.carsService.create(createCarDto, req.user.userId);
      console.log('✅ Car created successfully:', result._id);
      return result;
    } catch (error) {
      console.error('❌ ERROR in cars controller:');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Re-throw to let global exception handler deal with it
      throw error;
    }
  }

  @Public()
  @Get()
  findAll(
    @Query('status') status?: CarStatus,
    @Query('bodyType') bodyType?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('search') search?: string,
  ) {
    const filters = { status, bodyType, minPrice, maxPrice, search };
    return this.carsService.findAll(filters);
  }

  @Get('approved')
  @Public()
  getApprovedCars() {
    return this.carsService.getApprovedCars();
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getPendingCars() {
    return this.carsService.getPendingCars();
  }

  @Get('my-cars')
  @UseGuards(JwtAuthGuard)
  getMyCars(@Request() req) {
    return this.carsService.findByUser(req.user.userId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.carsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateCarDto: UpdateCarDto,
    @Request() req
  ) {
    return this.carsService.update(id, updateCarDto, req.user.userId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() statusData: { status: CarStatus }
  ) {
    return this.carsService.updateStatus(id, statusData.status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @Request() req) {
    return this.carsService.delete(id, req.user.userId);
  }
}
