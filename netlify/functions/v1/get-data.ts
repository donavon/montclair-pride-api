import { events, performers, stages, parking } from "./mock-data";

export async function getData() {
  // NOTE: This will eventually hit an API to fetch real data (which is why it's async).
  // For now, we just return static mock data during development of the app.
  return {
    events,
    performers,
    stages,
    parking,
  };
}
