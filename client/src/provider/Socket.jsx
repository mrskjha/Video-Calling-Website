import React, { useMemo } from 'react';
import { io } from 'socket.io-client';

const SocketContext = React.createContext(null);

export const useSocket = () => {
    return React.useContext(SocketContext);
}

export const SocketProvider = ({ children }) => {
    const socket = useMemo(() => io('https://video-calling-website-0e87.onrender.com'), []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}
