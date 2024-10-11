import React, { useCallback, useEffect, useState, useRef } from "react";
import { useSocket } from "../provider/Socket";
import { usePeer } from "../provider/Peer";

const RoomPage = () => {
  const socket = useSocket(); // Get the socket instance from context
  const { peer, createOffer, createAnswer, sendStream, remoteStream } = usePeer(); // Destructure peer-related functions from context
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null); // Ref for the local video element
  const remoteVideoRef = useRef(null); // Ref for the remote video element
  const [remoteEmail, setRemoteEmail] = useState(null);

  // Handle when a new user connects
  const handleNewUser = useCallback(
    async (email) => {
      console.log(`User ${email} connected`);

      if (stream) {
        try {
          await sendStream(stream); // Ensure the stream is sent first
          console.log("Stream sent");
        } catch (error) {
          console.error("Error sending stream:", error);
        }
      } else {
        console.warn("No local stream available to send");
      }

      try {
        const offer = await createOffer(); // Create an offer for the new user
        console.log("Created offer:", offer);
        socket.emit("call-user", { email, offer }); // Send the offer to the user
        setRemoteEmail(email);
      } catch (error) {
        console.error("Error creating or sending offer:", error);
      }
    },
    [createOffer, socket, sendStream, stream]
  );

  // Handle an incoming call with an offer
  const handleIncomingCall = useCallback(
    async (data) => {
      const { offer, socket: callerSocketId, email: callerEmail } = data;
      console.log("Incoming call from", callerSocketId, callerEmail);
      console.log("Received offer:", offer);

      if (!offer) {
        console.error("Received null or undefined offer");
        return;
      }

      try {
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        console.log("Remote description set with offer");
      } catch (error) {
        console.error("Error setting remote description:", error);
        return;
      }

      try {
        const answer = await createAnswer(offer);
        if (answer) {
          console.log("Created answer:", answer);
          socket.emit("call-accepted", { answer, socket: callerSocketId }); // Send the answer back to the caller
          setRemoteEmail(callerEmail); // Set remoteEmail to callerEmail
        } else {
          console.error("Answer is null or undefined");
        }
      } catch (error) {
        console.error("Error creating or sending answer:", error);
      }
    },
    [peer, socket, createAnswer]
  );

  // Handle when the call is accepted by the other party
  const handleCallAccepted = useCallback(
    async (answer) => {
      console.log("Call accepted with answer:", answer);
      if (answer) {
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(answer)); // Set the remote answer
          console.log("Remote description set with answer");
        } catch (error) {
          console.error("Error setting remote description with answer:", error);
        }
      } else {
        console.error("Received null answer in call-accepted");
      }
    },
    [peer]
  );

  // Get user media (camera and microphone)
  const getUserMediaStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(stream); // Save the media stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream; // Attach the stream to the video element
      }
      // Automatically send the stream
      await sendStream(stream);
      console.log("Stream sent automatically after getting user media");
    } catch (error) {
      console.error("Error getting user media:", error);
    }
  }, [sendStream]);

  // Handle negotiationneeded event for renegotiation
  const handleNegotiationNeededEvent = useCallback(async () => {
    try {
      console.log("Negotiation needed");
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("call-user", { email: remoteEmail, offer });
      console.log("Negotiation offer sent:", offer);
    } catch (error) {
      console.error("Error creating offer during negotiation:", error);
    }
  }, [peer, socket, remoteEmail]);

  // Attach remote stream to the video element when it becomes available
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream; // Attach the remote stream to the video element
      console.log("Remote stream attached to video element");
    }
  }, [remoteStream]);

  // Listen for negotiationneeded event
  useEffect(() => {
    if (!peer) return;

    peer.addEventListener("negotiationneeded", handleNegotiationNeededEvent);
    console.log("Added negotiationneeded event listener");

    return () => {
      peer.removeEventListener("negotiationneeded", handleNegotiationNeededEvent);
      console.log("Removed negotiationneeded event listener");
    };
  }, [peer, handleNegotiationNeededEvent]);

  // Listen for socket events
  useEffect(() => {
    socket.on("user-connected", handleNewUser); // Listen for when a new user connects
    socket.on("incoming-call", handleIncomingCall); // Listen for incoming call offers
    socket.on("call-accepted", handleCallAccepted); // Listen for when the call is accepted

    console.log("Socket event listeners added");

    // Cleanup event listeners on unmount
    return () => {
      socket.off("user-connected", handleNewUser);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      console.log("Socket event listeners removed");
    };
  }, [socket, handleNewUser, handleIncomingCall, handleCallAccepted]);

  // Get user media when the component mounts
  useEffect(() => {
    getUserMediaStream();
  }, [getUserMediaStream]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-gray-100 h-screen">
  <h1 className="text-4xl font-bold text-blue-600">You are in the room</h1>
  <h2 className="text-lg text-gray-600">Connected with: {remoteEmail ? remoteEmail : 'Waiting for user...'}</h2>

  {/* Video section */}
  <div className="flex space-x-8">
    {/* Local video */}
    <div className="relative">
      <video ref={videoRef} autoPlay playsInline className="w-80 h-80 rounded-lg shadow-lg border-4 border-blue-500 bg-black"></video>
      <div className="absolute bottom-2 right-2 bg-blue-500 text-white px-2 py-1 rounded">You</div>
    </div>

    {/* Remote video */}
    <div className="relative">
      {remoteStream ? (
        <video ref={remoteVideoRef} autoPlay playsInline className="w-80 h-80 rounded-lg shadow-lg border-4 border-green-500 bg-black"></video>
      ) : (
        <div className="w-80 h-80 rounded-lg shadow-lg border-4 border-gray-500 flex items-center justify-center bg-black text-white">
          Remote video not available
        </div>
      )}
      <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded">Remote</div>
    </div>
  </div>

  {/* Control buttons */}
  <div className="flex space-x-4 mt-4">
    <button className="bg-red-500 hover:bg-red-600 text-white py-2 px-6 rounded-lg shadow-lg">
      End Call
    </button>
    <button className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-lg shadow-lg">
      Mute Audio
    </button>
    <button className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-lg shadow-lg">
      Stop Video
    </button>
  </div>
</div>

  );
};

export default RoomPage;
