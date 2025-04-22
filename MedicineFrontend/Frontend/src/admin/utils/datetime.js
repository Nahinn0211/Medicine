
export const formatDateToLocalString = (value, hour = '') => {
    if (!value) return value;
    if (typeof value === 'string') value = new Date(value);
    if (value.constructor === Date) {
      return value.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...(hour == 'hour' && {
          minute: '2-digit',
          hour: '2-digit',
        }),
        ...(hour == 'second' && {
          minute: '2-digit',
          hour: '2-digit',
          second: '2-digit',
        }),
      });
    }
  
    return value;
  };