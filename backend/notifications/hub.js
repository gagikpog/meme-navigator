const clients = new Set();

function addClient(client) {
  clients.add(client);
}

function removeClient(client) {
  clients.delete(client);
}

function broadcast(event) {
  for (const client of clients) {
    try {
      // Permission-based filtering
      const isPrivate = event?.data?.permissions === 'private';
      const role = client.user?.role;
      if (isPrivate) {
        if (!(role === 'admin' || role === 'writer')) continue;
      }

      const payload = `data: ${JSON.stringify(event)}\n\n`;
      client.res.write(payload);
    } catch {
      // ignore individual client errors
    }
  }
}

module.exports = { addClient, removeClient, broadcast };


