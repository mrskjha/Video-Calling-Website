import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useSocket } from "../provider/Socket";

const Home = () => {
    const socket = useSocket();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [roomId, setRoomId] = useState("");
    
    useEffect(() => {
        socket.on('room-joined', handleJoinRoom);
        
        // Cleanup function to remove the event listener when component unmounts
        return () => {
            socket.off('room-joined', handleJoinRoom);
        };
    }, [socket]);
    
    const handleJoinRoom = () => {
        socket.emit('join-room', { email, roomId });
        navigate(`/room/${roomId}`);
        console.log('Joining room',roomId);
    };

    return (
        <div className="border border-gray-300 shadow-lg rounded-lg p-6 max-w-sm mx-auto flex justify-center items-center mt-60 bg-white">
            <div className="flex flex-col space-y-4">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-gray-400 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="text"
                    placeholder="Room Id"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="border border-gray-400 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={handleJoinRoom}>
                    Join Room
                </button>
            </div>
        </div>
    );
};

export default Home;
