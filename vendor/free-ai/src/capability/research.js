import fs from 'fs';
import path from 'path';

const STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'into', 'your', 'about', 'have', 'will', 'they', 'them', 'must', 'need', 'needs',
  'should', 'would', 'could', 'then', 'also', 'when', 'what', 'which', 'where', 'while', 'build', 'built', 'actually', 'user', 'users',
  'response', 'respond', 'persona', 'personas', 'skill', 'skills', 'engine', 'agent', 'context', 'discussion', 'right', 'best', 'good',
  'idea', 'another', 'way', 'keep', 'going', 'same', 'time', 'find', 'search', 'web', 'github', 'opensource', 'open', 'source'
]);

const EVIDENCE_DIR = path.join(process.cwd(), 'evidence', 'capabilities');

function ensureDir() {
  if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

function slugify(text) {
  return (text || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function persist(record) {
  try {
    ensureDir();
    const file = path.join(EVIDENCE_DIR, `research-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.json`);
    fs.writeFileSync(file, JSON.stringify(record, null, 2));
  } catch {}
}

export function extractKeywords(text, limit = 8) {
  const counts = new Map();
  for (const token of (text || '').toLowerCase().match(/[a-z0-9][a-z0-9_-]{2,}/g) || []) {
    if (STOPWORDS.has(token)) continue;
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([token]) => token);
}

function withTimeout(url, options = {}, timeout = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return globalThis.fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

async function searchGithubRepos(query) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`;
  try {
    const resp = await withTimeout(url, { headers: { 'User-Agent': 'FREE-AI' } }, 3500);
    if (!resp.ok) return [];
    const body = await resp.json();
    return (body.items || []).slice(0, 5).map((item) => ({
      source: 'github',
      title: item.full_name,
      description: item.description || '',
      url: item.html_url,
      score: item.stargazers_count || 0,
      tags: item.topics || [],
    }));
  } catch {
    return [];
  }
}

function flattenRelatedTopics(topics = []) {
  const out = [];
  for (const topic of topics) {
    if (Array.isArray(topic.Topics)) out.push(...flattenRelatedTopics(topic.Topics));
    else out.push(topic);
  }
  return out;
}

async function searchDuckDuckGo(query) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  try {
    const resp = await withTimeout(url, { headers: { 'User-Agent': 'FREE-AI' } }, 3500);
    if (!resp.ok) return [];
    const body = await resp.json();
    const related = flattenRelatedTopics(body.RelatedTopics || []).slice(0, 5);
    const results = [];
    if (body.AbstractText) {
      results.push({
        source: 'web',
        title: body.Heading || query,
        description: body.AbstractText,
        url: body.AbstractURL || null,
        score: body.AbstractText.length,
      });
    }
    for (const topic of related) {
      results.push({
        source: 'web',
        title: topic.Text || query,
        description: topic.Text || '',
        url: topic.FirstURL || null,
        score: (topic.Text || '').length,
      });
    }
    return results.slice(0, 5);
  } catch {
    return [];
  }
}

export function buildResearchQueries({ prompt, context, intent, type = 'general' }) {
  const keywords = extractKeywords(prompt, 6);
  const domain = context?.domain || 'general';
  const intentFamily = intent?.intent_family || 'chat';
  const base = keywords.join(' ');
  return [
    `${base} ${domain} ${intentFamily} ${type} best practices`,
    `${base} agent ${type} github`,
    `${base} ${type} web search patterns`,
  ].map((query) => query.trim()).filter(Boolean);
}

export async function researchCapabilitySources({ prompt, context, intent, type = 'general', maxQueries = 2 }) {
  const queries = buildResearchQueries({ prompt, context, intent, type }).slice(0, maxQueries);
  const github = [];
  const web = [];
  for (const query of queries) {
    github.push(...await searchGithubRepos(query));
    web.push(...await searchDuckDuckGo(query));
  }
  const record = {
    research_id: `research-${Date.now()}-${slugify(type)}`,
    type,
    queries,
    github: github.slice(0, 8),
    web: web.slice(0, 8),
    keywords: extractKeywords(prompt),
    generated_at: new Date().toISOString(),
  };
  persist(record);
  return record;
}
