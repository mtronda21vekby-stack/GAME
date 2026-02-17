import React from "react";
import MatrixBackground from "./components/MatrixBackground";
import { Router } from "./routes/Router";

export function App() {
  return (
    <>
      <MatrixBackground
        opacity={0.055}
        speed={0.14}
        density={1.35}
        fontSize={14}
        color="rgba(90, 190, 255, 0.92)"
        glow={true}
      />
      <div className="bc-app-layer">
        <Router />
      </div>
    </>
  );
}

export default App;
