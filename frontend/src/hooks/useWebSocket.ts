/**
 * Aegis AI – Reusable Real-Time WebSocket Hook
 *
 * Provides connection lifecycle management, heartbeat/ping, auto-reconnect
 * with exponential backoff, room/channel subscription, and typed event routing.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppSelector } from '@/store';

export type WebSocketEventType =
  | 'emergency_created'
  | 'emergency_status_updated'
  | 'emergency_cancelled'
  | 'notification'
  | 'location_update'
  | 'subscribed'
  | 'unsubscribed'
  | 'pong'
  | 'error';

export interface EmergencyCreatedData {
  id: string;
  patient_id: string;
  emergency_type: string;
  severity: number;
  status: string;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  hospital_id?: string | null;
  hospital_name?: string | null;
  requested_at?: string;
}

export interface EmergencyStatusUpdatedData {
  id: string;
  patient_id: string;
  ambulance_id?: string | null;
  hospital_id?: string | null;
  status: string;
  emergency_type: string;
  severity: number;
  location_address?: string;
  dispatched_at?: string | null;
  arrived_at?: string | null;
  resolved_at?: string | null;
  responder_notes?: string | null;
  hospital_notes?: string | null;
  updated_at?: string | null;
}

export interface EmergencyCancelledData {
  id: string;
  patient_id: string;
  status: 'cancelled';
  resolved_at?: string | null;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  priority: number;
  action_url?: string | null;
  action_label?: string | null;
  created_at?: string | null;
}

export interface WebSocketEvent {
  type: WebSocketEventType;
  data?: any;
  channel?: string;
  status?: string;
  message?: string;
}

export interface UseWebSocketOptions {
  channels?: string[];
  onEvent?: (event: WebSocketEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  enabled?: boolean;
}

export function getWebSocketBaseUrl(): string {
  const envApiUrl = import.meta.env.VITE_API_URL?.trim();
  if (envApiUrl) {
    const wsProto = envApiUrl.startsWith('https') ? 'wss' : 'ws';
    const cleanUrl = envApiUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return `${wsProto}://${cleanUrl}/ws`;
  }
  const isSecure = window.location.protocol === 'https:';
  return `${isSecure ? 'wss' : 'ws'}://${window.location.host}/ws`;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    channels = [],
    onEvent,
    onOpen,
    onClose,
    onError,
    enabled = true,
  } = options;

  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef<number>(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const unmountedRef = useRef<boolean>(false);

  // Keep latest callbacks in refs to prevent reconnect cycles
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const channelsRef = useRef(channels);
  channelsRef.current = channels;

  const send = useCallback((data: Record<string, any>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const subscribeEmergency = useCallback((emergencyId: string) => {
    if (emergencyId) {
      send({
        action: 'subscribe_emergency',
        emergency_id: emergencyId,
      });
    }
  }, [send]);

  const unsubscribeEmergency = useCallback((emergencyId: string) => {
    if (emergencyId) {
      send({
        action: 'unsubscribe_emergency',
        emergency_id: emergencyId,
      });
    }
  }, [send]);

  const sendLocationUpdate = useCallback(
    (emergencyId: string, lat: number, lng: number) => {
      send({
        action: 'update_location',
        emergency_id: emergencyId,
        lat,
        lng,
      });
    },
    [send]
  );

  useEffect(() => {
    unmountedRef.current = false;

    if (!enabled || !accessToken) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const connect = () => {
      if (unmountedRef.current || !accessToken) return;

      try {
        const baseUrl = getWebSocketBaseUrl();
        const wsUrl = `${baseUrl}?token=${encodeURIComponent(accessToken)}`;
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (unmountedRef.current) {
            socket.close();
            return;
          }
          setIsConnected(true);
          retryCountRef.current = 0;

          // Join desired channels
          channelsRef.current.forEach((ch) => {
            if (ch.startsWith('emergency_')) {
              const emId = ch.replace('emergency_', '');
              socket.send(
                JSON.stringify({
                  action: 'subscribe_emergency',
                  emergency_id: emId,
                })
              );
            }
          });

          // Start Heartbeat / Ping interval
          if (heartbeatTimerRef.current) {
            window.clearInterval(heartbeatTimerRef.current);
          }
          heartbeatTimerRef.current = window.setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ action: 'ping' }));
            }
          }, 25000);

          onOpenRef.current?.();
        };

        socket.onmessage = (messageEvent) => {
          try {
            const data: WebSocketEvent = JSON.parse(messageEvent.data);
            setLastEvent(data);
            onEventRef.current?.(data);
          } catch {
            // Ignore malformed payloads
          }
        };

        socket.onerror = (err) => {
          onErrorRef.current?.(err);
        };

        socket.onclose = (closeEvent) => {
          setIsConnected(false);
          if (heartbeatTimerRef.current) {
            window.clearInterval(heartbeatTimerRef.current);
            heartbeatTimerRef.current = null;
          }

          onCloseRef.current?.();

          // Reconnect with exponential backoff if not normal close and not unmounted
          if (!unmountedRef.current && closeEvent.code !== 1008 && closeEvent.code !== 1000) {
            const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 15000);
            retryCountRef.current += 1;
            reconnectTimerRef.current = window.setTimeout(() => {
              connect();
            }, delay);
          }
        };
      } catch {
        // Fallback error catch
      }
    };

    connect();

    return () => {
      unmountedRef.current = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (heartbeatTimerRef.current) {
        window.clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
      setIsConnected(false);
    };
  }, [accessToken, enabled]);

  return {
    isConnected,
    lastEvent,
    send,
    subscribeEmergency,
    unsubscribeEmergency,
    sendLocationUpdate,
  };
}
