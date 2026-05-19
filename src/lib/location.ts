/**
 * 浏览器定位工具 — 封装 navigator.geolocation 调用
 */

import type { CurrentLocation, LocationPermissionState } from "../types";

/** 检测浏览器是否支持 Geolocation API */
export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

/**
 * 查询当前定位权限状态
 * 仅在支持 Permissions API 时返回精确状态，否则回退到 "prompt"
 */
export async function queryPermissionState(): Promise<LocationPermissionState> {
  if (!isGeolocationSupported()) return "unavailable";

  try {
    if (navigator.permissions?.query) {
      const status = await navigator.permissions.query({ name: "geolocation" });
      return status.state as LocationPermissionState;
    }
  } catch {
    // Permissions API 不可用时静默回退
  }

  return "prompt";
}

/**
 * 请求浏览器定位
 * @param timeoutMs 超时毫秒数，默认 8000
 * @returns CurrentLocation 或 reject 错误信息
 */
export function requestBrowserLocation(timeoutMs = 8000): Promise<CurrentLocation> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error("GEOLOCATION_NOT_SUPPORTED"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        reject(new Error(normalizeGeolocationError(err)));
      },
      {
        enableHighAccuracy: false,
        timeout: timeoutMs,
        maximumAge: 300_000, // 5 分钟缓存
      },
    );
  });
}

/**
 * 将 GeolocationPositionError 转换为可读错误码
 */
export function normalizeGeolocationError(err: unknown): string {
  if (err instanceof GeolocationPositionError) {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return "PERMISSION_DENIED";
      case err.POSITION_UNAVAILABLE:
        return "POSITION_UNAVAILABLE";
      case err.TIMEOUT:
        return "TIMEOUT";
    }
  }
  if (err instanceof Error) return err.message;
  return "UNKNOWN_ERROR";
}

/**
 * 可读错误码 → 用户友好提示文本
 */
export function locationErrorToMessage(code: string): string {
  switch (code) {
    case "GEOLOCATION_NOT_SUPPORTED":
      return "当前浏览器不支持定位功能";
    case "PERMISSION_DENIED":
      return "定位权限被拒绝，请在浏览器设置中允许定位";
    case "POSITION_UNAVAILABLE":
      return "无法获取当前位置，请检查网络或 GPS";
    case "TIMEOUT":
      return "定位请求超时，请稍后重试";
    default:
      return "定位失败，请手动输入所在城市";
  }
}
