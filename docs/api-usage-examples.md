# API Usage Examples

This document provides practical examples of how to interact with the STEM Toys
User Management API using various programming languages and tools. All examples
include authentication, error handling, and best practices.

## Authentication

### Getting Started

All API requests require authentication except for registration and password
reset initiation. The API supports:

- **Bearer Token Authentication**: JWT tokens for authenticated requests
- **API Key Authentication**: For administrative operations

### Obtaining Access Tokens

```bash
# Login to get access token
curl -X POST https://stemtoys.ro/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

## JavaScript/Node.js Examples

### Registration

```javascript
// Using fetch API
async function registerUser(userData) {
  try {
    const response = await fetch("https://stemtoys.ro/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Ion Popescu",
        email: "ion.popescu@email.ro",
        password: "SecurePass123",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const result = await response.json();
    console.log("Registration successful:", result);
    return result;
  } catch (error) {
    console.error("Registration failed:", error.message);
    throw error;
  }
}

// Using axios
const axios = require("axios");

async function registerWithAxios(userData) {
  try {
    const response = await axios.post("https://stemtoys.ro/api/auth/register", {
      name: "Maria Ionescu",
      email: "maria.ionescu@email.ro",
      password: "SecurePass123!",
    });

    console.log("User registered:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Registration error:",
      error.response?.data?.error || error.message
    );
    throw error;
  }
}
```

### Login and Profile Management

```javascript
class UserAPI {
  constructor(baseURL = "https://stemtoys.ro/api") {
    this.baseURL = baseURL;
    this.token = null;
  }

  async login(email, password) {
    try {
      const response = await fetch(
        `${this.baseURL}/auth/callback/credentials`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
      }

      const data = await response.json();
      this.token = data.token; // Assuming token is returned
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async getProfile() {
    try {
      const response = await fetch(`${this.baseURL}/account/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required");
        }
        throw new Error(`Profile fetch failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Profile fetch error:", error);
      throw error;
    }
  }

  async updateProfile(updates) {
    try {
      const response = await fetch(`${this.baseURL}/account/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      return await response.json();
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  }

  async manageAddresses() {
    // Get all addresses
    const addresses = await this.request("/account/addresses");

    // Add new address
    const newAddress = await this.request("/account/addresses", "POST", {
      name: "Home",
      fullName: "Ion Popescu",
      addressLine1: "Strada Victoriei 10",
      city: "București",
      state: "București",
      postalCode: "010101",
      country: "RO",
      phone: "+40712345678",
      judet: "București",
      localitate: "Sector 1",
      codPostal: "010101",
    });

    // Update address
    await this.request(`/account/addresses/${newAddress.address.id}`, "PUT", {
      ...newAddress.address,
      addressLine2: "Apartament 5",
    });

    return addresses;
  }

  async request(endpoint, method = "GET", body = null) {
    const config = {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error);
    }

    return await response.json();
  }
}

// Usage example
async function main() {
  const api = new UserAPI();

  try {
    // Register new user
    await registerUser({
      name: "Ion Popescu",
      email: "ion.popescu@email.ro",
      password: "SecurePass123",
    });

    // Login
    await api.login("ion.popescu@email.ro", "SecurePass123");

    // Get profile
    const profile = await api.getProfile();
    console.log("User profile:", profile);

    // Update profile
    await api.updateProfile({
      name: "Ion Popescu Updated",
      email: "ion.popescu.updated@email.ro",
    });

    // Manage addresses
    await api.manageAddresses();
  } catch (error) {
    console.error("API usage error:", error.message);
  }
}
```

### GDPR Compliance Operations

```javascript
class GDPRAPI {
  constructor(token) {
    this.token = token;
    this.baseURL = "https://stemtoys.ro/api";
  }

  async updateConsent(consentType, consentGiven, validUntil = null) {
    try {
      const response = await fetch(`${this.baseURL}/consent`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          consentType, // 'marketing', 'essential', 'analytics', 'personalization'
          consentGiven,
          validUntil,
        }),
      });

      if (!response.ok) {
        throw new Error(`Consent update failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Consent update error:", error);
      throw error;
    }
  }

  async requestDataExport() {
    try {
      const response = await fetch(`${this.baseURL}/gdpr/data-export`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Data export request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Data export error:", error);
      throw error;
    }
  }

  async requestDataDeletion() {
    try {
      const response = await fetch(`${this.baseURL}/gdpr/data-deletion`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmation: "DELETE_MY_DATA",
        }),
      });

      if (!response.ok) {
        throw new Error(`Data deletion request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Data deletion error:", error);
      throw error;
    }
  }
}

// GDPR compliance example
async function manageGDPRCompliance(userToken) {
  const gdpr = new GDPRAPI(userToken);

  try {
    // Update marketing consent
    await gdpr.updateConsent("marketing", true);

    // Withdraw analytics consent
    await gdpr.updateConsent("analytics", false);

    // Request data export
    const exportRequest = await gdpr.requestDataExport();
    console.log("Export request submitted:", exportRequest.requestId);

    // Request account deletion (use with caution!)
    // const deletionRequest = await gdpr.requestDataDeletion();
    // console.log('Deletion request submitted:', deletionRequest.requestId);
  } catch (error) {
    console.error("GDPR operation error:", error.message);
  }
}
```

## Python Examples

### Using requests library

```python
import requests
from typing import Dict, Any, Optional
import json

class StemToysAPI:
    def __init__(self, base_url: str = "https://stemtoys.ro/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.token: Optional[str] = None

    def _get_headers(self) -> Dict[str, str]:
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        return headers

    def register(self, name: str, email: str, password: str) -> Dict[str, Any]:
        """Register a new user account"""
        data = {
            "name": name,
            "email": email,
            "password": password
        }

        response = self.session.post(
            f"{self.base_url}/auth/register",
            json=data
        )

        if not response.ok:
            error_data = response.json()
            raise Exception(f"Registration failed: {error_data.get('error', 'Unknown error')}")

        return response.json()

    def login(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user and store token"""
        data = {"email": email, "password": password}

        response = self.session.post(
            f"{self.base_url}/auth/callback/credentials",
            json=data
        )

        if not response.ok:
            raise Exception(f"Login failed: {response.status_code}")

        result = response.json()
        self.token = result.get('token')
        return result

    def get_profile(self) -> Dict[str, Any]:
        """Get current user profile"""
        response = self.session.get(
            f"{self.base_url}/account/profile",
            headers=self._get_headers()
        )

        if response.status_code == 401:
            raise Exception("Authentication required")
        elif not response.ok:
            raise Exception(f"Profile fetch failed: {response.status_code}")

        return response.json()

    def update_profile(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile"""
        response = self.session.put(
            f"{self.base_url}/account/profile",
            json=updates,
            headers=self._get_headers()
        )

        if not response.ok:
            error_data = response.json()
            raise Exception(f"Profile update failed: {error_data.get('error', 'Unknown error')}")

        return response.json()

    def manage_addresses(self) -> Dict[str, Any]:
        """Comprehensive address management example"""
        # Get all addresses
        response = self.session.get(
            f"{self.base_url}/account/addresses",
            headers=self._get_headers()
        )
        addresses = response.json()

        # Add new Romanian address
        new_address = {
            "name": "Acasă",
            "fullName": "Ion Popescu",
            "addressLine1": "Strada Victoriei 10",
            "city": "București",
            "state": "București",
            "postalCode": "010101",
            "country": "RO",
            "phone": "+40712345678",
            "judet": "București",
            "localitate": "Sector 1",
            "codPostal": "010101"
        }

        response = self.session.post(
            f"{self.base_url}/account/addresses",
            json=new_address,
            headers=self._get_headers()
        )

        if response.ok:
            created_address = response.json()
            address_id = created_address['address']['id']

            # Update the address
            update_data = created_address['address']
            update_data['addressLine2'] = 'Apartament 5'

            self.session.put(
                f"{self.base_url}/account/addresses/{address_id}",
                json=update_data,
                headers=self._get_headers()
            )

        return addresses

    def manage_wishlist(self, product_id: str, action: str = "add") -> Dict[str, Any]:
        """Manage user wishlist"""
        if action == "add":
            response = self.session.post(
                f"{self.base_url}/account/wishlist",
                json={"productId": product_id},
                headers=self._get_headers()
            )
        else:
            # Get current wishlist
            response = self.session.get(
                f"{self.base_url}/account/wishlist",
                headers=self._get_headers()
            )

        if not response.ok:
            raise Exception(f"Wishlist operation failed: {response.status_code}")

        return response.json()

    def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get user dashboard statistics"""
        response = self.session.get(
            f"{self.base_url}/account/dashboard/stats",
            headers=self._get_headers()
        )

        if not response.ok:
            raise Exception(f"Dashboard stats fetch failed: {response.status_code}")

        return response.json()

# Usage example
def main():
    api = StemToysAPI()

    try:
        # Register new user
        print("Registering user...")
        register_result = api.register(
            "Maria Ionescu",
            "maria.ionescu@email.ro",
            "SecurePass123!"
        )
        print("Registration successful:", register_result)

        # Login
        print("Logging in...")
        login_result = api.login("maria.ionescu@email.ro", "SecurePass123!")
        print("Login successful")

        # Get profile
        print("Fetching profile...")
        profile = api.get_profile()
        print("Profile:", json.dumps(profile, indent=2))

        # Update profile
        print("Updating profile...")
        updated_profile = api.update_profile({
            "name": "Maria Popescu",
            "email": "maria.popescu@email.ro"
        })
        print("Profile updated:", updated_profile['message'])

        # Manage addresses
        print("Managing addresses...")
        addresses = api.manage_addresses()
        print(f"Managing {len(addresses.get('addresses', []))} addresses")

        # Get dashboard stats
        print("Fetching dashboard stats...")
        stats = api.get_dashboard_stats()
        print("Dashboard stats:", json.dumps(stats, indent=2))

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
```

### Romanian Compliance Features

```python
class RomanianComplianceAPI:
    def __init__(self, token: str):
        self.token = token
        self.base_url = "https://stemtoys.ro/api"
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        })

    def validate_cnp(self, cnp: str) -> bool:
        """Validate Romanian CNP format"""
        import re
        cnp_pattern = r'^[1-9]\d{12}$'
        return bool(re.match(cnp_pattern, cnp))

    def validate_cui(self, cui: str) -> bool:
        """Validate Romanian CUI format"""
        import re
        cui_pattern = r'^RO?\d{1,10}$'
        return bool(re.match(cui_pattern, cui))

    def add_romanian_address(self, address_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add Romanian address with validation"""
        # Validate Romanian postal code
        if not address_data.get('codPostal') or len(address_data['codPostal']) != 6:
            raise ValueError("Romanian postal code must be 6 digits")

        # Romanian counties validation
        romanian_counties = [
            'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud',
            'Botoșani', 'Brașov', 'Brăila', 'București', 'Buzău', 'Caraș-Severin',
            'Călărași', 'Cluj', 'Constanța', 'Covasna', 'Dâmbovița', 'Dolj',
            'Galați', 'Giurgiu', 'Gorj', 'Harghita', 'Hunedoara', 'Ialomița',
            'Iași', 'Ilfov', 'Maramureș', 'Mehedinți', 'Mureș', 'Neamț',
            'Olt', 'Prahova', 'Satu Mare', 'Sălaj', 'Sibiu', 'Suceava',
            'Teleorman', 'Timiș', 'Tulcea', 'Vaslui', 'Vâlcea', 'Vrancea'
        ]

        if address_data.get('judet') not in romanian_counties:
            raise ValueError("Invalid Romanian county")

        response = self.session.post(
            f"{self.base_url}/account/addresses",
            json=address_data
        )

        if not response.ok:
            raise Exception(f"Address creation failed: {response.status_code}")

        return response.json()

    def update_romanian_profile(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update profile with Romanian-specific fields"""
        # Validate CNP if provided
        if profile_data.get('cnp') and not self.validate_cnp(profile_data['cnp']):
            raise ValueError("Invalid CNP format")

        # Validate CUI if provided
        if profile_data.get('cui') and not self.validate_cui(profile_data['cui']):
            raise ValueError("Invalid CUI format")

        # Romanian resident validation
        if profile_data.get('isRomanianResident') and not isinstance(profile_data['isRomanianResident'], bool):
            raise ValueError("isRomanianResident must be boolean")

        response = self.session.put(
            f"{self.base_url}/account/profile",
            json=profile_data
        )

        if not response.ok:
            error_data = response.json()
            raise Exception(f"Profile update failed: {error_data.get('error', 'Unknown error')}")

        return response.json()

# Romanian compliance example
def romanian_compliance_example(token: str):
    compliance_api = RomanianComplianceAPI(token)

    try:
        # Add Romanian address
        romanian_address = {
            "name": "Domiciliu",
            "fullName": "Ion Popescu",
            "addressLine1": "Strada Victoriei 10",
            "city": "București",
            "state": "București",
            "postalCode": "010101",
            "country": "RO",
            "phone": "+40712345678",
            "judet": "București",
            "localitate": "Sector 1",
            "codPostal": "010101"
        }

        address_result = compliance_api.add_romanian_address(romanian_address)
        print("Romanian address added:", address_result)

        # Update profile with Romanian fields
        profile_updates = {
            "cnp": "1234567890123",  # Valid CNP format
            "cui": "RO1234567890",  # Valid CUI format
            "isRomanianResident": True,
            "judet": "București",
            "localitate": "București"
        }

        profile_result = compliance_api.update_romanian_profile(profile_updates)
        print("Romanian profile updated:", profile_result)

    except Exception as e:
        print(f"Romanian compliance error: {e}")
```

## PHP Examples

### Using cURL

```php
<?php

class StemToysAPI {
    private string $baseUrl;
    private ?string $token = null;
    private int $timeout = 30;

    public function __construct(string $baseUrl = 'https://stemtoys.ro/api') {
        $this->baseUrl = $baseUrl;
    }

    private function getHeaders(): array {
        $headers = [
            'Content-Type: application/json',
            'Accept: application/json'
        ];

        if ($this->token) {
            $headers[] = 'Authorization: Bearer ' . $this->token;
        }

        return $headers;
    }

    private function makeRequest(string $endpoint, string $method = 'GET', ?array $data = null): array {
        $url = $this->baseUrl . $endpoint;
        $ch = curl_init();

        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_HTTPHEADER => $this->getHeaders(),
            CURLOPT_CUSTOMREQUEST => $method,
        ]);

        if ($data && in_array($method, ['POST', 'PUT', 'PATCH'])) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);

        curl_close($ch);

        if ($error) {
            throw new Exception("cURL Error: $error");
        }

        $result = json_decode($response, true);

        if ($httpCode >= 400) {
            $errorMessage = $result['error'] ?? 'Unknown API error';
            throw new Exception("$errorMessage (HTTP $httpCode)");
        }

        return $result ?? [];
    }

    public function register(string $name, string $email, string $password): array {
        return $this->makeRequest('/auth/register', 'POST', [
            'name' => $name,
            'email' => $email,
            'password' => $password
        ]);
    }

    public function login(string $email, string $password): array {
        $result = $this->makeRequest('/auth/callback/credentials', 'POST', [
            'email' => $email,
            'password' => $password
        ]);

        $this->token = $result['token'] ?? null;
        return $result;
    }

    public function getProfile(): array {
        return $this->makeRequest('/account/profile');
    }

    public function updateProfile(array $updates): array {
        return $this->makeRequest('/account/profile', 'PUT', $updates);
    }

    public function getAddresses(): array {
        return $this->makeRequest('/account/addresses');
    }

    public function createAddress(array $addressData): array {
        return $this->makeRequest('/account/addresses', 'POST', $addressData);
    }

    public function updateAddress(string $addressId, array $updates): array {
        return $this->makeRequest("/account/addresses/$addressId", 'PUT', $updates);
    }

    public function deleteAddress(string $addressId): array {
        return $this->makeRequest("/account/addresses/$addressId", 'DELETE');
    }

    public function getOrders(int $page = 1, int $limit = 20, ?string $status = null): array {
        $params = http_build_query(array_filter([
            'page' => $page,
            'limit' => $limit,
            'status' => $status
        ]));

        return $this->makeRequest('/account/orders?' . $params);
    }

    public function getWishlist(): array {
        return $this->makeRequest('/account/wishlist');
    }

    public function addToWishlist(string $productId): array {
        return $this->makeRequest('/account/wishlist', 'POST', [
            'productId' => $productId
        ]);
    }

    public function getDashboardStats(): array {
        return $this->makeRequest('/account/dashboard/stats');
    }

    public function updateConsent(string $consentType, bool $consentGiven, ?string $validUntil = null): array {
        $data = [
            'consentType' => $consentType,
            'consentGiven' => $consentGiven
        ];

        if ($validUntil) {
            $data['validUntil'] = $validUntil;
        }

        return $this->makeRequest('/consent', 'POST', $data);
    }

    public function requestDataExport(): array {
        return $this->makeRequest('/gdpr/data-export', 'POST');
    }
}

// Usage example
function main() {
    $api = new StemToysAPI();

    try {
        // Register user
        echo "Registering user...\n";
        $registerResult = $api->register(
            'Ana Popescu',
            'ana.popescu@email.ro',
            'SecurePass123!'
        );
        echo "Registration successful: " . json_encode($registerResult) . "\n";

        // Login
        echo "Logging in...\n";
        $loginResult = $api->login('ana.popescu@email.ro', 'SecurePass123!');
        echo "Login successful\n";

        // Get profile
        echo "Getting profile...\n";
        $profile = $api->getProfile();
        echo "Profile: " . json_encode($profile, JSON_PRETTY_PRINT) . "\n";

        // Update profile
        echo "Updating profile...\n";
        $updateResult = $api->updateProfile([
            'name' => 'Ana Maria Popescu'
        ]);
        echo "Profile updated: " . $updateResult['message'] . "\n";

        // Manage addresses
        echo "Creating Romanian address...\n";
        $addressResult = $api->createAddress([
            'name' => 'Acasă',
            'fullName' => 'Ana Maria Popescu',
            'addressLine1' => 'Calea Victoriei 15',
            'city' => 'București',
            'state' => 'București',
            'postalCode' => '010096',
            'country' => 'RO',
            'phone' => '+40723456789',
            'judet' => 'București',
            'localitate' => 'Sector 1',
            'codPostal' => '010096'
        ]);
        echo "Address created: " . json_encode($addressResult) . "\n";

        // Get dashboard stats
        echo "Getting dashboard stats...\n";
        $stats = $api->getDashboardStats();
        echo "Dashboard stats: " . json_encode($stats, JSON_PRETTY_PRINT) . "\n";

        // Update consent
        echo "Updating marketing consent...\n";
        $consentResult = $api->updateConsent('marketing', true);
        echo "Consent updated: " . json_encode($consentResult) . "\n";

    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

main();
?>
```

## cURL Command Line Examples

```bash
#!/bin/bash

# Configuration
BASE_URL="https://stemtoys.ro/api"
EMAIL="test.user@email.ro"
PASSWORD="SecurePass123"

echo "=== STEM Toys API Examples ==="
echo

# 1. Register a new user
echo "1. Registering new user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User\",
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "Registration response:"
echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"
echo

# 2. Login to get authentication token
echo "2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/callback/credentials" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

# Extract token from response (adjust based on actual response structure)
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty' 2>/dev/null)
if [ -z "$TOKEN" ]; then
    echo "Warning: Could not extract token from login response"
    echo "Login response: $LOGIN_RESPONSE"
    exit 1
fi

echo "Login successful, token obtained"
echo

# 3. Get user profile
echo "3. Getting user profile..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/account/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Profile response:"
echo "$PROFILE_RESPONSE" | jq . 2>/dev/null || echo "$PROFILE_RESPONSE"
echo

# 4. Update user profile
echo "4. Updating user profile..."
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/account/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User Updated\",
    \"email\": \"$EMAIL\"
  }")

echo "Update response:"
echo "$UPDATE_RESPONSE" | jq . 2>/dev/null || echo "$UPDATE_RESPONSE"
echo

# 5. Create a new address
echo "5. Creating new address..."
ADDRESS_RESPONSE=$(curl -s -X POST "$BASE_URL/account/addresses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Home\",
    \"fullName\": \"Test User Updated\",
    \"addressLine1\": \"Strada Victoriei 10\",
    \"city\": \"București\",
    \"state\": \"București\",
    \"postalCode\": \"010101\",
    \"country\": \"RO\",
    \"phone\": \"+40712345678\",
    \"judet\": \"București\",
    \"localitate\": \"Sector 1\",
    \"codPostal\": \"010101\"
  }")

echo "Address creation response:"
echo "$ADDRESS_RESPONSE" | jq . 2>/dev/null || echo "$ADDRESS_RESPONSE"

# Extract address ID for next operations
ADDRESS_ID=$(echo "$ADDRESS_RESPONSE" | jq -r '.address.id // empty' 2>/dev/null)
echo

# 6. Get all addresses
echo "6. Getting all addresses..."
ADDRESSES_RESPONSE=$(curl -s -X GET "$BASE_URL/account/addresses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Addresses response:"
echo "$ADDRESSES_RESPONSE" | jq . 2>/dev/null || echo "$ADDRESSES_RESPONSE"
echo

# 7. Update address (if we have an address ID)
if [ -n "$ADDRESS_ID" ]; then
    echo "7. Updating address..."
    UPDATE_ADDRESS_RESPONSE=$(curl -s -X PUT "$BASE_URL/account/addresses/$ADDRESS_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"Home\",
        \"fullName\": \"Test User Updated\",
        \"addressLine1\": \"Strada Victoriei 10\",
        \"addressLine2\": \"Apartament 5\",
        \"city\": \"București\",
        \"state\": \"București\",
        \"postalCode\": \"010101\",
        \"country\": \"RO\",
        \"phone\": \"+40712345678\",
        \"judet\": \"București\",
        \"localitate\": \"Sector 1\",
        \"codPostal\": \"010101\"
      }")

    echo "Address update response:"
    echo "$UPDATE_ADDRESS_RESPONSE" | jq . 2>/dev/null || echo "$UPDATE_ADDRESS_RESPONSE"
    echo
fi

# 8. Get user orders
echo "8. Getting user orders..."
ORDERS_RESPONSE=$(curl -s -X GET "$BASE_URL/account/orders?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Orders response:"
echo "$ORDERS_RESPONSE" | jq . 2>/dev/null || echo "$ORDERS_RESPONSE"
echo

# 9. Get wishlist
echo "9. Getting wishlist..."
WISHLIST_RESPONSE=$(curl -s -X GET "$BASE_URL/account/wishlist" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Wishlist response:"
echo "$WISHLIST_RESPONSE" | jq . 2>/dev/null || echo "$WISHLIST_RESPONSE"
echo

# 10. Get dashboard statistics
echo "10. Getting dashboard statistics..."
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/account/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Dashboard stats response:"
echo "$STATS_RESPONSE" | jq . 2>/dev/null || echo "$STATS_RESPONSE"
echo

# 11. Update GDPR consent
echo "11. Updating GDPR consent..."
CONSENT_RESPONSE=$(curl -s -X POST "$BASE_URL/consent" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"consentType\": \"marketing\",
    \"consentGiven\": true
  }")

echo "Consent update response:"
echo "$CONSENT_RESPONSE" | jq . 2>/dev/null || echo "$CONSENT_RESPONSE"
echo

# 12. Request data export
echo "12. Requesting data export..."
EXPORT_RESPONSE=$(curl -s -X POST "$BASE_URL/gdpr/data-export" \
  -H "Authorization: Bearer $TOKEN")

echo "Data export response:"
echo "$EXPORT_RESPONSE" | jq . 2>/dev/null || echo "$EXPORT_RESPONSE"
echo

echo "=== API Examples Complete ==="
```

## Go Examples

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"
)

type StemToysAPI struct {
    BaseURL string
    Client  *http.Client
    Token   string
}

type RegisterRequest struct {
    Name     string `json:"name"`
    Email    string `json:"email"`
    Password string `json:"password"`
}

type LoginRequest struct {
    Email    string `json:"email"`
    Password string `json:"password"`
}

type ProfileUpdateRequest struct {
    Name        string `json:"name,omitempty"`
    Email       string `json:"email,omitempty"`
    NewPassword string `json:"newPassword,omitempty"`
}

type Address struct {
    ID           string `json:"id,omitempty"`
    Name         string `json:"name"`
    FullName     string `json:"fullName"`
    AddressLine1  string `json:"addressLine1"`
    AddressLine2  string `json:"addressLine2,omitempty"`
    City         string `json:"city"`
    State        string `json:"state"`
    PostalCode   string `json:"postalCode"`
    Country      string `json:"country"`
    Phone        string `json:"phone"`
    IsDefault    bool   `json:"isDefault,omitempty"`
    Judet        string `json:"judet,omitempty"`
    Localitate   string `json:"localitate,omitempty"`
    CodPostal    string `json:"codPostal,omitempty"`
    Sector       string `json:"sector,omitempty"`
}

type ConsentRequest struct {
    ConsentType  string `json:"consentType"`
    ConsentGiven bool   `json:"consentGiven"`
    ValidUntil   string `json:"validUntil,omitempty"`
}

type APIResponse struct {
    Message string      `json:"message,omitempty"`
    User    interface{} `json:"user,omitempty"`
    Data    interface{} `json:"data,omitempty"`
}

type APIError struct {
    Error   string `json:"error"`
    Code    string `json:"code,omitempty"`
}

func NewStemToysAPI(baseURL string) *StemToysAPI {
    return &StemToysAPI{
        BaseURL: baseURL,
        Client: &http.Client{
            Timeout: 30 * time.Second,
        },
    }
}

func (api *StemToysAPI) makeRequest(method, endpoint string, body interface{}) (*http.Response, error) {
    var bodyReader io.Reader
    if body != nil {
        jsonBody, err := json.Marshal(body)
        if err != nil {
            return nil, fmt.Errorf("failed to marshal request body: %w", err)
        }
        bodyReader = bytes.NewReader(jsonBody)
    }

    req, err := http.NewRequest(method, api.BaseURL+endpoint, bodyReader)
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %w", err)
    }

    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Accept", "application/json")

    if api.Token != "" {
        req.Header.Set("Authorization", "Bearer "+api.Token)
    }

    return api.Client.Do(req)
}

func (api *StemToysAPI) Register(name, email, password string) (*APIResponse, error) {
    req := RegisterRequest{
        Name:     name,
        Email:    email,
        Password: password,
    }

    resp, err := api.makeRequest("POST", "/auth/register", req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusCreated {
        var apiErr APIError
        json.NewDecoder(resp.Body).Decode(&apiErr)
        return nil, fmt.Errorf("registration failed: %s", apiErr.Error)
    }

    var result APIResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("failed to decode response: %w", err)
    }

    return &result, nil
}

func (api *StemToysAPI) Login(email, password string) (*APIResponse, error) {
    req := LoginRequest{
        Email:    email,
        Password: password,
    }

    resp, err := api.makeRequest("POST", "/auth/callback/credentials", req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("login failed with status: %d", resp.StatusCode)
    }

    var result APIResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("failed to decode response: %w", err)
    }

    // Extract token from response (adjust based on actual API response)
    if result.Data != nil {
        if dataMap, ok := result.Data.(map[string]interface{}); ok {
            if token, ok := dataMap["token"].(string); ok {
                api.Token = token
            }
        }
    }

    return &result, nil
}

func (api *StemToysAPI) GetProfile() (*APIResponse, error) {
    resp, err := api.makeRequest("GET", "/account/profile", nil)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        if resp.StatusCode == http.StatusUnauthorized {
            return nil, fmt.Errorf("authentication required")
        }
        var apiErr APIError
        json.NewDecoder(resp.Body).Decode(&apiErr)
        return nil, fmt.Errorf("profile fetch failed: %s", apiErr.Error)
    }

    var result APIResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("failed to decode response: %w", err)
    }

    return &result, nil
}

func (api *StemToysAPI) UpdateProfile(updates ProfileUpdateRequest) (*APIResponse, error) {
    resp, err := api.makeRequest("PUT", "/account/profile", updates)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        var apiErr APIError
        json.NewDecoder(resp.Body).Decode(&apiErr)
        return nil, fmt.Errorf("profile update failed: %s", apiErr.Error)
    }

    var result APIResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("failed to decode response: %w", err)
    }

    return &result, nil
}

func (api *StemToysAPI) CreateAddress(address Address) (*APIResponse, error) {
    resp, err := api.makeRequest("POST", "/account/addresses", address)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusCreated {
        var apiErr APIError
        json.NewDecoder(resp.Body).Decode(&apiErr)
        return nil, fmt.Errorf("address creation failed: %s", apiErr.Error)
    }

    var result APIResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("failed to decode response: %w", err)
    }

    return &result, nil
}

func (api *StemToysAPI) UpdateConsent(consentType string, consentGiven bool) (*APIResponse, error) {
    req := ConsentRequest{
        ConsentType:  consentType,
        ConsentGiven: consentGiven,
    }

    resp, err := api.makeRequest("POST", "/consent", req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        var apiErr APIError
        json.NewDecoder(resp.Body).Decode(&apiErr)
        return nil, fmt.Errorf("consent update failed: %s", apiErr.Error)
    }

    var result APIResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("failed to decode response: %w", err)
    }

    return &result, nil
}

func main() {
    api := NewStemToysAPI("https://stemtoys.ro/api")

    // Register a new user
    fmt.Println("Registering user...")
    registerResult, err := api.Register("Gheorghe Popescu", "gheorghe.popescu@email.ro", "SecurePass123!")
    if err != nil {
        fmt.Printf("Registration error: %v\n", err)
        return
    }
    fmt.Printf("Registration successful: %+v\n\n", registerResult)

    // Login
    fmt.Println("Logging in...")
    loginResult, err := api.Login("gheorghe.popescu@email.ro", "SecurePass123!")
    if err != nil {
        fmt.Printf("Login error: %v\n", err)
        return
    }
    fmt.Printf("Login successful\n\n")

    // Get profile
    fmt.Println("Getting profile...")
    profile, err := api.GetProfile()
    if err != nil {
        fmt.Printf("Profile fetch error: %v\n", err)
        return
    }
    fmt.Printf("Profile: %+v\n\n", profile)

    // Update profile
    fmt.Println("Updating profile...")
    updateReq := ProfileUpdateRequest{
        Name: "Gheorghe Popescu Updated",
    }
    updateResult, err := api.UpdateProfile(updateReq)
    if err != nil {
        fmt.Printf("Profile update error: %v\n", err)
        return
    }
    fmt.Printf("Profile updated: %s\n\n", updateResult.Message)

    // Create Romanian address
    fmt.Println("Creating Romanian address...")
    address := Address{
        Name:        "Domiciliu",
        FullName:    "Gheorghe Popescu Updated",
        AddressLine1: "Strada Lipscani 5",
        City:        "București",
        State:       "București",
        PostalCode:  "030167",
        Country:     "RO",
        Phone:       "+40734567890",
        Judet:       "București",
        Localitate:  "Sector 3",
        CodPostal:   "030167",
    }

    addressResult, err := api.CreateAddress(address)
    if err != nil {
        fmt.Printf("Address creation error: %v\n", err)
        return
    }
    fmt.Printf("Address created: %+v\n\n", addressResult)

    // Update consent
    fmt.Println("Updating marketing consent...")
    consentResult, err := api.UpdateConsent("marketing", true)
    if err != nil {
        fmt.Printf("Consent update error: %v\n", err)
        return
    }
    fmt.Printf("Consent updated: %+v\n\n", consentResult)

    fmt.Println("All API operations completed successfully!")
}
```

## Error Handling Examples

```javascript
// Comprehensive error handling example
class APIErrorHandler {
  static handleAPIError(error, context = "") {
    console.error(`${context} Error:`, error);

    // Network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return {
        type: "NETWORK_ERROR",
        message:
          "Unable to connect to the server. Please check your internet connection.",
        userMessage: "Connection problem. Please try again later.",
      };
    }

    // HTTP errors
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          return {
            type: "VALIDATION_ERROR",
            message: data.error || "Invalid request data",
            userMessage: "Please check your input and try again.",
          };

        case 401:
          return {
            type: "AUTHENTICATION_ERROR",
            message: "Authentication required or token expired",
            userMessage: "Please log in again.",
            action: "redirect_to_login",
          };

        case 403:
          return {
            type: "PERMISSION_ERROR",
            message: "Insufficient permissions",
            userMessage: "You do not have permission to perform this action.",
          };

        case 404:
          return {
            type: "NOT_FOUND_ERROR",
            message: "Resource not found",
            userMessage: "The requested resource was not found.",
          };

        case 409:
          return {
            type: "CONFLICT_ERROR",
            message: data.error || "Resource conflict",
            userMessage: "This action conflicts with existing data.",
          };

        case 429:
          return {
            type: "RATE_LIMIT_ERROR",
            message: "Rate limit exceeded",
            userMessage: "Too many requests. Please wait and try again.",
            retryAfter: error.response.headers["retry-after"],
          };

        case 500:
          return {
            type: "SERVER_ERROR",
            message: "Internal server error",
            userMessage: "Server error. Please try again later.",
          };

        default:
          return {
            type: "UNKNOWN_ERROR",
            message: `HTTP ${status}: ${data.error || "Unknown error"}`,
            userMessage: "An unexpected error occurred. Please try again.",
          };
      }
    }

    // Default error
    return {
      type: "UNKNOWN_ERROR",
      message: error.message || "Unknown error occurred",
      userMessage: "An unexpected error occurred. Please try again.",
    };
  }

  static handleGDPRConsentError(error) {
    const baseError = this.handleAPIError(error, "GDPR Consent");

    // GDPR-specific error handling
    if (baseError.type === "VALIDATION_ERROR") {
      return {
        ...baseError,
        userMessage:
          "Invalid consent data. Please ensure all required consent fields are provided.",
        gdprContext:
          "Consent validation failed. All EU users must explicitly consent to data processing.",
      };
    }

    return {
      ...baseError,
      gdprContext:
        "GDPR compliance error. Your data privacy rights are protected.",
    };
  }
}

// Usage in API calls
async function safeAPICall(
  apiCall,
  errorHandler = APIErrorHandler.handleAPIError
) {
  try {
    const result = await apiCall();
    return { success: true, data: result };
  } catch (error) {
    const handledError = errorHandler(error, "API Call");
    return { success: false, error: handledError };
  }
}

// Example usage
async function safeProfileUpdate(updates) {
  const result = await safeAPICall(() => api.updateProfile(updates));

  if (!result.success) {
    // Handle error based on type
    switch (result.error.type) {
      case "AUTHENTICATION_ERROR":
        // Redirect to login
        window.location.href = "/auth/login";
        break;
      case "VALIDATION_ERROR":
        // Show validation errors
        showValidationErrors(result.error.message);
        break;
      case "RATE_LIMIT_ERROR":
        // Show rate limit message
        showRateLimitMessage(result.error.retryAfter);
        break;
      default:
        // Show generic error
        showGenericError(result.error.userMessage);
    }
    return false;
  }

  return result.data;
}
```

This comprehensive set of examples covers the main authentication and user
management operations available through the STEM Toys API, with proper error
handling and best practices for multiple programming languages.
