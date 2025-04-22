import axiosRequest from 'axios';

export const axios = axiosRequest.create({
  timeout: 3 * 60 * 1000,
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*',
    'Content-Type': 'application/json'  
  }
});

// Thêm interceptor để tự động thêm token vào mỗi request
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm interceptor để xử lý response
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Kiểm tra nếu lỗi 401 (Unauthorized) thì đăng xuất
    if (error.response && error.response.status === 401) {
      // Xóa token
      localStorage.removeItem('token');
      
      // Có thể thêm logic chuyển hướng đến trang đăng nhập ở đây
      // window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

const isObject = (a) => {
  if ((!!a) && (a.constructor === Object)) {
    return true;
  }
  return false;
};

const _st = (z, g) => {
  return "" + (g != "" ? "[" : "") + z + (g != "" ? "]" : "");
};

const buildURLQueryFromObject = (params, skipObjects, prefix) => {
  if (skipObjects === void 0) {
    skipObjects = false;
  }
  if (prefix === void 0) {
    prefix = "";
  }
  var result = "";
  if (typeof (params) != "object") {
    return prefix + "=" + encodeURIComponent(params) + "&";
  }
  for (var param in params) {
    var c = "" + prefix + _st(param, prefix);
    if (isObject(params[param]) && !skipObjects) {
      result += buildURLQueryFromObject(params[param], false, "" + c);
    } else if (Array.isArray(params[param]) && !skipObjects) {
      params[param].forEach(function (item, ind) {
        result += buildURLQueryFromObject(item, false, c + "[" + ind + "]");
      });
    } else {
      result += c + "=" + encodeURIComponent(params[param]) + "&";
    }
  }
  return result;
};

const handleResponse = (resolve, reject, response) => {
  resolve(response);
};

const handleError = (reject, error) => {
  reject(error);
};

// Sửa lại hàm sendGet để có thể truyền config tùy chỉnh
export const sendGet = (url, params = null, config = {}) => {
  return new Promise((resolve, reject) => {
    const queryParamString = params ? `?${buildURLQueryFromObject(params)}` : '';
    axios.get(`${url}${queryParamString}`, config)
      .then((response) => {
        handleResponse(resolve, reject, response);
      })
      .catch((error) => {
        handleError(reject, error);
      });
  });
};

// Sửa lại hàm sendPost để có thể truyền config tùy chỉnh
export const sendPost = (url, payload, config = {}) => {
  return new Promise((resolve, reject) => {
    axios.post(url, payload, config)
      .then((response) => {
        handleResponse(resolve, reject, response);
      })
      .catch((error) => {
        handleError(reject, error);
      });
  });
};

// Sửa lại hàm sendPut
export const sendPut = (url, payload, config = {}) => {
  return new Promise((resolve, reject) => {
    axios.put(url, payload, config)
      .then((response) => {
        handleResponse(resolve, reject, response);
      })
      .catch((error) => {
        handleError(reject, error);
      });
  });
};

// Sửa lại hàm sendPatch
export const sendPatch = (url, payload, config = {}) => {
  return new Promise((resolve, reject) => {
    axios.patch(url, payload, config)
      .then((response) => {
        handleResponse(resolve, reject, response);
      })
      .catch((error) => {
        handleError(reject, error);
      });
  });
};

// Sửa lại hàm sendDelete
export const sendDelete = (url, payload, config = {}) => {
  return new Promise((resolve, reject) => {
    // Nếu payload là mảng, xử lý nó khác (để hỗ trợ trường hợp xóa nhiều mục)
    const options = { ...config };
    
    if (payload) {
      if (Array.isArray(payload)) {
        options.data = payload;
      } else {
        // Trường hợp query params
        const queryParams = new URLSearchParams();
        Object.entries(payload).forEach(([key, value]) => {
          queryParams.append(key, value);
        });
        url = `${url}?${queryParams.toString()}`;
      }
    }
    
    axios.delete(url, options)
      .then((response) => {
        handleResponse(resolve, reject, response);
      })
      .catch((error) => {
        handleError(reject, error);
      });
  });
};