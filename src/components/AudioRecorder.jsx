import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Upload, Loader2 } from "lucide-react";
import { iaTranscribeAudio } from "../services/api";

export default function AudioRecorder({ onTranscribeComplete, onError }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Limpa timer se desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Inicia gravação com MediaRecorder
  async function startRecording() {
    audioChunksRef.current = [];
    setRecordingSeconds(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Detecta formato compatível com o navegador atual (Safari/iOS vs Chrome/Firefox)
      let selectedMimeType = "audio/webm";
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          selectedMimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          selectedMimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          selectedMimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/aac")) {
          selectedMimeType = "audio/aac";
        }
      }

      const options = selectedMimeType ? { mimeType: selectedMimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      const recordingMimeType = mediaRecorder.mimeType || selectedMimeType || "audio/webm";

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recordingMimeType });
        await processAudioBlob(audioBlob, recordingMimeType);
        // Para todas as tracks do stream para liberar o microfone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250); // Manda pedaços a cada 250ms
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      if (onError) onError("Permissão para usar o microfone foi recusada ou não disponível.");
    }
  }

  // Para gravação
  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }

  // Processa blob e chama IA
  async function processAudioBlob(blob, mimeType) {
    setLoading(true);
    try {
      const result = await iaTranscribeAudio(blob, mimeType);
      if (onTranscribeComplete) {
        onTranscribeComplete(result);
      }
    } catch (err) {
      console.error("Erro no processamento de transcrição de áudio:", err);
      if (onError) onError(err.message || "Erro ao transcrever áudio com IA.");
    } finally {
      setLoading(false);
    }
  }

  // Converte blob para base64
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Manipulador de upload de arquivo convencional
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limite de 25MB (limite suportado pela API do Whisper)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      if (onError) onError("O arquivo de áudio excede o limite máximo de 25 MB do Whisper. Por favor, envie um trecho menor ou áudio comprimido.");
      e.target.value = "";
      return;
    }

    let mimeType = file.type || "audio/mp3";

    // Correção para alguns navegadores
    if (file.name.endsWith(".m4a") && (!mimeType || mimeType === "")) {
      mimeType = "audio/x-m4a";
    }

    await processAudioBlob(file, mimeType);
    e.target.value = ""; // Reseta o input
  }

  // Formata o timer
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 py-1.5 px-3 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium">
        <Loader2 size={14} className="animate-spin text-slate-400 shrink-0" />
        <span>Processando gravação...</span>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-3 py-1.5 px-3 rounded-md border border-rose-200 bg-rose-50 text-xs font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
          <span className="text-rose-700 font-mono">{formatTime(recordingSeconds)}</span>
        </div>
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-1 text-rose-700 hover:text-rose-800 hover:bg-rose-100/50 py-0.5 px-1.5 rounded transition-colors"
        >
          <Square size={12} fill="currentColor" /> Parar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={startRecording}
        className="flex items-center gap-1.5 text-xs border border-slate-300 bg-white text-slate-700 px-2.5 py-1.5 rounded-md hover:bg-slate-50 font-medium transition-colors cursor-pointer"
        title="Gravar áudio direto usando o microfone"
      >
        <Mic size={14} className="text-rose-500" />
        Gravar
      </button>

      <label className="flex items-center gap-1.5 text-xs border border-slate-300 bg-white text-slate-700 px-2.5 py-1.5 rounded-md hover:bg-slate-50 font-medium transition-colors cursor-pointer">
        <Upload size={14} className="text-slate-500" />
        Upload
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </label>
    </div>
  );
}
