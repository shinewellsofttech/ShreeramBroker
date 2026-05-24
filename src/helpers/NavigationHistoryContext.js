import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useEffect,
  useState,
} from "react"
import { useNavigate, useLocation } from "react-router-dom"

const NavigationHistoryContext = createContext(null)

// ─── In-memory page state store (survives navigation within the session) ────
const pageStateStore = {}

// Persist to sessionStorage so state survives a manual page-refresh too
const save = (pathname, key, value) => {
  const storeKey = `${pathname}::${key}`
  pageStateStore[storeKey] = value
  try {
    sessionStorage.setItem(`__ps__${storeKey}`, JSON.stringify(value))
  } catch (_) {}
}

const restore = (pathname, key, defaultValue) => {
  const storeKey = `${pathname}::${key}`
  if (pageStateStore[storeKey] !== undefined) return pageStateStore[storeKey]
  try {
    const raw = sessionStorage.getItem(`__ps__${storeKey}`)
    if (raw !== null) {
      const parsed = JSON.parse(raw)
      pageStateStore[storeKey] = parsed // warm the in-memory cache
      return parsed
    }
  } catch (_) {}
  return defaultValue
}

// ─── Provider ────────────────────────────────────────────────────────────────
export const NavigationHistoryProvider = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()

  // Internal app-level history stack (only counts in-app navigations)
  const historyStackRef = useRef([])
  const [canGoBack, setCanGoBack] = useState(false)

  useEffect(() => {
    const stack = historyStackRef.current
    // Push new path; avoid duplicate consecutive entries
    if (stack[stack.length - 1] !== location.pathname) {
      stack.push(location.pathname)
    }
    setCanGoBack(stack.length > 1)
  }, [location])

  const goBack = useCallback(() => {
    const stack = historyStackRef.current
    if (stack.length > 1) {
      stack.pop() // remove current
      navigate(-1)
    }
  }, [navigate])

  const savePageState = useCallback((pathname, key, value) => {
    save(pathname, key, value)
  }, [])

  const restorePageState = useCallback((pathname, key, defaultValue) => {
    return restore(pathname, key, defaultValue)
  }, [])

  return (
    <NavigationHistoryContext.Provider
      value={{ goBack, canGoBack, savePageState, restorePageState }}
    >
      {children}
    </NavigationHistoryContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useNavigationHistory = () => {
  const ctx = useContext(NavigationHistoryContext)
  if (!ctx)
    throw new Error(
      "useNavigationHistory must be used inside NavigationHistoryProvider"
    )
  return ctx
}
