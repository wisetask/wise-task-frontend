import { type Ref } from 'vue'

export interface EventData {
  taskId: string;
  eventType: string;
  eventEntityId?: number;
  eventValue: string;
}

export interface EventTypeData {
  eventName: string;
}

export interface ApiError {
  detail: string;
  instance: string;
  status: number;
  title: string;
  errorCode: string;
  timestamp: string;
}

export interface EventsApiState {
  loading: boolean;
  error: string | null;
}

export interface ApiConfig {
  baseURL: string;
  token?: string;
}

export interface EventsApiMethods {
  loading: Ref<boolean>;
  error: Ref<string | null>;

  setToken: (token: string) => void;
  clearToken: () => void;
  getCurrentToken: () => string | undefined;
  createEvent: (eventData: EventData) => Promise<number | ApiError>;
  createEventType: (eventTypeData: EventTypeData) => Promise<number | ApiError>;
  createAddNodeEvent: (
    entityId: number, 
    taskId?: string,
    value?: string
  ) => Promise<number | ApiError>;
  addEventType: (eventName: string) => Promise<number | ApiError>;
  getState: () => EventsApiState;
  resetState: () => void;
}