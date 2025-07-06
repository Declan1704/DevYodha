// src/routes/ws.ts
export class WebSocketServer {
  private clients: Set<WebSocket> = new Set();

  add(ws: WebSocket) {
    this.clients.add(ws);
    console.log("Client connected, total clients:", this.clients.size);

    const closeListener = () => {
      this.clients.delete(ws);
      console.log(
        "Client disconnected (via close event), total clients:",
        this.clients.size
      );
      // Important: Remove the listener itself to prevent memory leaks if ws object is somehow reused
      ws.removeEventListener("close", closeListener);
    };
    ws.addEventListener("close", closeListener);

    // Optional: Send a welcome message or initial state
    // ws.send(JSON.stringify({ event: "connected", message: "Welcome!" }));
  }

  // ADD THIS METHOD
  remove(ws: WebSocket) {
    if (this.clients.has(ws)) {
      this.clients.delete(ws);
      console.log(
        "Client explicitly removed, total clients:",
        this.clients.size
      );
    }
  }

  broadcast(message: string) {
    // console.log("Broadcasting:", message); // Can be noisy, uncomment for debugging
    this.clients.forEach((client) => {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      } catch (error) {
        console.error("Broadcast error for a client:", error);
        // Optionally remove problematic client and close its connection
        // if (this.clients.has(client)) {
        //   this.remove(client);
        //   client.close(1011, "Broadcast error"); // 1011: Internal Error
        // }
      }
    });
  }
}

export const wsServer = new WebSocketServer();
