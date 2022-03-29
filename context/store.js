import * as React from "react";

//context
import { WebSocketContext } from "./websocket";

//state manager
import Freezer from "freezer-js";

const store = new Freezer({});

const StoreContext = React.createContext(store);

const StoreProvider = ({ children }) => {
  const ws = React.useContext(WebSocketContext);
  
  store.on("beforeAll", (eventName, state)=>{
    
  });
  
  store.on("afterAll", (eventName, state)=>{
    
  });
  
  if (!!ws && !!ws.socket) {
    ws.socket.on("update-24h", (msg) => {
      const d = JSON.parse(msg);
      if (!!d.stream) {
        const markets = store.get().markets || {};

        markets[d.stream] = {
          symbol: d.stream,
          price: d.data.close,
          volume: d.data.vol.toFixed(2),
        };

        store.set("markets", markets);
        store.emit("update-markets", markets);
      }
    });

    store.once("subscribe-ticker", (symbols) => {
      ws.socket.emit("subscribe-ticker", JSON.stringify(symbols));
    });
  }
  
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
};

export { StoreContext, StoreProvider };