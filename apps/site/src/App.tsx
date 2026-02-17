import React from "react";
import MatrixBackground from "./components/MatrixBackground";
import { Router } from "./routes/Router";

export function App() {
  return (
    <>
      <MatrixBackground
        opacity={0.10}
        speed={0.42}            // ещё медленнее + кино
        density={1.05}
        fontSize={16}
        color="rgba(90, 190, 255, 0.92)" // премиум-blue
        glow
      />
      <div className="bc-app-layer">
        <Router />
      </div>
    </>
  );
}

export default App;
