import { ref, type Ref } from 'vue'
import type {
  EventData,
  EventTypeData,
  ApiError,
  EventsApiState,
  ApiConfig,
  EventsApiMethods
} from '@/api/rest/types/Event'

const DEFAULT_CONFIG: ApiConfig = {
  baseURL: 'https://wisetask.ru/api'
}

export function useEventsApi(config: Partial<ApiConfig> = {}): EventsApiMethods {
  const { baseURL, token: initialToken } = { ...DEFAULT_CONFIG, ...config }
  const loading: Ref<boolean> = ref(false)
  const error: Ref<string | null> = ref(null)
  const token: Ref<string | undefined> = ref(initialToken)

  const setToken = (newToken: string): void => {
    const cleanedToken = newToken
      .trim()
      .replace(/^['"]+|['"]+$/g, '')
      .replace(/\\n/g, '')
      .replace(/\r?\n|\r/g, '');
    token.value = cleanedToken;
  }

  const clearToken = (): void => {
    token.value = undefined
  }

  const getCurrentToken = (): string | undefined => {
    return token.value;
  }

  const getHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (token.value) {
      const currentToken = token.value;
      if (currentToken.length < 10) {
      } else if (/[\r\n]/.test(currentToken)) {
      } else {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }
    } else {
    }
    return headers
  }

  const handleApiError = async (response: Response): Promise<ApiError> => {
    try {
      const errorData: ApiError = await response.json()
      return errorData
    } catch {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  }


  const createEvent = async (eventData: EventData): Promise<number | ApiError> => {
    loading.value = true
    error.value = null
    console.log("creating event: " + JSON.stringify(eventData))
    try {
      
      const response = await fetch(`${baseURL}/events/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(eventData)
      })


      if (!response.ok) {
        if (response.status === 401) {
          error.value = 'Неавторизованный доступ. Проверьте токен.'
          throw new Error('Unauthorized')
        }
        
        const errorData = await handleApiError(response)
        error.value = errorData.detail
        return errorData
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const text = await response.text();
          
          if (text.trim() === '') {
            return 0;
          }
          
          const eventId = JSON.parse(text);
          return eventId;
        } catch (parseError) {
          return 0;
        }
      } else {
        return 0;
      }
    } catch (err) {
      console.log("error creating event: " + err)
      if (err instanceof SyntaxError) {
        return 0;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  const createEventType = async (eventTypeData: EventTypeData): Promise<number | ApiError> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${baseURL}/events/type/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(eventTypeData)
      })

      if (!response.ok) {
        if (response.status === 401) {
          error.value = 'Неавторизованный доступ. Проверьте токен.'
          throw new Error('Unauthorized')
        }
        
        const errorData = await handleApiError(response)
        error.value = errorData.detail
        return errorData
      }

      const text = await response.text();
      if (text.trim() === '') {
        return 0;
      }
      
      const typeId: number = JSON.parse(text);
      return typeId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      error.value = errorMessage
      console.error('Error creating event type:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createAddNodeEvent = async (
    entityId: number, 
    taskId?: string,
    value: string = 'Добавили ребро.'
  ): Promise<number | ApiError> => {
    const eventData: EventData = {
      taskId: taskId || crypto.randomUUID(),
      eventType: 'add_node',
      eventEntityId: entityId,
      eventValue: value
    }
    
    return await createEvent(eventData)
  }

  const addEventType = async (eventName: string): Promise<number | ApiError> => {
    const eventTypeData: EventTypeData = { eventName }
    return await createEventType(eventTypeData)
  }

  const resetState = (): void => {
    loading.value = false
    error.value = null
  }

  const getState = (): EventsApiState => ({
    loading: loading.value,
    error: error.value
  })

  return {
    loading,
    error,
    setToken,
    clearToken,
    getCurrentToken,
    createEvent,
    createEventType,
    createAddNodeEvent,
    addEventType,
    getState,
    resetState
  }
}

export type EventsApi = ReturnType<typeof useEventsApi>