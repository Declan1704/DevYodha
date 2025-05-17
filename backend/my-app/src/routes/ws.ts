export class WebSocketServer {
  private sockets: Set<any> = new Set();

  add(socket: any) {
    this.sockets.add(socket);
    // Avoid addEventListener; cleanup handled in index.ts onClose
  }

  has(socket: any): boolean {
    return this.sockets.has(socket);
  }

  remove(socket: any) {
    this.sockets.delete(socket);
    console.log("WebSocket removed from server");
  }

  broadcast(message: string) {
    for (const socket of this.sockets) {
      try {
        socket.send(message);
      } catch (err) {
        console.error("Error sending WebSocket message:", err);
        this.sockets.delete(socket); // Remove failed sockets
      }
    }
  }
}

export const wsServer = new WebSocketServer();
