export default {
  // 存储值
  setItem(key, value) {
    try {
      uni.setStorageSync(key, value);
    } catch (err) {
      console.warn(`uniStorage ${key} set error`, err);
    }
  },
  getItem(key) {
    try {
      const result = uni.getStorageSync(key);
      return result ? result : null;
    } catch (err) {
      console.warn(`uniStorage ${key} get error`, err);
    }
  },
  getAll() {
    try {
      const result = uni.getStorageInfoSync();
      return result ? result : null;
    } catch (err) {
      console.warn(`uniStorage getStorageInfoSync error`, err);
    }
  },
  removeItem(key) {
    try {
      uni.removeStorageSync(key);
    } catch (err) {
      console.warn(`uniStorage ${key} clear error`, err);
    }
  },
  clear() {
    try {
      uni.clearStorageSync();
    } catch (err) {
      console.warn(`uniStorage clear error`, err);
    }
  },
};
