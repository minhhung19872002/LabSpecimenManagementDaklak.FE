import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from './api';
import { STORAGE_KEYS } from '../constants';

type NewNotificationCallback = (notificationId: string) => void;
type AccountExpiredCallback = () => void;

/**
 * SignalR Service for real-time notifications
 */
class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private newNotificationCallbacks: NewNotificationCallback[] = [];
  private accountExpiredCallbacks: AccountExpiredCallback[] = [];
  private isConnecting = false;

  /**
   * Connect to the SignalR hub
   */
  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('[SignalR] Already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('[SignalR] Connection in progress...');
      return;
    }

    if (!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)) {
      console.log('[SignalR] No access token, skipping connection');
      return;
    }

    this.isConnecting = true;

    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/signalr/notifications`, {
          // Read fresh token on each reconnect attempt to avoid stale JWT after expiry
          accessTokenFactory: () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ?? '',
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Retry intervals
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      // Register event handlers
      this.connection.on('ReceiveNewNotification', (notificationId: string) => {
        console.log('[SignalR] Received new notification:', notificationId);
        this.newNotificationCallbacks.forEach((callback) => callback(notificationId));
      });

      this.connection.on('AccountExpired', () => {
        console.log('[SignalR] AccountExpired received');
        this.accountExpiredCallbacks.forEach((callback) => callback());
      });

      // Connection state change handlers
      this.connection.onreconnecting((error) => {
        console.log('[SignalR] Reconnecting...', error);
      });

      this.connection.onreconnected((connectionId) => {
        console.log('[SignalR] Reconnected with ID:', connectionId);
      });

      this.connection.onclose((error) => {
        console.log('[SignalR] Connection closed', error);
      });

      await this.connection.start();
      console.log('[SignalR] Connected successfully');
    } catch (error) {
      console.error('[SignalR] Connection failed:', error);
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from the SignalR hub
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('[SignalR] Disconnected');
      } catch (error) {
        console.error('[SignalR] Disconnect error:', error);
      }
      this.connection = null;
    }
  }

  /**
   * Subscribe to new notification events
   * @returns Unsubscribe function
   */
  onNewNotification(callback: NewNotificationCallback): () => void {
    this.newNotificationCallbacks.push(callback);
    return () => {
      this.newNotificationCallbacks = this.newNotificationCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Subscribe to account-expired events (external temporary accounts)
   * @returns Unsubscribe function
   */
  onAccountExpired(callback: AccountExpiredCallback): () => void {
    this.accountExpiredCallbacks.push(callback);
    return () => {
      this.accountExpiredCallbacks = this.accountExpiredCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

// Singleton instance
export const signalRService = new SignalRService();
