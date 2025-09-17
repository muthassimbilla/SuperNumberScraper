const SUPABASE_URL = "https://kteiqnewqmmtyuijsrgf.supabase.co"
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0ZWlxbmV3cW1tdHl1aWpzcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzU0NTQsImV4cCI6MjA2NzM1MTQ1NH0.-QgfCruUe6E7i7wvOJnCdV432yc2Xiwin7Dg11Dff98"

// Function to get location from area code
function getLocationFromAreaCode(phoneNumber) {
  // Extract area code from phone number
  const digits = phoneNumber.replace(/\D/g, "")

  // Handle different phone number formats
  let areaCode = ""

  if (digits.length === 11 && digits.startsWith("1")) {
    // Format: 1-XXX-XXX-XXXX
    areaCode = digits.substring(1, 4)
  } else if (digits.length === 10) {
    // Format: XXX-XXX-XXXX
    areaCode = digits.substring(0, 3)
  } else {
    return null // Invalid format
  }

  return window.AREA_CODES[areaCode] || "Unknown Location"
}

// Function to extract area code from phone number
function extractAreaCode(phoneNumber) {
  const digits = phoneNumber.replace(/\D/g, "")

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.substring(1, 4)
  } else if (digits.length === 10) {
    return digits.substring(0, 3)
  }

  return null
}

class SupabaseAPI {
  static async saveNumber(normalizedNumber, originalFormat = null) {
    try {
      // Get location and area code
      const location = getLocationFromAreaCode(normalizedNumber)
      const areaCode = extractAreaCode(normalizedNumber)

      const response = await fetch(`${SUPABASE_URL}/rest/v1/copied_numbers`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          number: normalizedNumber,
          original_format: originalFormat || normalizedNumber,
          location: location,
          area_code: areaCode,
        }),
      })

      // If response is 409 (conflict), it means the number already exists
      if (response.status === 409) {
        console.log("Number already exists in database")
        return true // Still consider it a success since the number is already saved
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error("Error saving number:", error)
      return false
    }
  }

  static async getNumbers() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/copied_numbers?select=number`, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.map((item) => item.number)
    } catch (error) {
      console.error("Error fetching numbers:", error)
      throw error
    }
  }

  // Additional method to get numbers with their original formats and locations
  static async getNumbersWithFormats() {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/copied_numbers?select=number,original_format,location,area_code,created_at&order=created_at.desc`,
        {
          method: "GET",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching numbers with formats:", error)
      throw error
    }
  }

  // Method to check if a normalized number already exists
  static async numberExists(normalizedNumber) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/copied_numbers?select=number&number=eq.${normalizedNumber}`,
        {
          method: "GET",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.length > 0
    } catch (error) {
      console.error("Error checking number existence:", error)
      return false
    }
  }

  // Method to get numbers by location
  static async getNumbersByLocation(location) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/copied_numbers?select=*&location=ilike.%${location}%&order=created_at.desc`,
        {
          method: "GET",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching numbers by location:", error)
      throw error
    }
  }

  // Method to get numbers by area code
  static async getNumbersByAreaCode(areaCode) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/copied_numbers?select=*&area_code=eq.${areaCode}&order=created_at.desc`,
        {
          method: "GET",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching numbers by area code:", error)
      throw error
    }
  }
}

// Export to window object for access from popup
window.supabase = SupabaseAPI
window.getLocationFromAreaCode = getLocationFromAreaCode
window.extractAreaCode = extractAreaCode
