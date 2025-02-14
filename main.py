import requests
import uuid

class PysonDBKV:
    def __init__(self, base_url, auth_key):
        self.base_url = base_url
        self.auth_headers = {"AUTH_KEY": auth_key}

    def _request(self, method, endpoint, json=None):
        """Helper method to send requests with authentication."""
        url = f"{self.base_url}{endpoint}"
        response = requests.request(method, url, headers=self.auth_headers, json=json)

        if response.status_code == 200:
            try:
                return response.json() if response.headers.get("Content-Type") == "application/json" else response.text
            except ValueError:
                return response.text
        else:
            raise Exception(f"Error: {response.status_code} - {response.text}")

    def get(self, key):
        """Get an item by key."""
        return self._request("GET", f"/get/{key}")

    def getAll(self):
        """Get all items."""
        return self._request("GET", "/getAll")

    def add(self, data):
        """Add a new item."""
        return self._request("POST", "/add", json=data)

    def update(self, key, data):
        """Update an existing item."""
        return self._request("PUT", "/update", json={"key": key, **data})

    def delete(self, key):
        """Delete an item by key."""
        return self._request("DELETE", f"/delete/{key}")

    def deleteAll(self):
        """Delete all items."""
        return self._request("DELETE", "/deleteAll")


# Initialize the class with API URL and AUTH_KEY
db = PysonDBKV(
    base_url="https://meow.workers.dev",
    auth_key="meow"
)

# Add an item
add_response = db.add({"name": "Alice", "age": 25})
print("Add Response:", add_response)

# Get an item by key
key = add_response["key"]
get_response = db.get(key)
print("Get Response:", get_response)

# Get all items
get_all_response = db.getAll()
print("Get All Response:", get_all_response)

# Update an item
update_response = db.update(key, {"age": 26})
print("Update Response:", update_response)

# Delete an item (optional)
delete_response = db.delete(key)
print("Delete Response:", delete_response)

# Delete all items (optional)
delete_all_response = db.deleteAll()
# print("Delete All Response:", delete_all_response)
