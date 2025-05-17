export class WebSocketServer {
  private sockets: Set<WebSocket> = new Set();

  add(socket: WebSocket) {
    this.sockets.add(socket);
    socket.addEventListener("close", () => this.sockets.delete(socket));
  }

  broadcast(message: string) {
    for (const socket of this.sockets) {
      socket.send(message);
    }
  }
}

export const wsServer = new WebSocketServer();
