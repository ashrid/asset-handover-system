import React, { createContext, useContext, useReducer, useCallback } from 'react';

const ToastContext = createContext();

const toastReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TOAST':
      return [...state, { id: Date.now(), ...action.payload }];
    case 'REMOVE_TOAST':
      return state.filter(toast => toast.id !== action.id);
    default:
      return state;
  }
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const addToast = useCallback((type, message, duration) => {
    dispatch({ type: 'ADD_TOAST', payload: { type, message, duration } });
  }, []);

  const removeToast = useCallback((id) => {
    dispatch({ type: 'REMOVE_TOAST', id });
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 w-96 max-w-[90vw] space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};