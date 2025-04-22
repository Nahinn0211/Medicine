import { getAccessToken, getBearerToken, getDeviceId } from '@admin/services/localStorage';
import { axios } from '.';

import { errorCodes } from '@admin/constants';
import { refreshToken } from '@admin/services/authentication';

axios.interceptors.request.use(
  async (config) => {
    const token = getAccessToken(); // Function to get the current token
    if (token) {
      config.headers['Device-Id'] = getDeviceId();
      config.headers['Authorization'] = getBearerToken();
    }
    return config;
  },
  async (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  async (response) => {
    return response;
  },
  async (error) => {
    const res = error.response.data;
    if (res?.status == errorCodes.accessTokenExpired && !error.config._isRetry) {
      return refreshToken().then((response) => {
        if (response) {
          error.config._isRetry = true;
          const originalRequestConfig = error.config;
          originalRequestConfig.headers.Authorization = getBearerToken();
          return axios.request(originalRequestConfig);
        }
      });
    }

    return Promise.reject(error);
  }
);
