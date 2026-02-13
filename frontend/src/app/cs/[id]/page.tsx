'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { csApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { ArrowLeft, Send, Bot, User, Wifi, WifiOff } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export default function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversation } = useQuery({
    queryKey: ['conversation', tenantId, id],
    queryFn: () => csApi.getConversation(tenantId!, id).then((r) => r.data),
    enabled: !!tenantId && !!id,
  });

  // WebSocket connection
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const socket = io(`${apiUrl}/omnidesk/chat`, {
      query: { embedToken: 'agent-dashboard' },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setWsConnected(true);
      if (id) {
        socket.emit('join_conversation', { conversationId: id });
      }
    });

    socket.on('disconnect', () => {
      setWsConnected(false);
    });

    socket.on('new_message', () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', tenantId, id] });
    });

    socket.on('typing', (data: { isTyping: boolean; senderType: string }) => {
      // Typing indicator could be added here
      void data;
    });

    socket.on('agent_joined', () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', tenantId, id] });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [id, tenantId, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => csApi.sendMessage(tenantId!, id, content),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['conversation', tenantId, id] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate(message.trim());
  };

  const statusColors: Record<string, string> = {
    OPEN: 'bg-green-100 text-green-700',
    ASSIGNED: 'bg-brand-100 text-brand-800',
    RESOLVED: 'bg-surface-100 text-surface-600',
    CLOSED: 'bg-surface-100 text-surface-400',
  };

  const statusLabels: Record<string, string> = {
    OPEN: '대기중',
    ASSIGNED: '상담중',
    RESOLVED: '해결됨',
    CLOSED: '종료',
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center gap-4 border-b pb-4">
        <Link href="/cs" className="rounded-lg p-2 hover:bg-surface-100">
          <ArrowLeft className="h-5 w-5 text-surface-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-surface-900">
            {conversation?.visitorName || conversation?.visitorEmail || '익명 방문자'}
          </h1>
          <p className="text-sm text-surface-500">{conversation?.subject || '제목 없음'}</p>
        </div>
        <div className="flex items-center gap-2">
          {wsConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-surface-300" />
          )}
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[conversation?.status] || ''}`}>
            {statusLabels[conversation?.status] || conversation?.status}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto py-4">
        {conversation?.messages?.map((msg: Record<string, any>) => (
          <div key={msg.id} className={`flex ${msg.senderType === 'AGENT' || msg.senderType === 'BOT' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
              msg.senderType === 'AGENT' || msg.senderType === 'BOT'
                ? 'bg-brand-600 text-white'
                : 'bg-surface-100 text-surface-900'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {msg.senderType === 'BOT' ? (
                  <Bot className="h-3 w-3" />
                ) : msg.senderType === 'VISITOR' ? (
                  <User className="h-3 w-3" />
                ) : null}
                <span className="text-xs opacity-70">
                  {msg.senderType === 'BOT' ? 'AI' : msg.senderType === 'AGENT' ? '상담원' : '고객'}
                </span>
                {msg.confidence && (
                  <span className="text-xs opacity-50">
                    ({(msg.confidence * 100).toFixed(0)}%)
                  </span>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className="mt-1 text-xs opacity-50">{formatDateTime(msg.createdAt)}</p>
            </div>
          </div>
        ))}
        {!conversation?.messages?.length && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-surface-400">메시지가 없습니다.</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {conversation?.status !== 'CLOSED' && (
        <form onSubmit={handleSend} className="flex gap-3 border-t pt-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 rounded-lg border px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={!message.trim() || sendMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            전송
          </button>
        </form>
      )}
    </div>
  );
}
