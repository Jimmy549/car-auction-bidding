import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications/notifications.service';
import { AuctionsService } from './auctions/auctions.service';
import { BidsService } from './bids/bids.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationType } from './notifications/schemas/notification.schema';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: ["https://auction-frontend-eight-pi.vercel.app", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly notificationService: NotificationsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token;
      if (token) {
        const payload = this.jwtService.verify(token);
        client.userId = payload.sub;
        this.connectedUsers.set(payload.sub, client.id);
        this.logger.log(`User ${payload.sub} connected`);
      }
    } catch (error) {
      this.logger.error('Authentication failed:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`User ${client.userId} disconnected`);
    }
  }

  @SubscribeMessage('joinAuction')
  async handleJoinAuction(
    @MessageBody() data: { auctionId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    await client.join(`auction_${data.auctionId}`);
    this.logger.log(`User ${client.userId} joined auction ${data.auctionId}`);
  }

  @SubscribeMessage('leaveAuction')
  async handleLeaveAuction(
    @MessageBody() data: { auctionId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    await client.leave(`auction_${data.auctionId}`);
    this.logger.log(`User ${client.userId} left auction ${data.auctionId}`);
  }

  // Real-time bid notification
  async notifyNewBid(auctionId: string, bidData: any) {
    const message = `New bid of $${bidData.amount} placed on auction`;
    
    // Save notification for auction participants
    await this.notificationService.create({
      type: NotificationType.NEW_BID,
      title: 'New Bid Placed',
      message,
      userId: undefined,
      auctionId,
      data: bidData,
    });

    // Broadcast to auction room
    this.server.to(`auction_${auctionId}`).emit('newBid', {
      auctionId,
      bid: bidData,
      message,
    });
  }

  // Auction started notification
  async notifyAuctionStarted(auctionId: string, auctionData: any) {
    const message = `Auction "${auctionData.title}" has started!`;
    
    await this.notificationService.create({
      type: NotificationType.AUCTION_STARTED,
      title: 'Auction Started',
      message,
      userId: undefined,
      auctionId,
      data: auctionData,
    });

    // Broadcast to all users
    this.server.emit('auctionStarted', {
      auctionId,
      auction: auctionData,
      message,
    });
  }

  // Auction ended notification
  async notifyAuctionEnded(auctionId: string, winnerData?: any) {
    const message = winnerData 
      ? `Auction ended! Winner: ${winnerData.username}`
      : 'Auction ended with no winner';
    
    await this.notificationService.create({
      type: NotificationType.AUCTION_ENDED,
      title: 'Auction Ended',
      message,
      userId: undefined,
      auctionId,
      data: winnerData,
    });

    // Broadcast to auction room
    this.server.to(`auction_${auctionId}`).emit('auctionEnded', {
      auctionId,
      winner: winnerData,
      message,
    });
  }

  // Winner announcement
  async notifyWinner(auctionId: string, winnerId: string, auctionData: any) {
    const message = `Congratulations! You won the auction for "${auctionData.title}"`;
    
    // Notify winner
    await this.notificationService.create({
      type: NotificationType.AUCTION_WON,
      title: 'Auction Won!',
      message,
      userId: winnerId,
      auctionId,
      data: auctionData,
    });

    // Send to winner if online
    const winnerSocketId = this.connectedUsers.get(winnerId);
    if (winnerSocketId) {
      this.server.to(winnerSocketId).emit('auctionWon', {
        auctionId,
        auction: auctionData,
        message,
      });
    }
  }

  // Outbid notification
  async notifyOutbid(userId: string, auctionId: string, newBidAmount: number) {
    const message = `You have been outbid! New highest bid: $${newBidAmount}`;
    
    await this.notificationService.create({
      type: NotificationType.OUTBID,
      title: 'Outbid Alert',
      message,
      userId,
      auctionId,
      data: { newBidAmount },
    });

    // Send to user if online
    const userSocketId = this.connectedUsers.get(userId);
    if (userSocketId) {
      this.server.to(userSocketId).emit('outbid', {
        auctionId,
        newBidAmount,
        message,
      });
    }
  }

  // Payment status update
  async notifyPaymentUpdate(userId: string, paymentData: any) {
    const message = `Payment status updated: ${paymentData.status}`;
    
    await this.notificationService.create({
      type: NotificationType.SHIPPING_UPDATE,
      title: 'Payment Update',
      message,
      userId,
      data: paymentData,
    });

    // Send to user if online
    const userSocketId = this.connectedUsers.get(userId);
    if (userSocketId) {
      this.server.to(userSocketId).emit('paymentUpdate', {
        payment: paymentData,
        message,
      });
    }
  }
}
