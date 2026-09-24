'use client';

import { use, useEffect, useState, useRef } from 'react';
import YouTube, { YouTubeEvent, YouTubePlayer } from 'react-youtube';
import { useSession } from 'next-auth/react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WatchPartyState, WatchPartyMessage } from '@/lib/watchParty';
import { getCourseLessonsForParty, endLiveParty, askAICoHost } from '@/server/actions/live-party';
import { useRouter } from 'next/navigation';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { Mic, MicOff } from 'lucide-react';

export default function WatchPartyPage({
  params,
}: {
  params: Promise<{ partyId: string }>;
}) {
  const { partyId } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  
  const [state, setState] = useState<WatchPartyState | null>(null);
  const [messages, setMessages] = useState<WatchPartyMessage[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeReactions, setActiveReactions] = useState<{ id: string, emoji: string }[]>([]);
  const seenReactions = useRef<Set<string>>(new Set());
  
  const playerRef = useRef<YouTubePlayer>(null);
  const [isHost, setIsHost] = useState(false);
  const [modules, setModules] = useState<any[]>([]);

  // Voice Chat
  const { peerId, isMuted, toggleMute, remoteStreams, callPeer } = useVoiceChat(partyId, session?.user?.id || 'anon');
  
  // Sync interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const sync = async (action = 'SYNC', payload = {}) => {
      try {
        const res = await fetch(`/api/watch-parties/${partyId}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
        });
        
        if (res.ok) {
          const data = await res.json();
          setState(data.state);
          setMessages(data.messages);
          setParticipants(data.participants);

          if (data.reactions) {
            const newReactions = data.reactions.filter((r: any) => !seenReactions.current.has(r.id));
            if (newReactions.length > 0) {
              newReactions.forEach((r: any) => seenReactions.current.add(r.id));
              setActiveReactions(prev => [...prev, ...newReactions]);
              
              // Remove them after animation completes (e.g., 3s)
              setTimeout(() => {
                setActiveReactions(prev => prev.filter(pr => !newReactions.find((nr: any) => nr.id === pr.id)));
              }, 3000);
            }
          }

          if (data.voicePeers && peerId) {
            data.voicePeers.forEach((pId: string) => {
              if (pId !== peerId) {
                callPeer(pId);
              }
            });
          }
          
          if (session?.user?.id === data.state?.hostId) {
            setIsHost(true);
          } else if (playerRef.current && data.state) {
            // Apply host state to guest player if not host
            const currentTime = await playerRef.current.getCurrentTime();
            const timeDiff = Math.abs(currentTime - data.state.currentVideoTime);
            
            // Scrub if out of sync by > 2 seconds
            if (timeDiff > 2) {
              playerRef.current.seekTo(data.state.currentVideoTime, true);
            }
            
            // Play/Pause sync
            const playerState = await playerRef.current.getPlayerState();
            // 1 is playing, 2 is paused
            if (data.state.isPlaying && playerState !== 1) {
              playerRef.current.playVideo();
            } else if (!data.state.isPlaying && playerState === 1) {
              playerRef.current.pauseVideo();
            }
          }
        } else if (res.status === 404) {
          // Party has ended
          clearInterval(interval);
          alert('This watch party has ended.');
          router.push('/community');
        }
      } catch (err) {
        console.error('Failed to sync watch party', err);
      }
    };

    // Initial sync
    sync();

    // Poll every 2 seconds
    interval = setInterval(() => sync(), 2000);

    return () => clearInterval(interval);
  }, [partyId, session?.user?.id, peerId, callPeer]);

  // Register voice peer once initialized
  useEffect(() => {
    if (peerId) {
      fetch(`/api/watch-parties/${partyId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REGISTER_VOICE_PEER', payload: { peerId } }),
      }).catch(err => console.error("Failed to register voice peer:", err));
    }
  }, [partyId, peerId]);

  useEffect(() => {
    if (isHost && state?.courseId && modules.length === 0) {
      getCourseLessonsForParty(state.courseId).then(res => {
        if (res.success && res.modules) {
          setModules(res.modules);
        }
      });
    }
  }, [isHost, state?.courseId, modules.length]);

  const updateHostState = async () => {
    if (!isHost || !playerRef.current) return;
    
    const currentVideoTime = await playerRef.current.getCurrentTime();
    const playerState = await playerRef.current.getPlayerState();
    const isPlaying = playerState === 1;

    await fetch(`/api/watch-parties/${partyId}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_STATE',
        payload: { currentVideoTime, isPlaying },
      }),
    });
  };

  const handlePlayerStateChange = (event: YouTubeEvent) => {
    if (isHost) {
      updateHostState();
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = chatInput.trim();
    if (!content) return;

    // Local optimistic update logic goes through SSE normally,
    // but we can fire the async request to the sync endpoint.
    await fetch(`/api/watch-parties/${partyId}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SEND_MESSAGE',
        payload: { content },
      }),
    });
    
    setChatInput('');

    // If message starts with @ai, trigger the AI Co-Host
    if (content.toLowerCase().startsWith('@ai ')) {
      const question = content.substring(4).trim();
      if (question) {
        askAICoHost(partyId, question).catch(err => console.error("AI error:", err));
      }
    }
  };

  const sendReaction = async (emoji: string) => {
    // Optimistic UI for local reaction
    const optimisticId = crypto.randomUUID();
    seenReactions.current.add(optimisticId);
    setActiveReactions(prev => [...prev, { id: optimisticId, emoji }]);
    setTimeout(() => {
      setActiveReactions(prev => prev.filter(r => r.id !== optimisticId));
    }, 3000);

    await fetch(`/api/watch-parties/${partyId}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SEND_REACTION',
        payload: { emoji },
      }),
    });
  };

  if (!state) {
    return <div className="p-8 text-center">Loading Watch Party...</div>;
  }

  return (
    <div className="flex h-screen bg-black text-white flex-col md:flex-row">
      {/* Remote Audio Streams */}
      {Array.from(remoteStreams.entries()).map(([id, stream]) => (
        <audio 
          key={id} 
          autoPlay 
          ref={el => { if (el) el.srcObject = stream; }} 
        />
      ))}

      <div className="flex-1 flex flex-col p-4 relative">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Live Watch Party</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMute}
            className={`text-xs border-neutral-700 hover:bg-neutral-800 ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-neutral-900 text-white'}`}
          >
            {isMuted ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
            {isMuted ? 'Unmute' : 'Mute'}
          </Button>
        </div>
        <div className="flex-1 relative bg-neutral-900 rounded-lg overflow-hidden flex items-center justify-center">
          {state.currentVideoId ? (
            <YouTube
              videoId={state.currentVideoId}
              opts={{
                width: '100%',
                height: '100%',
                playerVars: {
                  autoplay: 1,
                  controls: isHost ? 1 : 0, // Only host gets native controls easily
                },
              }}
              onReady={(e) => {
                playerRef.current = e.target;
              }}
              onStateChange={handlePlayerStateChange}
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <div className="text-neutral-500">Host is selecting a video...</div>
          )}

          {/* Floating Reactions */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
            {activeReactions.map((reaction) => (
              <div 
                key={reaction.id}
                className="absolute text-4xl animate-[floatUp_3s_ease-out_forwards]"
                style={{
                  left: `${Math.max(10, Math.random() * 90)}%`,
                  bottom: '-50px',
                }}
              >
                {reaction.emoji}
              </div>
            ))}
          </div>
        </div>
        
        {isHost && (
          <div className="mt-4 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
            <h3 className="font-semibold mb-2">Host Controls</h3>
            <p className="text-sm text-neutral-400 mb-2">
              You are the host. When you play, pause, or scrub, the participants will sync.
            </p>
            <div className="flex flex-col gap-2 mt-4">
               <label className="text-xs font-semibold text-neutral-500 uppercase">Select Lesson to Play</label>
               <select 
                 className="bg-neutral-900 border border-neutral-700 text-white rounded p-2 text-sm outline-none focus:border-neutral-500"
                 onChange={async (e) => {
                   const videoId = e.target.value;
                   if (videoId) {
                     await fetch(`/api/watch-parties/${partyId}/sync`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'UPDATE_STATE',
                          payload: { currentVideoId: videoId },
                        }),
                      });
                   }
                 }}
                 value={state.currentVideoId || ""}
               >
                 <option value="" disabled>-- Select a lesson --</option>
                 {modules.map((m: any, mIdx: number) => (
                   <optgroup key={m.id} label={`Module ${mIdx + 1}`}>
                     {m.lessons.map((l: any) => (
                       <option key={l.id} value={l.videoId}>{l.title}</option>
                     ))}
                   </optgroup>
                 ))}
               </select>
               <Button 
                 variant="destructive" 
                 className="mt-2"
                 onClick={async () => {
                   if (confirm('Are you sure you want to end this party?')) {
                     await endLiveParty(partyId);
                     router.push('/live-parties');
                   }
                 }}
               >
                 End Party
               </Button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full md:w-80 border-l border-neutral-800 flex flex-col bg-neutral-950">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
          <h2 className="font-bold">Chat ({participants.length} watching)</h2>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Invite link copied to clipboard!');
            }}
          >
            <Copy className="w-3 h-3 mr-2" />
            Invite
          </Button>
        </div>
        
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {messages.map((msg) => {
            const isMsgHost = msg.userId === state.hostId;
            return (
              <div key={msg.id} className="mb-2">
                <span className={`font-semibold text-sm ${isMsgHost ? 'text-yellow-400' : 'text-blue-400'}`}>
                  {msg.userName}
                  {isMsgHost && <span className="ml-1 text-xs opacity-75">(Host)</span>}
                  : 
                </span>
                <span className="text-sm ml-1">{msg.content}</span>
              </div>
            );
          })}
        </div>

        {/* Reaction Bar */}
        <div className="p-3 border-t border-neutral-800 flex gap-2 justify-center">
          {['❤️', '😂', '😮', '👏', '🔥'].map(emoji => (
            <button 
              key={emoji} 
              onClick={() => sendReaction(emoji)}
              className="p-2 rounded-full hover:bg-neutral-800 transition-transform active:scale-90 text-xl"
            >
              {emoji}
            </button>
          ))}
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-neutral-800 flex gap-2">
          <Input 
            value={chatInput} 
            onChange={(e) => setChatInput(e.target.value)} 
            placeholder="Type a message..." 
            className="bg-neutral-900 border-neutral-800 text-white"
          />
          <Button type="submit" variant="secondary">Send</Button>
        </form>
      </div>
    </div>
  );
}
