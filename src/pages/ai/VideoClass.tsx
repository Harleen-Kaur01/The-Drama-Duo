import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare } from 'lucide-react';
import { addStudyMinutes } from '@/lib/progress';

const RemoteVideo = ({ stream, userId }: { stream: MediaStream; userId: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return (
    <div className="relative bg-neutral-800 rounded-2xl overflow-hidden border border-neutral-700 shadow-lg flex items-center justify-center">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium flex items-center gap-2">
        Student {userId.substring(0, 4)}
      </div>
    </div>
  );
};

export default function VideoClass() {
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<string, MediaStream>>({});
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [messages, setMessages] = useState<{ id: string; text: string; senderId: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const myId = useRef(uuidv4());
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    socketRef.current = io(window.location.origin);

    const createPeerConnection = (peerId: string, localStream: MediaStream) => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit('webrtc-ice-candidate', {
            target: peerId,
            caller: myId.current,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        setPeers((prev) => ({
          ...prev,
          [peerId]: event.streams[0],
        }));
      };

      peerConnections.current[peerId] = pc;
      return pc;
    };

    socketRef.current.on('receive-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketRef.current.on('user-connected', async (userId) => {
      if (!streamRef.current) return;
      const pc = createPeerConnection(userId, streamRef.current);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit('webrtc-offer', {
        target: userId,
        caller: myId.current,
        sdp: pc.localDescription,
      });
    });

    socketRef.current.on('user-disconnected', (userId) => {
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }
      setPeers((prev) => {
        const newPeers = { ...prev };
        delete newPeers[userId];
        return newPeers;
      });
    });

    socketRef.current.on('webrtc-offer', async ({ caller, sdp }) => {
      if (!streamRef.current) return;
      const pc = createPeerConnection(caller, streamRef.current);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current?.emit('webrtc-answer', {
        target: caller,
        caller: myId.current,
        sdp: pc.localDescription,
      });
    });

    socketRef.current.on('webrtc-answer', async ({ caller, sdp }) => {
      const pc = peerConnections.current[caller];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    });

    socketRef.current.on('webrtc-ice-candidate', async ({ caller, candidate }) => {
      const pc = peerConnections.current[caller];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socketRef.current?.disconnect();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    streamRef.current = stream;
    if (myVideoRef.current && stream) {
      myVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  const joinRoom = async () => {
    if (!roomId) return;

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      setJoined(true);
      setSessionStart(Date.now());
      socketRef.current?.emit('join-room', roomId, myId.current);
    } catch (error) {
      console.error('Error accessing media devices.', error);
      alert('Could not access camera or microphone. Please check permissions.');
    }
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !micOn;
      setMicOn(!micOn);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !videoOn;
      setVideoOn(!videoOn);
    }
  };

  const leaveRoom = () => {
    if (sessionStart) {
      const elapsedMs = Date.now() - sessionStart;
      const minutes = Math.max(1, Math.round(elapsedMs / 60000));
      addStudyMinutes(minutes);
      setSessionStart(null);
    }

    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setJoined(false);
    setPeers({});
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};
    socketRef.current?.emit('leave-room');
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId) return;

    const message = {
      id: uuidv4(),
      text: newMessage,
      senderId: myId.current,
    };

    socketRef.current?.emit('send-message', roomId, message);
    setNewMessage('');
  };

  if (!joined) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-50 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-200 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Video className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Join a Live Class</h1>
          <p className="text-neutral-600 mb-8">Enter a room code to join your teacher and classmates.</p>

          <input
            type="text"
            placeholder="Enter Room Code (e.g., math-101)"
            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4 text-center text-lg font-medium tracking-wide"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
          />

          <button
            onClick={joinRoom}
            disabled={!roomId}
            className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Join Class
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-neutral-900 flex flex-col h-[calc(100vh-73px)] overflow-hidden">
      <div className="flex-1 flex p-4 gap-4">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          <div className="relative bg-neutral-800 rounded-2xl overflow-hidden border border-neutral-700 shadow-lg">
            <video
              ref={myVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium flex items-center gap-2">
              You {!micOn && <MicOff className="w-4 h-4 text-red-400" />}
            </div>
          </div>
          {Object.entries(peers).map(([peerId, peerStream]) => (
            <RemoteVideo key={peerId} stream={peerStream} userId={peerId} />
          ))}
        </div>

        <div className="w-80 bg-white rounded-2xl flex flex-col shadow-xl overflow-hidden">
          <div className="p-4 border-b border-neutral-200 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-neutral-500" />
            <h2 className="font-semibold text-neutral-900">Class Chat</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isMe = msg.senderId === myId.current;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-neutral-500 mb-1">
                    {isMe ? 'Me' : `Student ${msg.senderId.substring(0, 4)}`}
                  </span>
                  <div className={`p-3 rounded-2xl text-sm ${isMe ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-neutral-100 text-neutral-800 rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={sendMessage} className="p-4 border-t border-neutral-200">
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full px-4 py-2 bg-neutral-100 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
          </form>
        </div>
      </div>

      <div className="h-20 bg-neutral-900 border-t border-neutral-800 flex items-center justify-center gap-4 px-6">
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            micOn ? 'bg-neutral-700 hover:bg-neutral-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            videoOn ? 'bg-neutral-700 hover:bg-neutral-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button
          onClick={leaveRoom}
          className="w-16 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors ml-4"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
