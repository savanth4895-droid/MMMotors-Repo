/**
 * API Utilities for MMMotors
 * 
 * Provides backward-compatible helpers for the paginated API responses.
 * The new API returns { data: [...], meta: { total, page, limit, totalPages } }
 * but some old code expects a flat array.
 */
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

/**
 * Extract data array from a paginated or legacy response.
 * Works for both new { data: [], meta: {} } and old flat array responses.
 */
export function extractData(response) {
  if (!response?.data) return [];
  
  // New paginated format: { data: [...], meta: {...} }
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  
  // Legacy format: direct array
  if (Array.isArray(response.data)) {
    return response.data;
  }
  
  return [];
}

/**
 * Extract pagination metadata from a paginated response.
 */
export function extractMeta(response) {
  if (response?.data?.meta) {
    return response.data.meta;
  }
  
  // Fallback for legacy responses
  const data = extractData(response);
  return {
    total: data.length,
    page: 1,
    limit: data.length,
    totalPages: 1,
  };
}

/**
 * Fetch all items from a paginated endpoint by making a single request with a high limit.
 * Use sparingly — only for endpoints where you need ALL data (e.g., brand overview charts).
 */
export async function fetchAll(endpoint, params = {}) {
  const response = await axios.get(`${API}${endpoint}`, {
    params: { limit: 10000, ...params }
  });
  return extractData(response);
}

/**
 * Fetch a paginated result set.
 * Returns { data: [...], meta: { total, page, limit, totalPages } }
 */
export async function fetchPaginated(endpoint, params = {}) {
  const response = await axios.get(`${API}${endpoint}`, { params });
  return {
    data: extractData(response),
    meta: extractMeta(response),
  };
}

/**
 * Retry a failed API call with exponential backoff.
 * Useful for unreliable network conditions.
 */
export async function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // Don't retry 4xx errors (client errors)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      // Wait with exponential backoff before retrying
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, baseDelay * Math.pow(2, attempt))
        );
      }
    }
  }
  throw lastError;
}
