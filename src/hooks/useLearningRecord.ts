'use client';

import { useState, useEffect, useCallback } from 'react';

interface Session {
  id: string;
  student_id: string;
  student_name: string | null;
  module_type: string;
  module_detail: string | null;
  status: string;
  score: number | null;
  started_at: string;
  ended_at: string | null;
}

interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: string | null;
  created_at: string;
}

// 获取学生ID（从localStorage读取用户输入的ID）
function getStudentId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('student_id') || '';
}

// 获取学生昵称
function getStudentName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('student_name');
}

// 设置学生昵称
export function setStudentName(name: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('student_name', name);
  }
}

interface UseLearningRecordOptions {
  moduleType: 'planet' | 'bottle' | 'detective';
  moduleDetail?: string; // bottle: water/land, detective: case_id
}

export function useLearningRecord({ moduleType, moduleDetail }: UseLearningRecordOptions) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 创建会话
  const startSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/learning/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: getStudentId(),
          student_name: getStudentName(),
          module_type: moduleType,
          module_detail: moduleDetail,
        }),
      });

      const result = await response.json();
      if (result.success && result.session) {
        setSessionId(result.session.id);
        return result.session.id;
      }
      return null;
    } catch (error) {
      console.error('创建学习会话失败:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [moduleType, moduleDetail]);

  // 保存消息
  const saveMessage = useCallback(async (
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, unknown>
  ) => {
    if (!sessionId) return false;

    try {
      const response = await fetch('/api/learning/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          role,
          content,
          metadata,
        }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('保存消息失败:', error);
      return false;
    }
  }, [sessionId]);

  // 结束会话
  const endSession = useCallback(async (score?: number) => {
    if (!sessionId) return false;

    try {
      const response = await fetch('/api/learning/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          score,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSessionId(null);
      }
      return result.success;
    } catch (error) {
      console.error('结束会话失败:', error);
      return false;
    }
  }, [sessionId]);

  // 加载历史消息
  const loadMessages = useCallback(async (sid: string): Promise<Array<{role: 'user' | 'assistant', content: string}>> => {
    try {
      const response = await fetch(`/api/learning/messages?session_id=${sid}`);
      const result = await response.json();
      
      if (result.success && result.messages) {
        return result.messages.map((msg: Message) => ({
          role: msg.role,
          content: msg.content,
        }));
      }
      return [];
    } catch (error) {
      console.error('加载历史消息失败:', error);
      return [];
    }
  }, []);

  // 恢复或创建会话（检查是否有进行中的会话）
  const resumeOrCreateSession = useCallback(async () => {
    const studentId = getStudentId();
    if (!studentId) {
      return startSession();
    }

    setIsLoading(true);
    try {
      // 先查询是否有进行中的会话
      const params = new URLSearchParams({
        student_id: studentId,
        module_type: moduleType,
      });
      if (moduleDetail) {
        params.set('module_detail', moduleDetail);
      }

      const response = await fetch(`/api/learning/session?${params.toString()}`);
      const result = await response.json();

      if (result.success && result.sessions && result.sessions.length > 0) {
        // 找到最近的进行中的会话
        const activeSession = result.sessions.find((s: Session) => s.status === 'active');
        if (activeSession) {
          setSessionId(activeSession.id);
          return activeSession.id;
        }
      }

      // 没有进行中的会话，创建新的
      return startSession();
    } catch (error) {
      console.error('恢复会话失败:', error);
      return startSession();
    } finally {
      setIsLoading(false);
    }
  }, [moduleType, moduleDetail, startSession]);

  return {
    sessionId,
    isLoading,
    startSession,
    resumeOrCreateSession,
    saveMessage,
    endSession,
    loadMessages,
    getStudentId,
  };
}

// 查询学习记录（教师用）
export async function fetchLearningRecords(filters?: {
  student_id?: string;
  module_type?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.student_id) params.set('student_id', filters.student_id);
  if (filters?.module_type) params.set('module_type', filters.module_type);
  if (filters?.limit) params.set('limit', filters.limit.toString());

  const response = await fetch(`/api/learning/session?${params.toString()}`);
  const result = await response.json();
  return result.success ? result.sessions : [];
}
