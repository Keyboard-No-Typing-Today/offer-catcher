import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const isNative = () => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

const nativeAdapter = {
  async getItem(name) {
    const { value } = await Preferences.get({ key: name });
    return value ?? null;
  },
  async setItem(name, value) {
    await Preferences.set({ key: name, value });
  },
  async removeItem(name) {
    await Preferences.remove({ key: name });
  },
};

const webAdapter = {
  getItem(name) {
    try { return window.localStorage.getItem(name); } catch { return null; }
  },
  setItem(name, value) {
    try { window.localStorage.setItem(name, value); } catch { /* ignore quota */ }
  },
  removeItem(name) {
    try { window.localStorage.removeItem(name); } catch { /* ignore */ }
  },
};

export const storageAdapter = isNative() ? nativeAdapter : webAdapter;

export async function readRaw(key) {
  return storageAdapter.getItem(key);
}

export async function writeRaw(key, value) {
  return storageAdapter.setItem(key, value);
}

export async function removeRaw(key) {
  return storageAdapter.removeItem(key);
}

export function isNativePlatform() {
  return isNative();
}

