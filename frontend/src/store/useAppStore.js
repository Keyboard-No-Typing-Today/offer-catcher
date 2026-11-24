import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storageAdapter } from '../lib/storage.js';
import { getDefaultApiBase } from '../lib/api.js';
import { SAMPLE_RESUME, SAMPLE_JD, SAMPLE_TRACKER } from '../lib/sampleData.js';
import { parseResume } from '../lib/resumeProfile.js';
import { parseJobDescription } from '../lib/jdParser.js';
import { analyzeMatch } from '../lib/matchEngine.js';
import { uid } from '../lib/format.js';
import { STORAGE_KEY } from '../lib/constants.js';

const defaultSettings = {
  apiBaseUrl: getDefaultApiBase(),
  aiEnabled: true,
  lastAiCheck: null,
};

const initialState = {
  profile: null,
  analyses: [],
  tracker: [],
  savedJobIds: [],
  chatMessages: [],
  settings: defaultSettings,
  aiStatus: { state: 'unknown', message: '', models: null },
  hydrated: false,
};

function makeAnalysis(jd, analysis, extras = {}) {
  return {
    id: extras.id || uid('analysis'),
    createdAt: extras.createdAt || Date.now(),
    jobId: jd.jobId || extras.jobId || null,
    jobTitle: jd.title,
    company: jd.company,
    jdText: jd.rawText,
    jd,
    mode: analysis.mode || 'local',
    score: analysis.score,
    band: analysis.band,
    summary: analysis.summary,
    dimensions: analysis.dimensions,
    matchedSkills: analysis.matchedSkills || [],
    missingSkills: analysis.missingSkills || [],
    preferredMissing: analysis.preferredMissing || [],
    strengths: analysis.strengths || [],
    gaps: analysis.gaps || [],
    suggestions: analysis.suggestions || [],
    semanticScore: analysis.semanticScore ?? null,
    aiScore: analysis.aiScore ?? null,
    meta: analysis.meta || {},
    ...extras,
  };
}

export const useAppStore = create(persist(
  (set, get) => ({
    ...initialState,

    setHydrated: (value) => set({ hydrated: Boolean(value) }),
    saveProfile: (profile) => set({ profile }),
    clearProfile: () => set({ profile: null }),

    setSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
    setAiStatus: (aiStatus) => set({ aiStatus }),

    addAnalysis: (jd, analysis, extras = {}) => {
      const entry = makeAnalysis(jd, analysis, extras);
      set((state) => ({
        analyses: [entry, ...state.analyses.filter((item) => item.id !== entry.id)].slice(0, 30),
      }));
      return entry;
    },
    updateAnalysis: (id, patch) => set((state) => ({
      analyses: state.analyses.map((item) => item.id === id ? { ...item, ...patch } : item),
    })),
    removeAnalysis: (id) => set((state) => ({ analyses: state.analyses.filter((item) => item.id !== id) })),
    clearAnalyses: () => set({ analyses: [] }),

    toggleSavedJob: (jobId) => set((state) => ({
      savedJobIds: state.savedJobIds.includes(jobId)
        ? state.savedJobIds.filter((id) => id !== jobId)
        : [jobId, ...state.savedJobIds],
    })),
    isJobSaved: (jobId) => get().savedJobIds.includes(jobId),

    addTracker: (entry) => {
      const existing = get().tracker.find((item) =>
        (entry.jobId && item.jobId === entry.jobId) ||
        (!entry.jobId && item.title === entry.title && item.company === entry.company)
      );
      if (existing) {
        set((state) => ({
          tracker: state.tracker.map((item) => item.id === existing.id ? { ...item, ...entry, updatedAt: Date.now() } : item),
        }));
        return existing.id;
      }
      const id = uid('track');
      set((state) => ({
        tracker: [{
          id,
          jobId: entry.jobId || null,
          title: entry.title || '未命名岗位',
          company: entry.company || '',
          status: entry.status || 'saved',
          notes: entry.notes || '',
          appliedAt: entry.appliedAt || null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }, ...state.tracker],
      }));
      return id;
    },
    updateTracker: (id, patch) => set((state) => ({
      tracker: state.tracker.map((item) => item.id === id ? { ...item, ...patch, updatedAt: Date.now() } : item),
    })),
    removeTracker: (id) => set((state) => ({ tracker: state.tracker.filter((item) => item.id !== id) })),
    getTrackerForJob: (jobId) => get().tracker.find((item) => item.jobId === jobId) || null,

    addChatMessage: (message) => set((state) => ({
      chatMessages: [...state.chatMessages, {
        id: message.id || uid('msg'),
        role: message.role || 'assistant',
        content: message.content || '',
        jobIds: message.jobIds || [],
        mode: message.mode || 'local',
        createdAt: Date.now(),
      }].slice(-40),
    })),
    clearChat: () => set({ chatMessages: [] }),

    loadSample: () => {
      const profile = parseResume(SAMPLE_RESUME, { fileName: '示例简历.txt', fileType: 'text/plain' });
      const jd = parseJobDescription(SAMPLE_JD);
      const analysis = analyzeMatch(profile, jd);
      const entry = makeAnalysis(jd, analysis);
      const tracker = SAMPLE_TRACKER.map((item) => ({
        id: uid('track'),
        jobId: null,
        title: item.title,
        company: item.company,
        status: item.status,
        notes: item.notes,
        appliedAt: item.status === 'applied' ? Date.now() - 86400000 * 2 : null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
      set({ profile, analyses: [entry], tracker, savedJobIds: ['job-001', 'job-002', 'job-006'] });
      return entry;
    },

    resetUserData: () => set({ profile: null, analyses: [], tracker: [], savedJobIds: [], chatMessages: [] }),
    resetEverything: () => set({ ...initialState, settings: defaultSettings, hydrated: true }),

    exportData: () => {
      const state = get();
      return JSON.stringify({
        exportedAt: new Date().toISOString(),
        profile: state.profile,
        analyses: state.analyses,
        tracker: state.tracker,
        savedJobIds: state.savedJobIds,
        settings: { ...state.settings, apiBaseUrl: state.settings.apiBaseUrl },
      }, null, 2);
    },
  }),
  {
    name: STORAGE_KEY,
    version: 1,
    storage: createJSONStorage(() => storageAdapter),
    partialize: (state) => ({
      profile: state.profile,
      analyses: state.analyses,
      tracker: state.tracker,
      savedJobIds: state.savedJobIds,
      chatMessages: state.chatMessages,
      settings: state.settings,
    }),
    onRehydrateStorage: () => (state) => {
      if (state) state.setHydrated(true);
    },
  }
));

export default useAppStore;

