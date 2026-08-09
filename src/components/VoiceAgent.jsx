import React, { useState, useRef } from 'react';


export default function VoiceAgent() {
  const [status, setStatus] = useState('Disconnected');
  const [responseText, setResponseText] = useState('None');
  const [isConnected, setIsConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false);

  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Connect to FastAPI WebSocket backend (running on port 8001)
  const connectWebSocket = () => {
    // Change the endpoint URL if your backend uses a different WebSocket path
    wsRef.current = new WebSocket('ws://localhost:8001/ws'); 

    wsRef.current.onopen = () => {
      setStatus('Connected (Idle)');
      setIsConnected(true);
    };

    wsRef.current.onmessage = (event) => {
      setResponseText(event.data);
    };

    wsRef.current.onclose = () => {
      setStatus('Disconnected');
      setIsConnected(false);
      setIsTalking(false);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('Error connecting');
    };
  };

  const startTalking = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          // Send audio chunk over WebSocket if connected
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(event.data);
          }
        }
      };

      mediaRecorderRef.current.start(250); // Send chunks every 250ms
      setIsTalking(true);
      setStatus('Listening / Talking...');
    } catch (err) {
      console.error('Microphone access denied:', err);
      setStatus('Mic permission denied');
    }
  };

  const stopTalking = () => {
    if (mediaRecorderRef.current && isTalking) {
      mediaRecorderRef.current.stop();
      // Stop all microphone tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsTalking(false);
    setStatus('Connected (Idle)');
  };

  return (
    <div className="voice-agent-container" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Voice Agent Control Center</h2>
      
      <div className="controls" style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
        <button 
          onClick={connectWebSocket} 
          disabled={isConnected}
          style={{ padding: '0.5rem 1rem', cursor: isConnected ? 'not-allowed' : 'pointer' }}
        >
          Connect
        </button>
        <button 
          onClick={startTalking} 
          disabled={!isConnected || isTalking}
          style={{ padding: '0.5rem 1rem', cursor: (!isConnected || isTalking) ? 'not-allowed' : 'pointer' }}
        >
          Start Talking
        </button>
        <button 
          onClick={stopTalking} 
          disabled={!isTalking}
          style={{ padding: '0.5rem 1rem', cursor: !isTalking ? 'not-allowed' : 'pointer' }}
        >
          Stop Talking
        </button>
      </div>

      <p><strong>Status:</strong> <span>{status}</span></p>
      <p><strong>Response:</strong> <span>{responseText}</span></p>
    </div>
  );
}
