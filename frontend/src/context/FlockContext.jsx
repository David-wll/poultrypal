import { createContext, useContext, useState, useEffect } from 'react'
import { getFlocks } from '../services/flockService'
import { useAuth } from './AuthContext'

const FlockContext = createContext()

export function FlockProvider({ children }) {
  const [flocks, setFlocks] = useState([])
  const [loading, setLoading] = useState(false)
  const { farmer } = useAuth()

  const fetchFlocks = async () => {
    if (!farmer) return
    setLoading(true)
    try {
      const res = await getFlocks()
      setFlocks(res.data)
    } catch (err) {
      console.error('Failed to fetch flocks', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlocks()
  }, [farmer])

  return (
    <FlockContext.Provider value={{ flocks, setFlocks, loading, fetchFlocks }}>
      {children}
    </FlockContext.Provider>
  )
}

export const useFlocks = () => useContext(FlockContext)