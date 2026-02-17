import React from "react";
import MatrixBackground from "./components/MatrixBackground";
import { Router } from "./routes/Router";

export function App() {
  return (
    <>
      <MatrixBackground
        opacity={0.075}
        speed={0.26}
        density={1.38}
        fontSize={15}
        color="rgba(90, 190, 255, 0.92)"
        glow
      />
      <div className="bcScroll">
        <div className="bc-app-layer">
          <Router />
        </div>
      </div>
    </>
  );
}

export default App;
