import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export interface YjsConnection {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  destroy: () => void;
}

export function connect(docId: string, key: string): YjsConnection {
  const ydoc = new Y.Doc();
  const wsUrl = `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws`;
  const provider = new WebsocketProvider(wsUrl, docId, ydoc, {
    connect: true,
    params: { key },
  });

  return {
    ydoc,
    provider,
    destroy: () => {
      provider.destroy();
      ydoc.destroy();
    },
  };
}
