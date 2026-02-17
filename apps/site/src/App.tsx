import React from "react";
import MatrixBackground from "./components/MatrixBackground";
import { Router } from "./routes/Router";

export function App() {
  return (
    <>
      <MatrixBackground
        opacity={0.12}
        speed={1.15}
        density={1.05}
        fontSize={16}
        color="rgba(0, 255, 170, 0.95)"
        glow
      />
      <div className="bc-app-layer">
        <Router />
      </div>
    </>
  );
}

export default App;
