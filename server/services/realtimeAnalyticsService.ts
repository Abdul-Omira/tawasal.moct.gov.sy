/**
 * Real-time Analytics Service with WebSocket Support
 * @copyright 2025 Syrian Ministry of Communications and Information Technology
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { redisService } from './redisService';
import { analyticsService } from './analyticsService';

export interface RealtimeAnalyticsData {
  type: 'form_view' | 'form_submission' | 'form_abandon' | 'user_activity' | 'system_metrics';
  formId?: string;
  tenantId?: string;
  userId?: string;
  data: any;
  timestamp: Date;
}

export interface RealtimeMetrics {
  activeUsers: number;
  currentSubmissions: number;
  systemLoad: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
}

class RealtimeAnalyticsService {
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, { tenantId?: string; userId?: string }> = new Map();
  private metricsInterval: NodeJS.Timeout | null = null;
  private readonly METRICS_UPDATE_INTERVAL = 5000; // 5 seconds

  constructor() {
    this.setupRedisSubscriptions();
  }

  // Initialize WebSocket server
  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      },
      path: '/api/analytics/realtime/ws'
    });

    this.setupSocketHandlers();
    this.startMetricsBroadcast();
  }

  // Setup Socket.IO event handlers
  private setupSocketHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle client authentication and tenant assignment
      socket.on('authenticate', (data: { tenantId?: string; userId?: string }) => {
        this.connectedClients.set(socket.id, {
          tenantId: data.tenantId,
          userId: data.userId
        });

        // Join tenant-specific room
        if (data.tenantId) {
          socket.join(`tenant:${data.tenantId}`);
        }

        // Join user-specific room
        if (data.userId) {
          socket.join(`user:${data.userId}`);
        }

        socket.emit('authenticated', { success: true });
      });

      // Handle analytics event tracking
      socket.on('track_event', async (data: RealtimeAnalyticsData) => {
        try {
          await analyticsService.trackEvent(
            data.type,
            data.formId || 'unknown',
            data.data,
            {
              tenantId: data.tenantId,
              userId: data.userId,
              metadata: {
                socketId: socket.id,
                timestamp: data.timestamp
              }
            }
          );

          // Broadcast to relevant clients
          this.broadcastEvent(data);
        } catch (error) {
          console.error('Error tracking real-time event:', error);
          socket.emit('error', { message: 'Failed to track event' });
        }
      });

      // Handle form analytics subscription
      socket.on('subscribe_form_analytics', (formId: string) => {
        socket.join(`form:${formId}`);
        socket.emit('subscribed', { formId, type: 'form_analytics' });
      });

      // Handle tenant analytics subscription
      socket.on('subscribe_tenant_analytics', (tenantId: string) => {
        socket.join(`tenant:${tenantId}`);
        socket.emit('subscribed', { tenantId, type: 'tenant_analytics' });
      });

      // Handle user analytics subscription
      socket.on('subscribe_user_analytics', (userId: string) => {
        socket.join(`user:${userId}`);
        socket.emit('subscribed', { userId, type: 'user_analytics' });
      });

      // Handle unsubscribe
      socket.on('unsubscribe', (subscription: { type: string; id: string }) => {
        socket.leave(`${subscription.type}:${subscription.id}`);
        socket.emit('unsubscribed', subscription);
      });

      // Handle client disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });
    });
  }

  // Setup Redis subscriptions for real-time data
  private setupRedisSubscriptions() {
    // Subscribe to analytics events
    redisService.subscribe('analytics:realtime', (message) => {
      try {
        const event = JSON.parse(message);
        this.broadcastEvent(event);
      } catch (error) {
        console.error('Error parsing analytics event:', error);
      }
    });

    // Subscribe to system metrics
    redisService.subscribe('system:metrics', (message) => {
      try {
        const metrics = JSON.parse(message);
        this.broadcastMetrics(metrics);
      } catch (error) {
        console.error('Error parsing system metrics:', error);
      }
    });
  }

  // Start broadcasting metrics at regular intervals
  private startMetricsBroadcast() {
    this.metricsInterval = setInterval(async () => {
      const metrics = await this.getCurrentMetrics();
      this.broadcastMetrics(metrics);
    }, this.METRICS_UPDATE_INTERVAL);
  }

  // Get current system metrics
  private async getCurrentMetrics(): Promise<RealtimeMetrics> {
    try {
      // This would typically query the system for real metrics
      // For now, return mock data
      return {
        activeUsers: this.connectedClients.size,
        currentSubmissions: Math.floor(Math.random() * 10),
        systemLoad: Math.floor(Math.random() * 100),
        responseTime: Math.floor(Math.random() * 200) + 50,
        errorRate: Math.random() * 2,
        throughput: Math.floor(Math.random() * 1000) + 500
      };
    } catch (error) {
      console.error('Error getting current metrics:', error);
      return {
        activeUsers: 0,
        currentSubmissions: 0,
        systemLoad: 0,
        responseTime: 0,
        errorRate: 0,
        throughput: 0
      };
    }
  }

  // Broadcast analytics event to relevant clients
  private broadcastEvent(event: RealtimeAnalyticsData) {
    if (!this.io) return;

    // Broadcast to all clients in the tenant
    if (event.tenantId) {
      this.io.to(`tenant:${event.tenantId}`).emit('analytics_event', event);
    }

    // Broadcast to specific form subscribers
    if (event.formId) {
      this.io.to(`form:${event.formId}`).emit('form_analytics_event', event);
    }

    // Broadcast to specific user subscribers
    if (event.userId) {
      this.io.to(`user:${event.userId}`).emit('user_analytics_event', event);
    }

    // Broadcast to all connected clients
    this.io.emit('analytics_event', event);
  }

  // Broadcast system metrics
  private broadcastMetrics(metrics: RealtimeMetrics) {
    if (!this.io) return;

    this.io.emit('system_metrics', {
      ...metrics,
      timestamp: new Date()
    });
  }

  // Send analytics data to specific client
  public sendToClient(socketId: string, data: any) {
    if (!this.io) return;

    this.io.to(socketId).emit('analytics_data', data);
  }

  // Send analytics data to tenant
  public sendToTenant(tenantId: string, data: any) {
    if (!this.io) return;

    this.io.to(`tenant:${tenantId}`).emit('analytics_data', data);
  }

  // Send analytics data to user
  public sendToUser(userId: string, data: any) {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('analytics_data', data);
  }

  // Get connected clients count
  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Get connected clients by tenant
  public getConnectedClientsByTenant(tenantId: string): number {
    let count = 0;
    for (const client of this.connectedClients.values()) {
      if (client.tenantId === tenantId) {
        count++;
      }
    }
    return count;
  }

  // Get connected clients by user
  public getConnectedClientsByUser(userId: string): number {
    let count = 0;
    for (const client of this.connectedClients.values()) {
      if (client.userId === userId) {
        count++;
      }
    }
    return count;
  }

  // Track real-time event
  public async trackRealtimeEvent(
    type: string,
    formId: string,
    data: any,
    options: {
      tenantId?: string;
      userId?: string;
      broadcast?: boolean;
    } = {}
  ) {
    try {
      const event: RealtimeAnalyticsData = {
        type: type as any,
        formId,
        tenantId: options.tenantId,
        userId: options.userId,
        data,
        timestamp: new Date()
      };

      // Track in analytics service
      await analyticsService.trackEvent(type, formId, data, {
        tenantId: options.tenantId,
        userId: options.userId,
        metadata: {
          realtime: true,
          timestamp: event.timestamp
        }
      });

      // Broadcast if requested
      if (options.broadcast !== false) {
        this.broadcastEvent(event);
      }

      return event;
    } catch (error) {
      console.error('Error tracking real-time event:', error);
      throw error;
    }
  }

  // Get real-time analytics data
  public async getRealtimeData(tenantId?: string, timeRange?: { start: number; end: number }) {
    try {
      return await analyticsService.getRealTimeAnalytics(tenantId, timeRange);
    } catch (error) {
      console.error('Error getting real-time data:', error);
      return [];
    }
  }

  // Cleanup
  public cleanup() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    if (this.io) {
      this.io.close();
      this.io = null;
    }

    this.connectedClients.clear();
  }
}

export const realtimeAnalyticsService = new RealtimeAnalyticsService();
export default realtimeAnalyticsService;
