import { SET_GLOBAL_DATES } from '../actionTypes';

// Load dates from localStorage if available
const loadDatesFromLocalStorage = () => {
  try {
    const savedFromDate = localStorage.getItem('globalFromDate');
    const savedToDate = localStorage.getItem('globalToDate');
    
    return {
      fromDate: savedFromDate ? new Date(savedFromDate) : new Date("2025-01-01T00:00:00"),
      toDate: savedToDate ? new Date(savedToDate) : new Date(),
    };
  } catch (error) {
    console.error('Error loading dates from localStorage:', error);
    return {
      fromDate: new Date("2025-01-01T00:00:00"),
      toDate: new Date(),
    };
  }
};

const initialState = loadDatesFromLocalStorage();

const GlobalDates = (state = initialState, action) => {
  switch (action.type) {
    case SET_GLOBAL_DATES:
      const newState = {
        ...state,
        fromDate: action.payload.fromDate,
        toDate: action.payload.toDate,
      };
      
      // Save to localStorage
      try {
        localStorage.setItem('globalFromDate', action.payload.fromDate.toISOString());
        localStorage.setItem('globalToDate', action.payload.toDate.toISOString());
      } catch (error) {
        console.error('Error saving dates to localStorage:', error);
      }
      
      return newState;
    default:
      return state;
  }
};

export default GlobalDates;
