import { useState, useEffect, useRef, useCallback } from 'react';

// Using dynamic import because peerjs requires browser environment
// and might throw on SSR
export function useVoiceChat(partyId: string, userId: string) {
  const [peer, setPeer] = useState<any>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true); // Start muted by default
  const [error, setError] = useState<string | null>(null);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const callsRef = useRef<Map<string, any>>(new Map());

  // We need a ref to track which remote peers we are currently connected to
  // so we can render their audio streams
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  useEffect(() => {
    let activePeer: any = null;

    const initPeer = async () => {
      try {
        const PeerJS = (await import('peerjs')).default;
        
        // Generate a deterministic but unique peer ID for this user in this party
        const generatedPeerId = `watchparty-${partyId}-${userId}`;
        
        activePeer = new PeerJS(generatedPeerId, {
          // You can configure your own TURN/STUN servers here if needed for prod
          // using default free PeerJS server for MVP
          debug: 1
        });

        activePeer.on('open', (id: string) => {
          setPeerId(id);
          setPeer(activePeer);
        });

        // Answer incoming calls
        activePeer.on('call', async (call: any) => {
          // Get local audio stream if not already got
          if (!localStreamRef.current) {
            try {
              localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
              // Start muted
              localStreamRef.current.getAudioTracks().forEach(t => t.enabled = false);
            } catch (err) {
              console.error("Failed to get local audio", err);
              return;
            }
          }

          call.answer(localStreamRef.current);
          callsRef.current.set(call.peer, call);

          call.on('stream', (remoteStream: MediaStream) => {
            setRemoteStreams(prev => {
              const next = new Map(prev);
              next.set(call.peer, remoteStream);
              return next;
            });
          });

          call.on('close', () => {
            callsRef.current.delete(call.peer);
            setRemoteStreams(prev => {
              const next = new Map(prev);
              next.delete(call.peer);
              return next;
            });
          });
        });

        activePeer.on('error', (err: any) => {
          console.error("PeerJS Error:", err);
          setError(err.message);
        });

      } catch (err: any) {
        setError("Failed to initialize voice chat");
        console.error(err);
      }
    };

    initPeer();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      callsRef.current.forEach(call => call.close());
      if (activePeer) {
        activePeer.destroy();
      }
    };
  }, [partyId, userId]);

  // Call a new peer when discovered
  const callPeer = useCallback(async (remotePeerId: string) => {
    if (!peer || remotePeerId === peerId || callsRef.current.has(remotePeerId)) {
      return;
    }

    try {
      if (!localStreamRef.current) {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        // Start muted if just initializing
        localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !isMuted);
      }

      const call = peer.call(remotePeerId, localStreamRef.current);
      if (!call) return; // Might happen if peer is destroyed

      callsRef.current.set(remotePeerId, call);

      call.on('stream', (remoteStream: MediaStream) => {
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.set(remotePeerId, remoteStream);
          return next;
        });
      });

      call.on('close', () => {
        callsRef.current.delete(remotePeerId);
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.delete(remotePeerId);
          return next;
        });
      });
    } catch (err) {
      console.error("Error calling peer:", err);
    }
  }, [peer, peerId, isMuted]);

  const toggleMute = useCallback(async () => {
    try {
      if (!localStreamRef.current) {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }
      
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const newMutedState = !isMuted;
        audioTracks[0].enabled = !newMutedState;
        setIsMuted(newMutedState);
      }
    } catch (err) {
      console.error("Could not get microphone to mute/unmute", err);
      setError("Microphone access denied");
    }
  }, [isMuted]);

  return {
    peerId,
    isMuted,
    error,
    toggleMute,
    remoteStreams,
    callPeer
  };
}
