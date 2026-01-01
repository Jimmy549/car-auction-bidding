import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    console.error('🔴 GLOBAL EXCEPTION CAUGHT:');
    console.error('URL:', request.method, request.url);
    console.error('Body:', JSON.stringify(request.body, null, 2));
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      console.error('HTTP Exception Status:', status);
      console.error('Exception Response:', JSON.stringify(exceptionResponse, null, 2));
      
      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        errors = (exceptionResponse as any).errors || null;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      console.error('Error name:', exception.name);
      console.error('Error message:', exception.message);
      console.error('Error stack:', exception.stack);
      message = exception.message;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(errors && { errors }),
    };

    console.error('Sending error response:', JSON.stringify(errorResponse, null, 2));
    
    response.status(status).json(errorResponse);
  }
}