// Global error handler utility
export const handleError = (error, context = '') => {
  console.error(`Error in ${context}:`, error);
  
  // Handle different types of errors
  if (error instanceof TypeError) {
    console.error('Type error - possible null/undefined reference:', error.message);
  } else if (error instanceof ReferenceError) {
    console.error('Reference error - variable not defined:', error.message);
  } else if (error.name === 'SyntaxError') {
    console.error('Syntax error:', error.message);
  } else if (error.response) {
    // HTTP error
    console.error('HTTP Error:', error.response.status, error.response.statusText);
  } else if (error.message) {
    console.error('General error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }

  // Log to external service in production (optional)
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service
    // logToService(error, context);
  }
};

// Promise rejection handler
export const handlePromiseRejection = (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
  handleError(event.reason, 'Unhandled Promise');
  // Prevent the default behavior (logging to console)
  event.preventDefault();
};

// Add global error listeners
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', handlePromiseRejection);
  
  // Handle general JavaScript errors
  window.addEventListener('error', (event) => {
    handleError(event.error, 'Global Error Handler');
  });
  
  console.log('Global error handling initialized');
};

// Safe async function wrapper
export const safeAsync = (asyncFn, context = '') => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      handleError(error, context);
      throw error; // Re-throw so calling code can handle it
    }
  };
};

// Safe fetch wrapper
export const safeFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    
    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    handleError(error, `Fetch to ${url}`);
    return { success: false, error: error.message };
  }
};