const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const base64Str = String(base64String);

  const padding = '='.repeat((4 - (base64Str.length % 4)) % 4);
  const base64 = (base64Str + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

export default urlBase64ToUint8Array;