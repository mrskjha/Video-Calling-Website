import React, { useMemo, useEffect, useState } from "react";

const PeerContext = React.createContext(null);

export const usePeer = () => {
  return React.useContext(PeerContext);
};

export const PeerProvider = (props) => {
  const [remoteStream, setRemoteStream] = useState(null);

  // Create the peer connection
  const peer = useMemo(() => new RTCPeerConnection({}), []);

  // Function to create an offer
  const createOffer = async () => {
    console.log("Creating offer...");
    try {
      const offer = await peer.createOffer();
      if (offer) {
        console.log("Offer created successfully:", offer);
      } else {
        console.error("Offer is null or undefined");
      }
      await peer.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error("Error creating offer:", error);
      return null;
    }
  };
  

  // Function to create an answer for an offer
  const createAnswer = async (offer) => {
    if (!offer) {
      console.error("Offer is null or undefined");
      return;
    }
  
    try {
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error("Error creating answer:", error);
      throw error;
    }
  };

  const sendStream = async (stream) => {
    const existingSenders = peer.getSenders(); // Get all existing senders
  
    stream.getTracks().forEach((track) => {
      const existingSender = existingSenders.find((sender) => sender.track === track);
      
      if (!existingSender) {
        peer.addTrack(track, stream); // Add the track only if it's not already added
      }
    });
  };

  // Function to set the remote description (for both offer/answer)
  const setRemoteDescription = async (description) => {
    try {
      await peer.setRemoteDescription(new RTCSessionDescription(description));
    } catch (error) {
      console.error("Error setting remote description:", error);
      throw error;
    }
  };

  useEffect(() => {
    peer.ontrack = (event) => {
      console.log("Remote stream received");
      setRemoteStream(event.streams[0]);
    };
  }, [peer]);

  const handleTrackEvent = (event) => {
    console.log("Remote stream received");
    setRemoteStream(event.streams[0]);
  }

  

  useEffect(()=>{
    peer.addEventListener("track", handleTrackEvent);
    
  return () => {
    peer.removeEventListener("track", handleTrackEvent);
    
  };  
  }, [peer]);

  // Provide the peer and utility functions through context
  return (
    <PeerContext.Provider
      value={{
        peer,
        createOffer,
        createAnswer,
        setRemoteDescription,
        sendStream,
        remoteStream,
      }}
    >
      {props.children}
    </PeerContext.Provider>
  );
};
