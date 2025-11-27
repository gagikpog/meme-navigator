export function ensureDeviceId(): string | null {
  try {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = '10000000-1000-4000-8000-100000000000'.replace(
        /[018]/g,
        (c) =>
          (
            (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))) >>> 0
          ).toString(16)
      );
    }
    localStorage.setItem('deviceId', deviceId);
    return deviceId;
  } catch {
    return null;
  }
}
