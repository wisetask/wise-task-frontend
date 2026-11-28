export interface ErrorSignals {
  httpStatus: number | null;
  classifications: string[];
  keepSession: boolean;
}

export function shouldEndSession(signals: ErrorSignals): boolean {
  if (signals.httpStatus === 401) {
    return true;
  }
  if (signals.keepSession) {
    return false;
  }
  return signals.classifications.includes("UNAUTHORIZED");
}
