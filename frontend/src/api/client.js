// DealsRadar EG API Client with Offline IndexedDB/LocalStorage Caching

const API_BASE = "/api/v1";

// Simple client-side cache helper
const CACHE_PREFIX = "dealsradar_cache_";
const getCached = (key) => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    // Cache valid for 30 minutes offline
    if (Date.now() - timestamp < 30 * 60 * 1000) {
      return data;
    }
  } catch (e) {
    return null;
  }
  return null;
};

const setCached = (key, data) => {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    // quota exceeded or private mode
  }
};

export const api = {
  // 1. Deals Feed
  async getDeals(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.page_size) query.append("page_size", params.page_size);
    if (params.min_discount !== undefined && params.min_discount !== null) query.append("min_discount", params.min_discount);
    if (params.min_price) query.append("min_price", params.min_price);
    if (params.max_price) query.append("max_price", params.max_price);
    if (params.stores) query.append("stores", Array.isArray(params.stores) ? params.stores.join(",") : params.stores);
    if (params.category && params.category !== "All") query.append("category", params.category);
    if (params.brand) query.append("brand", params.brand);
    if (params.search) query.append("search", params.search);
    if (params.is_all_time_low) query.append("is_all_time_low", "true");
    if (params.is_flash_sale) query.append("is_flash_sale", "true");
    if (params.sort_by) query.append("sort_by", params.sort_by);

    const cacheKey = `deals_${query.toString()}`;
    try {
      const res = await fetch(`${API_BASE}/deals?${query.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setCached(cacheKey, data);
      return data;
    } catch (err) {
      console.warn("Network fetch failed, attempting cached fallback for deals:", err);
      const cached = getCached(cacheKey);
      if (cached) return cached;
      throw err;
    }
  },

  // 2. Deal Details & History
  async getDealById(id) {
    const res = await fetch(`${API_BASE}/deals/${id}`);
    if (!res.ok) throw new Error("Failed to fetch deal details");
    return res.json();
  },

  async getDealHistory(id) {
    const res = await fetch(`${API_BASE}/deals/${id}/history`);
    if (!res.ok) throw new Error("Failed to fetch deal price history");
    return res.json();
  },

  // 3. Market Stats
  async getStats() {
    const cacheKey = "market_stats";
    try {
      const res = await fetch(`${API_BASE}/deals/stats`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setCached(cacheKey, data);
      return data;
    } catch (err) {
      const cached = getCached(cacheKey);
      if (cached) return cached;
      throw err;
    }
  },

  // 4. Stores Management
  async getStores() {
    const res = await fetch(`${API_BASE}/stores`);
    if (!res.ok) throw new Error("Failed to fetch stores");
    return res.json();
  },

  async validateStore(url, selectors) {
    const res = await fetch(`${API_BASE}/stores/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, selectors })
    });
    return res.json();
  },

  async registerStore(storeData) {
    const res = await fetch(`${API_BASE}/stores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(storeData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to register store");
    }
    return res.json();
  },

  async crawlStore(storeId) {
    const res = await fetch(`${API_BASE}/stores/${storeId}/crawl`, { method: "POST" });
    return res.json();
  },

  // 5. Alert Rules & Push Subscriptions
  async getAlertRules(deviceId = "default-device") {
    const res = await fetch(`${API_BASE}/alerts?device_id=${encodeURIComponent(deviceId)}`);
    if (!res.ok) throw new Error("Failed to fetch alert rules");
    return res.json();
  },

  async createAlertRule(ruleData) {
    const res = await fetch(`${API_BASE}/alerts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ruleData)
    });
    if (!res.ok) throw new Error("Failed to create alert rule");
    return res.json();
  },

  async deleteAlertRule(ruleId) {
    const res = await fetch(`${API_BASE}/alerts/${ruleId}`, { method: "DELETE" });
    return res.json();
  },

  async subscribeWebPush(subData) {
    const res = await fetch(`${API_BASE}/alerts/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subData)
    });
    return res.json();
  },

  async sendTestPush(deviceId, title, body) {
    const res = await fetch(`${API_BASE}/alerts/test-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, title, body })
    });
    return res.json();
  },

  async getNotifications(deviceId = "default-device") {
    const res = await fetch(`${API_BASE}/alerts/notifications?device_id=${encodeURIComponent(deviceId)}`);
    if (!res.ok) throw new Error("Failed to fetch notifications");
    return res.json();
  },

  async markNotificationRead(id) {
    const res = await fetch(`${API_BASE}/alerts/notifications/${id}/read`, { method: "POST" });
    return res.json();
  },

  async markAllNotificationsRead(deviceId = "default-device") {
    const res = await fetch(`${API_BASE}/alerts/notifications/mark-all-read?device_id=${encodeURIComponent(deviceId)}`, { method: "POST" });
    return res.json();
  },

  // 6. Multi-Modal AI Search
  async parseVoice(transcript, audioBase64 = null) {
    const res = await fetch(`${API_BASE}/media/parse-voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, audio_base64: audioBase64 })
    });
    if (!res.ok) throw new Error("Voice parsing error");
    return res.json();
  },

  async parseImage(imageBase64, filename = "upload.jpg") {
    const res = await fetch(`${API_BASE}/media/parse-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64: imageBase64, filename })
    });
    if (!res.ok) throw new Error("Image parsing error");
    return res.json();
  }
};
