// Module-level reentrancy guard. The flag MUST be cleared synchronously
// before any subsequent await — clearing it after `await closePluginView`
// has been observed (sn-dictionary / sn-formula) to leave it stuck
// `true` on a real device, which then rejects every future button press.

let busy = false;

export const tryAcquire = (): boolean => {
  if (busy) {
    return false;
  }
  busy = true;
  return true;
};

export const release = (): void => {
  busy = false;
};

export const isBusy = (): boolean => busy;
