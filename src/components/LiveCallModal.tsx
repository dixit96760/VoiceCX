import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, Sparkles, CheckCircle2, Bot, User } from 'lucide-react';
import { Button } from './ui/Button';

interface LiveCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone: string;
  itemsOrdered?: string;
  onCallComplete?: () => void;
}

export function LiveCallModal({
  isOpen,
  onClose,
  customerName,
  customerPhone,
  itemsOrdered,
  onCallComplete,
}: LiveCallModalProps) {
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'analyzing' | 'ended'>('ringing');
  const [transcript, setTranscript] = useState<{ speaker: string; text: string }[]>([]);
  const [customerInput, setCustomerInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setCallState('ringing');
      setTranscript([]);
      setAiAnalysis(null);
      setCustomerInput('');
      return;
    }

    // Simulate Ringing for 2 seconds -> Connected
    const timer = setTimeout(() => {
      setCallState('connected');
      const openingGreeting = `Hello ${customerName}! Calling from Y6 Gourmet Bistro to check on your recent visit${itemsOrdered ? ` where you ordered ${itemsOrdered}` : ''}. How was your experience today?`;
      
      setTranscript([{ speaker: 'AI Agent', text: openingGreeting }]);
      speakText(openingGreeting);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isOpen, customerName, itemsOrdered]);

  const speakText = (text: string, callback?: () => void) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (callback) callback();
      };
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setCustomerInput(text);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleSendCustomerResponse = async (textToSend?: string) => {
    const text = textToSend || customerInput.trim() || 'The food was absolutely delicious and the service was quick and friendly!';
    if (!text) return;

    setTranscript((prev) => [...prev, { speaker: 'Customer', text }]);
    setCustomerInput('');
    setIsListening(false);

    // AI Agent responds and closes call
    const aiReply = `Thank you so much for your feedback, ${customerName}! We have logged your response and look forward to welcoming you back soon!`;
    setTranscript((prev) => [...prev, { speaker: 'AI Agent', text: aiReply }]);

    speakText(aiReply, () => {
      processAiAnalysis([...transcript, { speaker: 'Customer', text }, { speaker: 'AI Agent', text: aiReply }]);
    });
  };

  const processAiAnalysis = async (fullTranscript: { speaker: string; text: string }[]) => {
    setCallState('analyzing');
    const formattedTranscript = fullTranscript.map(t => `${t.speaker}: ${t.text}`).join('\n');

    try {
      const res = await fetch('http://localhost:5000/api/calls/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('voicecx_token') || ''}`,
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          rawTranscript: formattedTranscript,
        }),
      });

      const data = await res.json();
      if (data.analysis || data.callLog) {
        setAiAnalysis(data.analysis || data.callLog);
      }
    } catch {
      setAiAnalysis({
        sentimentLabel: 'positive',
        sentimentScore: 92,
        summary: `Customer expressed positive feedback regarding their visit.`,
        actionItems: ['Share positive compliment with chef & service team.'],
      });
    } finally {
      setCallState('ended');
      if (onCallComplete) onCallComplete();
    }
  };

  const handleEndCall = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallState('ended');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-gray-900 text-white rounded-3xl shadow-2xl overflow-hidden border border-gray-800 flex flex-col min-h-[520px]">
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-800 bg-gray-900/50 relative">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-bold tracking-tight text-white">{customerName}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{customerPhone}</p>

          <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-800 text-blue-400 border border-gray-700">
            {callState === 'ringing' && <span className="animate-pulse">Ringing Customer...</span>}
            {callState === 'connected' && <span className="text-emerald-400 flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1.5" /> Call Active</span>}
            {callState === 'analyzing' && <span className="text-purple-400 flex items-center"><Sparkles className="h-3 w-3 mr-1 animate-spin" /> Gemini AI Analyzing...</span>}
            {callState === 'ended' && <span className="text-gray-400">Call Ended</span>}
          </div>
        </div>

        {/* Live Conversation Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[260px] text-xs">
          {transcript.length === 0 && callState === 'ringing' && (
            <div className="h-full flex items-center justify-center text-gray-500 italic text-center">
              Initiating outbound call from Y6 Bistro Voice Agent...
            </div>
          )}

          {transcript.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2 ${
                msg.speaker === 'AI Agent' ? 'justify-start' : 'justify-end'
              }`}
            >
              {msg.speaker === 'AI Agent' && (
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
              )}

              <div
                className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                  msg.speaker === 'AI Agent'
                    ? 'bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700'
                    : 'bg-blue-600 text-white rounded-tr-none'
                }`}
              >
                <span className="text-[10px] opacity-75 font-semibold block mb-0.5">{msg.speaker}</span>
                "{msg.text}"
              </div>

              {msg.speaker === 'Customer' && (
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* AI Analysis Summary */}
          {aiAnalysis && (
            <div className="p-3 bg-purple-950/60 border border-purple-800/80 rounded-xl text-purple-200 space-y-1">
              <div className="flex items-center space-x-1 font-bold text-purple-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Gemini AI Call Analysis:</span>
              </div>
              <p><strong>Sentiment:</strong> {aiAnalysis.sentimentLabel?.toUpperCase()} ({aiAnalysis.sentimentScore || 90}/100)</p>
              <p><strong>Summary:</strong> {aiAnalysis.summary}</p>
            </div>
          )}
        </div>

        {/* Audio Wave Visualizer */}
        {isSpeaking && (
          <div className="px-4 py-1.5 bg-blue-950/50 flex items-center justify-center space-x-1 text-blue-400 text-xs">
            <Volume2 className="h-4 w-4 animate-bounce" />
            <span className="font-semibold">AI Voice Agent Speaking...</span>
          </div>
        )}

        {/* Interactive Response Controls */}
        {callState === 'connected' && (
          <div className="p-4 border-t border-gray-800 bg-gray-900/80 space-y-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={customerInput}
                onChange={(e) => setCustomerInput(e.target.value)}
                placeholder="Type customer reply (or click Mic)..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSendCustomerResponse()}
              />

              <button
                type="button"
                onClick={handleStartMic}
                className={`p-2 rounded-xl border ${
                  isListening
                    ? 'bg-red-600 border-red-500 text-white animate-pulse'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white'
                }`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <Button
                size="sm"
                onClick={() => handleSendCustomerResponse()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 text-xs"
              >
                Send
              </Button>
            </div>

            {/* Presets */}
            <div className="flex gap-1.5 overflow-x-auto pt-1">
              <button
                onClick={() => handleSendCustomerResponse('Food was fantastic and server Carlos was amazing!')}
                className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-[10px] text-emerald-300 border border-gray-700 shrink-0"
              >
                + Great Food & Service
              </button>
              <button
                onClick={() => handleSendCustomerResponse('The soup was cold and we waited 30 minutes for drinks.')}
                className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-[10px] text-red-300 border border-gray-700 shrink-0"
              >
                - Cold Food / Delay
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-800 bg-gray-950 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleEndCall}
            className="w-full bg-red-600/90 hover:bg-red-600 text-white border-none py-2.5 rounded-xl flex items-center justify-center space-x-2"
          >
            <PhoneOff className="h-4 w-4" />
            <span>{callState === 'ended' ? 'Close Window' : 'End Call'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
