import { useEffect, useMemo, useState } from 'react';
import { ROLE_PROFILES, roleToJd } from '../data/roles.js';
import { analyzeMatch, cosineSimilarity, scoreBand } from '../lib/matchEngine.js';
import { embedWithAi } from '../lib/api.js';
import useAppStore from '../store/useAppStore.js';

export function useRoleMatches(profile) {
  const settings = useAppStore((state) => state.settings);
  const [cosines, setCosines] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile?.rawText || !settings.aiEnabled) {
      setCosines(null);
      setError('');
      return undefined;
    }
    let active = true;
    setLoading(true);
    setError('');
    embedWithAi(settings.apiBaseUrl, [profile.rawText.slice(0, 8000)], { timeoutMs: 10000 })
      .then((payload) => {
        const vector = payload?.data?.vectors?.[0];
        if (!Array.isArray(vector) || !vector.length) throw new Error('empty embedding');
        if (!active) return;
        const next = {};
        for (const role of ROLE_PROFILES) {
          next[role.field] = cosineSimilarity(vector, role.embedding || []);
        }
        setCosines(next);
      })
      .catch(() => {
        if (active) {
          setCosines(null);
          setError('语义排序暂不可用，当前仅使用本地匹配');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [profile?.rawText, settings.aiEnabled, settings.apiBaseUrl]);

  const matches = useMemo(() => {
    if (!profile) return [];
    const raw = ROLE_PROFILES.map((role) => {
      const jd = roleToJd(role);
      const local = analyzeMatch(profile, jd);
      return { role, jd, local, cosine: cosines?.[role.field] ?? null };
    });
    const available = raw.filter((item) => item.cosine !== null).sort((a, b) => b.cosine - a.cosine);
    const max = available[0]?.cosine ?? null;
    const min = available[available.length - 1]?.cosine ?? null;
    const ranks = new Map(available.map((item, index) => [item.role.field, index + 1]));
    return raw
      .map((item) => {
        const semanticScore = item.cosine === null || max === null
          ? null
          : max === min ? 50 : Math.round(((item.cosine - min) / (max - min)) * 100);
        const score = item.local.score;
        const scoreBandValue = scoreBand(score);
        const matched = (item.local.matchedSkills || []).slice(0, 3);
        const missing = (item.local.missingSkills || []).slice(0, 3);
        const semanticRank = ranks.get(item.role.field) || null;
        return {
          ...item,
          semanticScore,
          semanticRank,
          score,
          band: scoreBandValue,
          fitSummary: `按简历证据，本地匹配 ${score} 分${semanticRank ? `；Qwen 方向语义排第 ${semanticRank}` : ''}。共同能力：${matched.join('、') || '暂未命中'}；优先补：${missing.join('、') || '保持当前表达'}。`,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [profile, cosines]);

  return { matches, loading, error };
}