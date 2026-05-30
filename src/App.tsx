import React, { useEffect } from "react";
import "./App.css";
import Router from "./Router";
import { setupAutoSync } from "./utils/offlineSync";
import { useCookies } from "react-cookie";

function App() {
  const [cookies] = useCookies();

  useEffect(() => {
    if (cookies.auth?.token) {
      setupAutoSync(cookies.auth.token);
    }
  }, [cookies.auth?.token]);

  return (
    <div className="App">
      <Router />
    </div>
  );
}

export default App;
