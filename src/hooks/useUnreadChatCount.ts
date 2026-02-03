import { useCallback, useEffect, useState } from 'react';
import { chatService } from '../services/chatService';
import { chatSignalRService } from '../services/chatSignalRService';

/**
 * Hook to get and track unread chat count for floating button
 */
export const useUnreadChatCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      const count = await chatService.getUnassignedCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();

    // Connect to SignalR for real-time updates
    chatSignalRService.connect();

    // Listen for new conversations
    const unsubNewConv = chatSignalRService.onNewConversation(() => {
      setUnreadCount((prev) => prev + 1);
    });

    // Listen for conversation updates (might be assigned)
    const unsubConvUpdated = chatSignalRService.onConversationUpdated(() => {
      // Refetch to get accurate count
      fetchCount();
    });

    // Listen for new messages
    const unsubNewMsg = chatSignalRService.onNewMessage(() => {
      // Refetch to get accurate count
      fetchCount();
    });

    return () => {
      unsubNewConv();
      unsubConvUpdated();
      unsubNewMsg();
    };
  }, [fetchCount]);

  return { unreadCount, loading, refetch: fetchCount };
};
