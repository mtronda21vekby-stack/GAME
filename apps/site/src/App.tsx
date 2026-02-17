import React from "react";
import MatrixBackground from "./components/MatrixBackground";
import { Router } from "./routes/Router";

export function App() {
  return (
    <>
      <MatrixBackground
        opacity={0.03}
        speed={0.09}
        density={1.45}
        fontSize={13}
        color="rgba(90, 190, 255, 0.88)"
        glow={false}
      />
      <div className="bc-app-layer">
        <Router />
      </div>
    </>
  );
}

export default App;
