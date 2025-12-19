/**
 * Utility functions for date formatting
 */

/**
 * Formats a birthday string to ISO 8601 format (e.g., "2025-07-22T05:14:44.363Z")
 * Handles various input formats and ensures consistent output
 */
export const formatBirthdayToISO = (birthday: string): string => {
  if (!birthday) {
    return new Date().toISOString() // Default to current date
  }
  
  // If datetime-local format (YYYY-MM-DDTHH:MM), convert to full ISO
  if (birthday.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
    const date = new Date(birthday)
    return date.toISOString()
  }
  
  // If date only format (YYYY-MM-DD), assume midnight UTC
  if (birthday.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const date = new Date(birthday + "T00:00:00.000Z")
    return date.toISOString()
  }
  
  // If already in ISO format, normalize to ensure proper format
  if (birthday.includes('Z') || birthday.includes('+')) {
    return new Date(birthday).toISOString()
  }
  
  // Fallback: treat as date and convert
  const date = new Date(birthday)
  return date.toISOString()
}

/**
 * Formats a date string for display in forms (datetime-local format)
 * Converts from ISO format to YYYY-MM-DDTHH:MM for HTML datetime-local inputs
 */
export const formatISOToDateTimeLocal = (isoString: string): string => {
  if (!isoString) return ""
  
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Validates if a date string is in valid ISO 8601 format
 */
export const isValidISODate = (dateString: string): boolean => {
  if (!dateString) return false
  
  try {
    const date = new Date(dateString)
    return date.toISOString() === dateString
  } catch {
    return false
  }
}

/**
 * Console logging helper for date debugging (disabled)
 */
export const logDateFormatting = (originalDate: string, formattedDate: string, context: string) => {
  // Logging disabled
} 