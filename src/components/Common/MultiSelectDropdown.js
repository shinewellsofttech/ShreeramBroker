import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from 'react-bootstrap'

const MultiSelectDropdown = ({
  options = [],
  value = [],
  selectedValues = [],
  onChange,
  placeholder = "Select options",
  isSearchable = true,
  isClearable = true,
  className = "",
  style = {},
  disabled = false,
  maxHeight = "200px",
  openUpward = false,
  displayKey = "label",
  valueKey = "value",
  expandedMenuWidth = 260
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef(null)

  // Use selectedValues if provided, otherwise use value
  const currentValue = selectedValues.length > 0 ? selectedValues : value
  const normalizedCurrentValue = useMemo(
    () => (currentValue || []).map(v => (v === null || v === undefined ? "" : v.toString())),
    [currentValue]
  )

  const [tempSelection, setTempSelection] = useState(normalizedCurrentValue)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm("")
        setTempSelection(normalizedCurrentValue)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTempSelection(normalizedCurrentValue)
    }
  }, [isOpen, normalizedCurrentValue])

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    const label = option[displayKey]
    return label && label.toString().toLowerCase().includes(searchTerm.toLowerCase())
  })

  const toggleDropdown = () => {
    setIsOpen(prev => {
      const next = !prev
      if (!next) {
        setTempSelection(normalizedCurrentValue)
        setSearchTerm("")
      }
      return next
    })
  }

  // Handle option toggle (without immediate apply)
  const handleOptionToggle = optionValue => {
    const normalizedValue = optionValue === null || optionValue === undefined ? "" : optionValue.toString()
    setTempSelection(prev => {
      if (normalizedValue === "") {
        if (prev.includes("")) {
          return prev.filter(v => v !== "")
        }
        return [""]
      }

      let next

      if (prev.includes(normalizedValue)) {
        next = prev.filter(v => v !== normalizedValue)
      } else {
        next = [...prev.filter(v => v !== ""), normalizedValue]
      }

      return next
    })
  }

  const applySelection = selection => {
    onChange(selection)
    setIsOpen(false)
    setSearchTerm("")
  }

  // Handle clear all from outside icon (immediate apply)
  const handleClearAll = () => {
    setTempSelection([])
    applySelection([])
  }

  // Handle clear all within dropdown (defer apply)
  const handleClearTempSelection = () => {
    setTempSelection([])
  }

  const handleDone = () => {
    applySelection(tempSelection)
  }

  const handleSelectAll = () => {
    const allValues = filteredOptions.map(opt => {
      const v = opt[valueKey]
      return v === null || v === undefined ? '' : v.toString()
    })
    setTempSelection(allValues)
  }

  // Get selected options
  const selectedOptions = options.filter(option => currentValue.includes(option[valueKey]))

  return (
    <div
      className={`position-relative ${className}`}
      ref={dropdownRef}
      style={{
        ...style,
        minWidth:
          isOpen && expandedMenuWidth
            ? `${expandedMenuWidth}px`
            : style?.minWidth,
      }}
    >
      {/* Dropdown Button */}
      <Button
        variant="outline-secondary"
        className="w-100 d-flex justify-content-between align-items-center"
        onClick={toggleDropdown}
        disabled={disabled}
        style={{
          fontSize: "0.7rem",
          minHeight: "38px",
          backgroundColor: "#f9f9fa",
          border: "1px solid #dee2e6",
          borderRadius: "0.375rem",
          padding: "0.375rem 0.75rem"
        }}
      >
        <span className="text-truncate">
          {currentValue.length === 0 
            ? placeholder 
            : `${currentValue.length} selected`
          }
        </span>
        <div className="d-flex align-items-center gap-1">
          {isClearable && currentValue.length > 0 && (
            <i 
              className="fas fa-times text-muted" 
              style={{ fontSize: "0.6rem" }}
              onClick={(e) => {
                e.stopPropagation()
                handleClearAll()
              }}
              title="Clear all"
            />
          )}
          <i 
            className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-muted`}
            style={{ fontSize: "0.6rem" }}
          />
        </div>
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="position-absolute bg-white border rounded shadow-lg"
          style={{
            top: openUpward ? "auto" : "100%",
            bottom: openUpward ? "100%" : "auto",
            left: 0,
            zIndex: 10000,
            maxHeight: maxHeight,
            overflowY: "auto",
            marginTop: openUpward ? "0" : "2px",
            marginBottom: openUpward ? "2px" : "0",
            width: expandedMenuWidth ? `${expandedMenuWidth}px` : "100%",
            minWidth: expandedMenuWidth ? `${expandedMenuWidth}px` : "100%",
          }}
        >
          {/* Search Input */}
          {isSearchable && (
            <div className="p-2 border-bottom">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: "0.7rem" }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Options List */}
          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-muted text-center" style={{ fontSize: "0.7rem" }}>
                {searchTerm ? "No matching options" : "No options available"}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const optionValue = option[valueKey]
                const optionLabel = option[displayKey]
                const normalizedValue = optionValue === null || optionValue === undefined ? "" : optionValue.toString()
                const isSelected = tempSelection.includes(normalizedValue)
                return (
                  <div
                    key={normalizedValue}
                    className={`px-3 py-2 d-flex justify-content-between align-items-center cursor-pointer ${
                      isSelected ? 'bg-primary text-white' : 'hover-bg-light'
                    }`}
                    style={{
                      fontSize: "0.7rem",
                      cursor: "pointer",
                      transition: "background-color 0.15s ease"
                    }}
                    onClick={() => handleOptionToggle(optionValue)}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.target.style.backgroundColor = "#f8f9fa"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.target.style.backgroundColor = "transparent"
                      }
                    }}
                  >
                    <span className="text-truncate">{optionLabel}</span>
                    {isSelected && (
                      <i className="fas fa-check" style={{ fontSize: "0.6rem" }} />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer Actions - same as Period modal: Clear All | Select All | Done */}
          <div className="p-2 border-top bg-light">
            <div className="d-flex justify-content-end align-items-center gap-2">
              {isClearable && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleClearTempSelection}
                  style={{ fontSize: "0.6rem", padding: "0.25rem 0.5rem" }}
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={handleSelectAll}
                style={{ fontSize: "0.6rem", padding: "0.25rem 0.5rem" }}
              >
                Select All
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleDone}
                style={{ fontSize: "0.6rem", padding: "0.25rem 0.5rem" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MultiSelectDropdown
