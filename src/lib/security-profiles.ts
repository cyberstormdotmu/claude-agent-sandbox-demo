// Security profiles for the Claude Sandbox Runtime
// These define the isolation parameters for different trust levels

export interface SecurityProfile {
  timeoutMs: number;
  memoryLimitMb: number;
  networkEnabled: boolean;
  allowedHosts?: string[];
}

export const SECURITY_PROFILES = {
  // "The Fort Knox" - For anonymous or untrusted users
  RESTRICTED: {
    timeoutMs: 10_000,       // Hard 10s limit. Code stuck in a loop? Kill it.
    memoryLimitMb: 128,      // Don't let them eat all the RAM.
    networkEnabled: false,   // No internet. None.
  } as SecurityProfile,

  // "The Standard" - For legitimate data analysis
  STANDARD: {
    timeoutMs: 30_000,
    memoryLimitMb: 512,
    networkEnabled: true,
    // Only allow traffic to trusted package repositories
    allowedHosts: ['pypi.org', 'files.pythonhosted.org'],
  } as SecurityProfile,
} as const;

export type SecurityProfileName = keyof typeof SECURITY_PROFILES;
