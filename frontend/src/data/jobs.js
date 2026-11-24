import jobs from '../../../shared/jobs.js';
import fields from '../../../shared/fields.js';

export const JOBS = jobs;
export const FIELDS = fields;
export const FIELD_MAP = Object.fromEntries(fields.map((field) => [field.id, field]));

export function fieldLabel(id) { return FIELD_MAP[id]?.label || '其他'; }
export function fieldShort(id) { return FIELD_MAP[id]?.short || '其他'; }
export function fieldColor(id) { return FIELD_MAP[id]?.color || '#8A857A'; }
export function getJob(id) { return JOBS.find((job) => job.id === id) || null; }

export function filterJobs(jobs, options = {}) {
  const field = options.field || 'all';
  const type = options.type || 'all';
  const query = String(options.keyword || '').trim().toLowerCase();
  return jobs.filter((job) => {
    if (field !== 'all' && job.field !== field) return false;
    if (type !== 'all' && job.type !== type) return false;
    if (!query) return true;
    const haystack = [job.title, job.company, job.location, job.description, job.requirements, ...(job.tags || [])].join(' ').toLowerCase();
    return haystack.includes(query);
  });
}

