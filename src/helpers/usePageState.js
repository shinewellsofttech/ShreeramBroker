import { useState, useCallback } from "react"
import { useLocation } from "react-router-dom"
import { useNavigationHistory } from "./NavigationHistoryContext"

/**
 * Drop-in replacement for React.useState that automatically persists its value
 * across back-navigation (via sessionStorage + in-memory store).
 *
 * Usage:
 *   const [fromDate, setFromDate] = usePageState("fromDate", new Date())
 *
 * @param {string}  key           Unique key within this page (e.g. "fromDate")
 * @param {*}       initialValue  Default value used when no saved state exists
 */
const usePageState = (key, initialValue) => {
  const location = useLocation()
  const { savePageState, restorePageState } = useNavigationHistory()
  const pathname = location.pathname

  const [state, setStateInternal] = useState(() =>
    restorePageState(pathname, key, initialValue)
  )

  const setState = useCallback(
    newValue => {
      setStateInternal(prev => {
        const value =
          typeof newValue === "function" ? newValue(prev) : newValue
        savePageState(pathname, key, value)
        return value
      })
    },
    [pathname, key, savePageState]
  )

  return [state, setState]
}

export default usePageState
