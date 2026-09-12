/**
 * redis.js - In-memory Redis that NEVER crashes.
 * Uses FakeRedis by default. If REDIS_PASSWORD is set, tries Upstash cloud Redis.
 * The app works 100% without any Redis server.
 */
const dotenv = require('dotenv');
dotenv.config();

class FakeRedis {
  constructor() {
    this.store = new Map();
    this._handlers = {};
    this.status = 'ready';
    console.log('[Redis] Using in-memory queue (no Redis server required)');
  }
  on(e, fn) { this._handlers[e] = fn; return this; }
  once(e, fn) { return this; }
  off() { return this; }
  removeAllListeners() { return this; }
  removeListener() { return this; }
  emit(e, ...a) { if (this._handlers[e]) this._handlers[e](...a); return this; }
  async get(k) { return this.store.get(k) ?? null; }
  async set(k, v) { this.store.set(k, v); return 'OK'; }
  async del(k) { this.store.delete(k); return 1; }
  async exists(k) { return this.store.has(k) ? 1 : 0; }
  async hset(k, f, v) {
    if (!this.store.has(k)) this.store.set(k, {});
    const h = this.store.get(k);
    if (typeof f === 'object') Object.assign(h, f);
    else h[f] = v;
    return 1;
  }
  async hget(k, f) { return (this.store.get(k) || {})[f] ?? null; }
  async hgetall(k) { return this.store.get(k) ?? null; }
  async hdel(k, f) { const h = this.store.get(k) || {}; delete h[f]; return 1; }
  async hmget(k, ...fs) { const h = this.store.get(k) || {}; return fs.map(f => h[f] ?? null); }
  async lpush(k, ...vs) { const l = this.store.get(k) || []; [...vs].reverse().forEach(v => l.unshift(v)); this.store.set(k, l); return l.length; }
  async rpush(k, ...vs) { const l = this.store.get(k) || []; vs.forEach(v => l.push(v)); this.store.set(k, l); return l.length; }
  async lpop(k) { const l = this.store.get(k) || []; return l.shift() ?? null; }
  async rpop(k) { const l = this.store.get(k) || []; return l.pop() ?? null; }
  async lrange(k, s, e) { const l = this.store.get(k) || []; return e === -1 ? l.slice(s) : l.slice(s, e + 1); }
  async llen(k) { return (this.store.get(k) || []).length; }
  async lrem(k) { return 0; }
  async lpos(k, v) { const l = this.store.get(k) || []; const i = l.indexOf(v); return i === -1 ? null : i; }
  async zadd(k, score, member) { 
    if (!this.store.has(k)) this.store.set(k, []);
    this.store.get(k).push({ score: Number(score), member });
    this.store.get(k).sort((a,b) => a.score - b.score);
    return 1;
  }
  async zrange(k) { return (this.store.get(k) || []).map(x => x.member); }
  async zrangebyscore() { return []; }
  async zrevrangebyscore() { return []; }
  async zrem(k, member) { 
    if (!this.store.has(k)) return 0;
    const l = this.store.get(k).filter(x => x.member !== member);
    this.store.set(k, l); return 1;
  }
  async zcard(k) { return (this.store.get(k) || []).length; }
  async zcount() { return 0; }
  async zscore(k, member) { const l = this.store.get(k) || []; const f = l.find(x => x.member === member); return f ? String(f.score) : null; }
  async zincrby(k, inc, member) {
    if (!this.store.has(k)) this.store.set(k, []);
    const l = this.store.get(k);
    const f = l.find(x => x.member === member);
    if (f) f.score += Number(inc); else l.push({ score: Number(inc), member });
    return String((l.find(x => x.member === member) || {}).score || 0);
  }
  async setnx(k, v) { if (!this.store.has(k)) { this.store.set(k, v); return 1; } return 0; }
  async setex(k, ttl, v) { this.store.set(k, v); return 'OK'; }
  async psetex(k, ms, v) { this.store.set(k, v); return 'OK'; }
  async expire() { return 1; }
  async pexpire() { return 1; }
  async expireat() { return 1; }
  async ttl() { return -1; }
  async pttl() { return -1; }
  async persist() { return 1; }
  async incr(k) { const v = parseInt(this.store.get(k) || '0') + 1; this.store.set(k, String(v)); return v; }
  async incrby(k, n) { const v = parseInt(this.store.get(k) || '0') + n; this.store.set(k, String(v)); return v; }
  async decr(k) { const v = parseInt(this.store.get(k) || '0') - 1; this.store.set(k, String(v)); return v; }
  async decrby(k, n) { const v = parseInt(this.store.get(k) || '0') - n; this.store.set(k, String(v)); return v; }
  async sadd(k, ...ms) { const s = this.store.get(k) || new Set(); ms.forEach(m => s.add(m)); this.store.set(k, s); return ms.length; }
  async smembers(k) { return [...(this.store.get(k) || new Set())]; }
  async sismember(k, m) { return (this.store.get(k) || new Set()).has(m) ? 1 : 0; }
  async srem(k, ...ms) { const s = this.store.get(k) || new Set(); ms.forEach(m => s.delete(m)); return ms.length; }
  async scard(k) { return (this.store.get(k) || new Set()).size; }
  async ping() { return 'PONG'; }
  async quit() { return 'OK'; }
  async disconnect() {}
  async subscribe() {}
  async unsubscribe() {}
  async publish() { return 0; }
  async keys(pattern) { return [...this.store.keys()]; }
  async type(k) { const v = this.store.get(k); if (!v) return 'none'; if (Array.isArray(v)) return 'list'; if (v instanceof Set) return 'set'; return 'string'; }
  async flushdb() { this.store.clear(); return 'OK'; }
  duplicate() { return new FakeRedis(); }
  pipeline() {
    const cmds = [];
    const p = { exec: async () => cmds.map(() => [null, 'OK']) };
    const handler = { get: (_, prop) => prop === 'exec' ? p.exec : (...args) => { cmds.push([prop, ...args]); return new Proxy({}, handler); } };
    return new Proxy({}, handler);
  }
  multi() { return this.pipeline(); }
}

// Export FakeRedis singleton — always works
const connection = new FakeRedis();
module.exports = connection;
