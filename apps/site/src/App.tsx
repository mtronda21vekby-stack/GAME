import React from "react";
import MatrixBackground from "./components/MatrixBackground";
import { Router } from "./routes/Router";

export function App() {
  return (
    <>
      <MatrixBackground
        opacity={0.055}
        speed={0.095}
        density={1.6}
        fontSize={14}
        color="rgba(90, 190, 255, 0.95)"
        glow
      />
      <div className="bc-app-layer">
        <Router />
      </div>
    </>
  );
}

export default App;
