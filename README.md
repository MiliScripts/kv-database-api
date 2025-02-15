# PysonDBKV - Cloudflare Workers Key-Value Store

This repository contains a simple key-value store implementation using Cloudflare Workers and Workers KV.  It provides a REST API to store, retrieve, update, and delete data.  It includes a Python client for easy interaction with the API.

## Features

*   **Simple Key-Value Storage:** Easily store and retrieve JSON data using keys.
*   **REST API:**  Interact with the store using standard HTTP methods (GET, POST, PUT, DELETE).
*   **Cloudflare Workers KV:** Leverages the performance and scalability of Cloudflare Workers KV.
*   **Python Client:**  A convenient Python client is provided for interacting with the API.
*   **Authentication:** Secure access with a simple `AUTH_KEY`.
*   **List All Keys/Values:**  An authenticated endpoint `/auth-key?auth_key=<AUTH_KEY>` to retrieve all key/value pairs in an HTML table.

## Architecture

*   **Cloudflare Worker (`workers.js`):**  Handles API requests, interacts with Cloudflare Workers KV, and returns responses.
*   **Cloudflare Workers KV:**  The underlying storage mechanism.
*   **Python Client (`main.py`):**  A Python library for interacting with the API.

## Getting Started

### 1.  Cloudflare Setup

*   **Create a Cloudflare Account:** If you don't have one, sign up at [Cloudflare](https://www.cloudflare.com/).
*   **Create a Workers KV Namespace:**
    *   Log in to your Cloudflare dashboard.
    *   Go to the "KV" section.
    *   Create a new namespace.  Note the namespace ID and the account ID, you will need these later.
*   **Install the Wrangler CLI:**
    ```bash
    npm install -g @cloudflare/wrangler
    ```
*   **Configure Wrangler:**
    ```bash
    wrangler login
    ```

### 2.  Configure the Cloudflare Worker

*   **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```
*   **Create a `wrangler.toml` file:**  This file configures your Cloudflare Worker.  Here's an example:

    ```toml
    name = "pyson-dbkv"  # Choose a name for your worker
    main = "workers.js"
    compatibility_date = "2023-04-01" # Or a more recent date

    kv_namespaces = [
      { binding = "DB", id = "<YOUR_KV_NAMESPACE_ID>" }
    ]

    [vars]
    AUTH_KEY = "meow" # Replace with a strong, secure key.  THIS IS IMPORTANT!
    ```

    *   Replace `<YOUR_KV_NAMESPACE_ID>` with the ID of the KV namespace you created in Cloudflare.
    *   Replace `"meow"` with a strong, randomly generated `AUTH_KEY`. *This is crucial for security!*
*   **Deploy the Worker:**
    ```bash
    wrangler publish
    ```
    This will deploy your worker to a `*.workers.dev` subdomain.  The output of the `wrangler publish` command will give you the URL of your deployed worker.  Note this URL, as you will need it for the Python client.

### 3. Python Client Setup

*   **Install the `requests` library:**
    ```bash
    pip install requests
    ```

*   **Configure the Python client (`main.py`):**
    *   Replace `"https://meow.workers.dev"` in `main.py` with the URL of your deployed Cloudflare Worker.
    *   Replace `"meow"` in `main.py` with the same `AUTH_KEY` you configured in `wrangler.toml`.

*   **Run the Python client:**
    ```bash
    python main.py
    ```

    This will execute the example code in `main.py`, demonstrating how to interact with the API.

## API Endpoints

All endpoints require the `AUTH_KEY` in the request header, **except for `/auth-key` which uses a query parameter.**

*   **`GET /get/{key}`:**  Retrieve an item by its key.
    *   Example: `GET /get/123e4567-e89b-12d3-a456-426614174000`
*   **`GET /getAll`:** Retrieve all items.
*   **`POST /add`:** Add a new item.  The request body should be a JSON object containing the data to be stored.
    *   Example: `POST /add` with body `{"name": "Alice", "age": 30}`
*   **`PUT /update`:** Update an existing item.  The request body should be a JSON object containing the `key` and the data to be updated.
    *   Example: `PUT /update` with body `{"key": "123e4567-e89b-12d3-a456-426614174000", "age": 31}`
*   **`DELETE /delete/{key}`:** Delete an item by its key.
    *   Example: `DELETE /delete/123e4567-e89b-12d3-a456-426614174000`
*   **`DELETE /deleteAll`:** Delete all items.
*   **`GET /auth-key?auth_key=<AUTH_KEY>`:**  Retrieve all key-value pairs as an HTML table. This is intended for debugging and should be used cautiously.  **This endpoint *requires* the `auth_key` as a URL parameter.**

### Example API Usage (using `curl`)

*   **Add an item:**

    ```bash
    curl -X POST -H "Content-Type: application/json" -H "AUTH_KEY: meow" -d '{"name": "Bob", "city": "New York"}' https://your-worker.workers.dev/add
    ```

*   **Get an item:**

    ```bash
    curl -H "AUTH_KEY: meow" https://your-worker.workers.dev/get/your_key
    ```

*   **List all items (HTML table):**

    ```bash
    curl https://your-worker.workers.dev/auth-key?auth_key=meow
    ```

## Security Considerations

*   **`AUTH_KEY`:**  It is **critical** to use a strong, randomly generated `AUTH_KEY` and keep it secret.  **Never commit your `AUTH_KEY` to version control!** Store it securely as an environment variable or secret within your Cloudflare Workers configuration.  Do not use the example "meow" key in a production environment.
*   **HTTPS:**  Ensure your Cloudflare Worker is served over HTTPS to protect the `AUTH_KEY` during transmission. Cloudflare provides this automatically.
*   **Rate Limiting:** Consider implementing rate limiting to prevent abuse. Cloudflare Workers provides tools for rate limiting.
*   **Data Validation:**  Validate the data being sent to the `/add` and `/update` endpoints to prevent unexpected data from being stored.
*   **`/auth-key` endpoint:** Be extremely careful when exposing the `/auth-key` endpoint in a production environment.  It provides full read access to your data, so ensure it is only accessible to authorized users or services.  Consider disabling it entirely once debugging is complete.

## `workers.js` Code Explanation

*   **`fetch(request, env)`:** This is the main entry point for the Cloudflare Worker.  It handles all incoming requests.
*   **`PysonDBKV` class:** This class encapsulates the logic for interacting with Cloudflare Workers KV.
    *   **`constructor(kvNamespace)`:**  Initializes the class with a reference to the KV namespace.
    *   **`getIndex()`:** Retrieves the index of all keys from KV.  The index is stored under the key `__index__`.
    *   **`updateIndex(index)`:** Updates the index in KV.
    *   **`add(data)`:** Adds a new item to KV, generating a unique key using `crypto.randomUUID()`.
    *   **`get(key)`:** Retrieves an item from KV by its key.
    *   **`getAll()`:** Retrieves all items from KV by iterating through the index.
    *   **`update(key, data)`:** Updates an existing item in KV.
    *   **`delete(key)`:** Deletes an item from KV and removes it from the index.
    *   **`deleteAll()`:** Deletes all items from KV and clears the index.

## `main.py` Code Explanation

*   **`PysonDBKV` class:**  A Python client that provides methods for interacting with the Cloudflare Workers API.
    *   **`__init__(self, base_url, auth_key)`:**  Initializes the class with the base URL of the Cloudflare Worker and the `AUTH_KEY`.
    *   **`_request(self, method, endpoint, json=None)`:**  A helper method that sends HTTP requests to the API with the `AUTH_KEY` in the headers.
    *   **`get(self, key)`:** Retrieves an item by its key.
    *   **`getAll(self)`:** Retrieves all items.
    *   **`add(self, data)`:** Adds a new item.
    *   **`update(self, key, data)`:** Updates an existing item.
    *   **`delete(self, key)`:** Deletes an item by its key.
    *   **`deleteAll(self)`:** Deletes all items.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)
