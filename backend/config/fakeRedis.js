// Fake Redis connection that works without a running Redis server
// Used when Redis is not available (no Docker)

class FakeRedis {
  constructor() {
    this.store = new Map();
    this.subscribers = new Map();
    this.status = 'ready';
    console.log('[Redis] Using in-memory fake Redis (no Redis server required)');
  }

  // Minimal interface required by BullMQ
  on(event, handler) { return this; }
  once(event, handler) { return this; }
  off(event, handler) { return this; }
  emit() { return this; }

  async get(key) { return this.store.get(key) || null; }
  async set(key, value, ...args) { this.store.set(key, value); return 'OK'; }
  async del(key) { this.store.delete(key); return 1; }
  async exists(key) { return this.store.has(key) ? 1 : 0; }
  async hset(key, field, value) {
    if (!this.store.has(key)) this.store.set(key, {});
    this.store.get(key)[field] = value;
    return 1;
  }
  async hget(key, field) {
    const hash = this.store.get(key);
    return hash ? hash[field] || null : null;
  }
  async hgetall(key) { return this.store.get(key) || null; }
  async lrange(key, start, stop) {
    const list = this.store.get(key) || [];
    return stop === -1 ? list.slice(start) : list.slice(start, stop + 1);
  }
  async lpush(key, ...values) {
    const list = this.store.get(key) || [];
    list.unshift(...values);
    this.store.set(key, list);
    return list.length;
  }
  async rpush(key, ...values) {
    const list = this.store.get(key) || [];
    list.push(...values);
    this.store.set(key, list);
    return list.length;
  }
  async expire(key, seconds) { return 1; }
  async ttl(key) { return -1; }
  async incr(key) {
    const val = parseInt(this.store.get(key) || '0') + 1;
    this.store.set(key, String(val));
    return val;
  }
  async zadd(key, ...args) { return 1; }
  async zrange(key, start, stop, ...opts) { return []; }
  async zrangebyscore(key, min, max, ...opts) { return []; }
  async zrem(key, ...members) { return 1; }
  async setnx(key, value) {
    if (!this.store.has(key)) { this.store.set(key, value); return 1; }
    return 0;
  }
  async multi() {
    const commands = [];
    const proxy = {
      hset: (...a) => { commands.push(['hset', ...a]); return proxy; },
      exec: async () => commands.map(() => 'OK')
    };
    return proxy;
  }
  async ping() { return 'PONG'; }
  async quit() { return 'OK'; }
  duplicate() { return this; }
  subscribe() {}
  unsubscribe() {}
  publish() {}
}

module.exports = FakeRedis;
