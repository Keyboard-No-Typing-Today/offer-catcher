import { describe, it, expect } from 'vitest';
import { localAssistantReply } from './localAssistant.js';

describe('localAssistantReply', () => {
  it('recommends jobs when asked for a direction', () => {
    const reply = localAssistantReply('帮我找几个前端实习', {});
    expect(reply.reply).toContain('前端');
    expect(Array.isArray(reply.jobIds)).toBe(true);
    expect(reply.jobIds.length).toBeGreaterThan(0);
  });

  it('summarizes tracker status', () => {
    const reply = localAssistantReply('我的投递进展怎么样', { tracker: [{ status: 'applied' }, { status: 'interview' }] });
    expect(reply.reply).toContain('2 条投递记录');
    expect(reply.reply).toContain('面试中 1 条');
  });

  it('handles an empty message', () => {
    expect(localAssistantReply('', {}).reply).toContain('想聊点什么');
  });
});
