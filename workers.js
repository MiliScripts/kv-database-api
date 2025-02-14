export default {
  async fetch(request, env) {
    const db = new PysonDBKV(env.DB);
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // Handle /auth-key endpoint
      if (path === '/auth-key') {
        // Get AUTH_KEY from query parameter
        const authKey = url.searchParams.get('auth_key');

        // Validate AUTH_KEY
        if (!authKey || authKey !== env.AUTH_KEY) {
          return new Response("Unauthorized", { status: 401 });
        }

        // Fetch all key-value pairs
        const items = await db.getAll();
        const tableRows = items.map(item => `
          <tr>
            <td>${item.key}</td>
            <td>${JSON.stringify(item.value)}</td>
          </tr>
        `).join('');

        // Generate HTML response
        const htmlResponse = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Key-Value Store</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f4f4f4; }
              @media (max-width: 600px) {
                table { font-size: 14px; }
                th, td { padding: 6px; }
              }
            </style>
          </head>
          <body>
            <h2>Stored Key-Value Pairs</h2>
            <table>
              <tr>
                <th>Key</th>
                <th>Value</th>
              </tr>
              ${tableRows}
            </table>
          </body>
          </html>
        `;
        return new Response(htmlResponse, { headers: { 'Content-Type': 'text/html' } });
      }

      // Other endpoints
      if (path.startsWith('/get/')) {
        const key = path.split('/get/')[1];
        const item = await db.get(key);
        return new Response(JSON.stringify(item), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (path === '/getAll') {
        const items = await db.getAll();
        return new Response(JSON.stringify(items), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (path.startsWith('/delete/')) {
        const key = path.split('/delete/')[1];
        await db.delete(key);
        return new Response('Item deleted successfully');
      }

      if (path === '/add' && method === 'POST') {
        const data = await request.json();
        const key = await db.add(data);
        return new Response(JSON.stringify({ key }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (path === '/update' && method === 'PUT') {
        const data = await request.json();
        const { key, ...updateData } = data;
        await db.update(key, updateData);
        return new Response('Item updated successfully');
      }

      if (path === '/deleteAll' && method === 'DELETE') {
        await db.deleteAll();
        return new Response('All items deleted successfully');
      }

      // Default response for unknown endpoints
      return new Response('Not found', { status: 404 });
    } catch (error) {
      return new Response(error.message, { status: 500 });
    }
  }
};

class PysonDBKV {
  constructor(kvNamespace) {
    this.kv = kvNamespace;
    this.indexKey = '__index__';
  }

  async getIndex() {
    const index = await this.kv.get(this.indexKey);
    return index ? JSON.parse(index) : [];
  }

  async updateIndex(index) {
    await this.kv.put(this.indexKey, JSON.stringify(index));
  }

  async add(data) {
    const key = crypto.randomUUID();
    const index = await this.getIndex();
    index.push(key);
    await this.updateIndex(index);
    await this.kv.put(key, JSON.stringify(data));
    return key;
  }

  async get(key) {
    const data = await this.kv.get(key);
    return data ? JSON.parse(data) : null;
  }

  async getAll() {
    const index = await this.getIndex();
    const items = await Promise.all(
      index.map(async (key) => {
        const data = await this.get(key);
        return { key, value: data };
      })
    );
    return items;
  }

  async update(key, data) {
    const existingData = await this.get(key);
    if (!existingData) {
      throw new Error('Item not found');
    }
    const updatedData = { ...existingData, ...data };
    await this.kv.put(key, JSON.stringify(updatedData));
  }

  async delete(key) {
    const index = await this.getIndex();
    const newIndex = index.filter(k => k !== key);
    await this.updateIndex(newIndex);
    await this.kv.delete(key);
  }

  async deleteAll() {
    const index = await this.getIndex();
    await Promise.all(index.map(key => this.kv.delete(key)));
    await this.kv.delete(this.indexKey);
  }
}
