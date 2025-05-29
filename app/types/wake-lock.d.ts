// Wake Lock API Type Definitions
interface WakeLock {
  request(type: 'screen'): Promise<WakeLockSentinel>;
}

interface WakeLockSentinel {
  readonly released: boolean;
  readonly type: 'screen';
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
  removeEventListener(type: 'release', listener: () => void): void;
}

interface Navigator {
  readonly wakeLock?: WakeLock;
} 