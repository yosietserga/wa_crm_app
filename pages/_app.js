import React, { useEffect, useState } from "react";
import "../styles/globals.css";
import { ApolloProvider } from "@apollo/client";
import client from "../config/apollo";
import { WhatsAppProvider } from "../context/whatsAppContext";

const DisableSSR = ({ children }) => {
  return (
    <div suppressHydrationWarning>
      {typeof window === "undefined" ? null : children}
    </div>
  );
};

function MyApp({ Component, pageProps }) {
  const [showChild, setShowChild] = useState(false);

  useEffect(() => {
    setShowChild(true);
  }, []);

  if (!showChild) {
    return null;
  }

  return (
    <DisableSSR>
      <ApolloProvider client={client}>
        <WhatsAppProvider>
          <Component {...pageProps} />
        </WhatsAppProvider>
      </ApolloProvider>
    </DisableSSR>
  );
}

export default MyApp;
