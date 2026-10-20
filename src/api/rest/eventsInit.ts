import { eventsApi } from '@/api/rest'

const initEventsApi = () => {

  const token = localStorage.getItem('token')
  
  if (token) {
    const cleanToken = token.trim().replace(/^['"]+|['"]+$/g, '')

    eventsApi.setToken(cleanToken)

  }
}

initEventsApi()

export { eventsApi }
