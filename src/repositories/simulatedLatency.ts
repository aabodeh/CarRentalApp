/**
 * TEMPORARY: remove when the API lands. Local data answers after a short delay so the UI has
 * real loading states today, and nothing above the repositories changes when the network arrives.
 */
export const SIMULATED_LATENCY_MS = 400;

export const simulateLatency = () =>
  new Promise<void>((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
