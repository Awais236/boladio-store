export function getSocket() {
  return { on: () => {}, off: () => {}, emit: () => {}, disconnect: () => {} };
}
export function reconnectSocket() {}
export function disconnectSocket() {}
