// ==========================================
// Zustand Store – Offer 捕手
// ==========================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// 生成或获取 sessionId
const getSessionId = () => {
  let id = localStorage.getItem('oc_session_id');
  if (!id) {
    id = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem('oc_session_id', id);
  }
  return id;
};

const useStore = create(
  persist(
    (set, get) => ({
      // ---- 会话 ----
      sessionId: getSessionId(),

      // ---- 分析状态 ----
      currentAnalysis: null,
      loading: false,
      error: null,

      // -- 对话 --
      chatMessages: [],
      chatLoading: false,

      // -- 历史 --
      history: [],

      // -- 偏好 --
      preferences: {},

      // ---- Actions ----
      setAnalysis: (data) => set({ currentAnalysis: data, error: null }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // 添加上传记录
      addHistory: (entry) =>
        set((state) => ({
          history: [
            { ...entry, timestamp: Date.now() },
            ...state.history,
          ].slice(0, 3),
        })),

      // 偏好
      setPreference: (key, value) =>
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        })),

      // ---- API 调用 ----

      uploadAndAnalyze: async (file, careerField) => {
        set({ loading: true, error: null });
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('session_id', get().sessionId);
          if (careerField) formData.append('career_field', careerField);

          const { data } = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (data.success) {
            set({ currentAnalysis: data.data });
            get().addHistory({
              matchScore: data.data.matchScore,
              summary: data.data.matchSummary || '分析完成',
            });
          } else {
            set({ error: data.message || '分析失败' });
          }
        } catch (err) {
          set({ error: err.response?.data?.message || err.message || '网络错误' });
        } finally {
          set({ loading: false });
        }
      },

      // 搜索岗位
      searchJobs: async (query, careerField) => {
        try {
          const { data } = await api.get('/jobs/search', {
            params: { query, career_field: careerField },
          });
          return data.data || [];
        } catch {
          return [];
        }
      },

      // 智能体对话
      sendMessage: async (text) => {
        set({ chatLoading: true });
        const msgs = Array.isArray(get().chatMessages) ? get().chatMessages : [];
        const newMsgs = [...msgs, { role: 'user', content: text }];
        set({ chatMessages: newMsgs });

        try {
          const { data } = await api.post('/agent/chat', {
            session_id: get().sessionId || 'anonymous',
            message: text,
            history: newMsgs.slice(-10),
            preferences: get().preferences || {},
          });

          if (data.success) {
            set({
              chatMessages: [
                ...newMsgs,
                { role: 'assistant', content: data.reply, tool_calls: data.tool_calls || null },
              ],
            });
            // 如果对话返回了分析结果，更新 currentAnalysis
            if (data.analysis) {
              set({ currentAnalysis: data.analysis });
            }
          } else {
            set({
              chatMessages: [
                ...newMsgs,
                { role: 'assistant', content: data.message || '抱歉，处理出错了，请重试。' },
              ],
            });
          }
        } catch (err) {
          set({
            chatMessages: [
              ...newMsgs,
              { role: 'assistant', content: '抱歉，我暂时无法回复，请稍后再试。' },
            ],
          });
        } finally {
          set({ chatLoading: false });
        }
      },

      clearChat: () => set({ chatMessages: [] }),
      resetAnalysis: () => set({ currentAnalysis: null, error: null }),
    }),
    {
      name: 'offer-catcher-store',
      partialize: (state) => ({
        sessionId: state.sessionId,
        history: state.history,
        preferences: state.preferences,
      }),
    }
  )
);

export default useStore;
