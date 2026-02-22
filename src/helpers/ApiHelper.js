const handleError = (response) => {
    return {
      status: response.status,
      success: response.success,
      data: response.data,
      message: response.message,
    };
  };

// Helper function to handle 401 unauthorized
const handleUnauthorized = () => {
    localStorage.clear();
    window.location.href = '/login';
};

// Helper function to check response status and handle errors
const handleResponse = async (response) => {
    if (response.status === 401) {
        handleUnauthorized();
        throw new Error('Unauthorized access');
    }
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Check if response has content before parsing JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        try {
            const json = await response.json();
            return handleError(json);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            throw new Error('Invalid JSON response');
        }
    } else {
        // Handle non-JSON responses
        const text = await response.text();
        return {
            status: response.status,
            success: response.ok,
            data: text,
            message: 'Non-JSON response'
        };
    }
};
  
  const apiGET = (url, headers = null) => {
    const requestOptions = {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
    };
    
    // Add custom headers if provided
    if (headers) {
      requestOptions.headers = { ...requestOptions.headers, ...headers };
    }
  
    return fetch(url, requestOptions)
      .then((response) => handleResponse(response))
      .catch((error) => {
        console.error('API GET Error:', error);
        if (error.message === 'Unauthorized access') {
            // Already handled by handleUnauthorized
            return;
        }
        throw error;
      });
  };

  const apiPOST = (url, data, headers = null) => {
    const requestOptions = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
    };
    
    // Add custom headers if provided
    if (headers) {
      requestOptions.headers = { ...requestOptions.headers, ...headers };
    }
  
    return fetch(url, requestOptions)
      .then((response) => handleResponse(response))
      .catch((error) => {
        console.error('API POST Error:', error);
        if (error.message === 'Unauthorized access') {
            // Already handled by handleUnauthorized
            return;
        }
        throw error;
      });
  };

  const apiPOST_Multipart = (url, formdata, headers = null) => {
    const requestOptions = {
      method: 'POST',
      body: formdata,
    };
    
    // Add custom headers if provided
    if (headers) {
      requestOptions.headers = headers;
    }
    
    return fetch(url, requestOptions)
      .then(async (response) => {
        if (response.ok) return handleResponse(response);
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const body = await response.json();
            const msg = (body.message || body.data?.message || '').toString().toLowerCase();
            const isDuplicate = Number(body.status) === 208 || (body.data && (body.data.id === -1 || body.data.data?.id === -1))
              || msg.includes('already exists') || msg.includes('duplicate');
            if (isDuplicate) {
              return { status: body.status ?? response.status, data: body, message: body.message };
            }
          } catch (e) {}
        }
        throw new Error('HTTP error! status: ' + response.status);
      })
      .catch((error) => {
        console.error('API POST Multipart Error:', error);
        if (error.message === 'Unauthorized access') {
            return;
        }
        throw error;
      });
  };

  const apiPUT_Multipart = (url, formdata, headers = null) => {
    const requestOptions = {
      method: 'PUT',
      body: formdata,
    };
    
    // Add custom headers if provided
    if (headers) {
      requestOptions.headers = headers;
    }
    return fetch(url, requestOptions)
      .then(async (response) => {
        if (response.ok) return handleResponse(response);
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const body = await response.json();
            const msg = (body.message || body.data?.message || '').toString().toLowerCase();
            const isDuplicate = Number(body.status) === 208 || (body.data && (body.data.id === -1 || body.data.data?.id === -1))
              || msg.includes('already exists') || msg.includes('duplicate');
            if (isDuplicate) {
              return { status: body.status ?? response.status, data: body, message: body.message };
            }
          } catch (e) {}
        }
        throw new Error('HTTP error! status: ' + response.status);
      })
      .catch((error) => {
        console.error('API PUT Multipart Error:', error);
        if (error.message === 'Unauthorized access') {
            return;
        }
        throw error;
      });
  };
  
  const apiPUT = (url, data, headers = null) => {
    const requestOptions = {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
    };
    
    // Add custom headers if provided
    if (headers) {
      requestOptions.headers = { ...requestOptions.headers, ...headers };
    }
  
    return fetch(url, requestOptions)
      .then((response) => handleResponse(response))
      .catch((error) => {
        console.error('API PUT Error:', error);
        if (error.message === 'Unauthorized access') {
            // Already handled by handleUnauthorized
            return;
        }
        throw error;
      });
  };

  const apiDELETE = (url, data, headers = null) => {
      const requestOptions = {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
      };
      
      // Add custom headers if provided
      if (headers) {
          requestOptions.headers = { ...requestOptions.headers, ...headers };
      }
  
      return fetch(url, requestOptions)
      .then(async (response) => {
        // 404: return response so callback can show "This Data is used" and loading can stop
        if (response.status === 404) {
          let body = null;
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              body = await response.json();
            } catch (e) {}
          }
          return { status: 404, data: body, message: (body && body.message) || 'Not Found' };
        }
        return handleResponse(response);
      })
      .catch((error) => {
        console.error('API DELETE Error:', error);
        if (error.message === 'Unauthorized access') {
            // Already handled by handleUnauthorized
            return;
        }
        throw error;
      });
  }
  
  const apiVERIFY = (url, data) => {
    const requestOptions = {
        method: 'VERIFY',
        headers: { 'Content-Type': 'application/json' }
    };

    return fetch(url, requestOptions)
    .then((response) => handleResponse(response))
    .catch((error) => {
      console.error('API VERIFY Error:', error);
      if (error.message === 'Unauthorized access') {
          // Already handled by handleUnauthorized
          return;
      }
      throw error;
    });
}
  export const API_HELPER = {
    apiGET,
    apiPOST,
    apiPUT,
    apiDELETE,
    apiPOST_Multipart,
    apiPUT_Multipart,
    apiVERIFY,

  };
  