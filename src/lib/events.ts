import { EventEmitter } from 'events';

// For development, ensure the emitter survives hot reloads in Next.js
const globalForEvents = globalThis as unknown as {
    events: EventEmitter;
};

export const events = globalForEvents.events ?? new EventEmitter();

if (process.env.NODE_ENV !== 'production') globalForEvents.events = events;

export const EVENT_TOPICS = {
    GALLERY_UPDATE: 'gallery_update',
    SERVICES_UPDATE: 'services_update',
    CONFIG_UPDATE: 'config_update',
};
