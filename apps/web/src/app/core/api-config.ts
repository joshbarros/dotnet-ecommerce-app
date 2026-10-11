export const API_MODE_KEY = 'devstore.api';
export const useApi =
  typeof localStorage !== 'undefined' && localStorage.getItem(API_MODE_KEY) === 'true';
