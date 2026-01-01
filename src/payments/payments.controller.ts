import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Patch, 
  UseGuards, 
  Request, 
  Query,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { PaymentStatus } from './schemas/payment.schema';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    return this.paymentsService.create(createPaymentDto, req.user.userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get('my-payments')
  getMyPayments(@Request() req) {
    return this.paymentsService.findByUser(req.user.userId);
  }

  @Get('status/:status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getPaymentsByStatus(@Param('status') status: PaymentStatus) {
    return this.paymentsService.getPaymentsByStatus(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() updateData: { 
      status: PaymentStatus; 
      note?: string; 
      trackingNumber?: string; 
    }
  ) {
    return this.paymentsService.updatePaymentStatus(
      id,
      updateData.status,
      updateData.note,
      updateData.trackingNumber
    );
  }
}
