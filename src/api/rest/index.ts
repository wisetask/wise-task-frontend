import { useEventsApi } from './Events'

export const eventsApi = useEventsApi({
  baseURL: import.meta.env.VITE_API_URL || 'http://wisetask.ru:8085/api'
})

export { useEventsApi }

export type { EventsApi } from './Events'
export type {
  EventData,
  EventTypeData,
  ApiError,
  EventsApiState,
  ApiConfig,
  EventsApiMethods
} from './types/Event'