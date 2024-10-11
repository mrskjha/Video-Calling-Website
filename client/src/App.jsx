import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";

import { SocketProvider } from "./provider/Socket";
import { PeerProvider } from "./provider/Peer";
import RoomPage from "./pages/RoomPage";

function App() {
  return (
    <div>
      <SocketProvider>
        <PeerProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:id" element={<RoomPage/>} />
        </Routes>
        </PeerProvider>
      </SocketProvider>
    </div>
  );
}

export default App;
