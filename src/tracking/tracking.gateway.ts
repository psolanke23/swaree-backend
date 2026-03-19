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
import { Logger } from '@nestjs/common';
import { TrackingService } from './tracking.service';

const allowedWsOrigins = (): string[] =>
  (process.env.FRONTEND_URLS ?? process.env.FRONTEND_URL ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const corsOrigin = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) => {
  if (!origin) return callback(null, true);
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
  if (allowedWsOrigins().includes(origin)) return callback(null, true);
  callback(new Error(`CORS: origin ${origin} not allowed`));
};

@WebSocketGateway({
  cors: { origin: corsOrigin, credentials: true },
  namespace: '/tracking',
  // Allow both polling (initial handshake) and websocket upgrade.
  // Railway terminates TLS and proxies via HTTP/1.1 — polling→ws upgrade works fine.
  transports: ['polling', 'websocket'],
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  constructor(private readonly trackingService: TrackingService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /** Customer client joins a room for a specific order */
  @SubscribeMessage('join_order')
  async handleJoinOrder(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `order:${data.orderId}`;
    await client.join(room);
    this.logger.log(`Client ${client.id} joined ${room}`);

    // Send current state immediately (best-effort — don't crash the handler)
    try {
      const state = await this.trackingService.getState(data.orderId);
      client.emit('tracking_update', state);
    } catch (err) {
      this.logger.warn(`Could not fetch initial state for order ${data.orderId}: ${err}`);
    }
  }

  /** Owner app joins a room for its restaurant to receive all order events */
  @SubscribeMessage('join_restaurant')
  async handleJoinRestaurant(
    @MessageBody() data: { restaurantId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `restaurant:${data.restaurantId}`;
    await client.join(room);
    this.logger.log(`Client ${client.id} joined ${room}`);
  }

  /** Called by backend when rider position changes (TrackingController) */
  emitTrackingUpdate(orderId: string, payload: object) {
    this.server.to(`order:${orderId}`).emit('tracking_update', payload);
  }

  /**
   * Called by OwnerService when order status changes.
   * Broadcasts to:
   *  - the per-order room  → customer tracking page receives 'tracking_update'
   *  - the restaurant room → owner app receives 'order_status_update'
   */
  emitOrderStatusUpdate(
    restaurantId: string,
    orderId: string,
    status: string,
    trackingPayload: object,
  ) {
    this.server.to(`order:${orderId}`).emit('tracking_update', trackingPayload);
    this.server
      .to(`restaurant:${restaurantId}`)
      .emit('order_status_update', { orderId, status });
  }

  /**
   * Called by OrdersService when a new order is placed.
   * Broadcasts to the restaurant room → owner app shows a new order notification.
   */
  emitNewOrder(restaurantId: string, order: object) {
    this.server.to(`restaurant:${restaurantId}`).emit('new_order', order);
  }
}
