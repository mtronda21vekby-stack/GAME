import React from "react";
import MatrixBackground from "./components/MatrixBackground";
import { Router } from "./routes/Router";

export function App() {
  return (
    <>
      <MatrixBackground
        opacity={0.02}
        speed={0.18}
        density={1.15}
        fontSize={14}
        color="rgba(90, 190, 255, 0.90)"
        glow={false}
      />
      <div className="bc-app-layer">
        <Router />
      </div>
    </>
  );
}

export default App;
