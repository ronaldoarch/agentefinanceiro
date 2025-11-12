import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import moment from 'moment';
import './Chat.css';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Carregar histórico de mensagens
  useEffect(() => {
    loadHistory();
  }, []);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    try {
      const response = await axios.get('/api/chat/history');
      setMessages(response.data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        message: text
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.message,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. 😔',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendClick = () => {
    sendMessage(inputMessage);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const startRecording = async () => {
    try {
      console.log('🎤 Solicitando permissão do microfone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Permissão concedida!');
      
      // Tentar diferentes formatos de áudio para compatibilidade
      let options = { mimeType: 'audio/webm' };
      
      // Verificar formatos suportados
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
        console.log('📹 Usando formato: audio/webm;codecs=opus');
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
        console.log('📹 Usando formato: audio/webm');
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        options = { mimeType: 'audio/ogg;codecs=opus' };
        console.log('📹 Usando formato: audio/ogg;codecs=opus');
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
        console.log('📹 Usando formato: audio/mp4');
      } else {
        console.log('📹 Usando formato padrão');
        options = {};
      }
      
      const recorder = new MediaRecorder(stream, options);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log('📦 Chunk de áudio recebido:', e.data.size, 'bytes');
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        console.log('⏹️ Gravação parada. Total de chunks:', chunks.length);
        sendAudio(chunks, recorder.mimeType);
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      console.log('🔴 Gravação iniciada!');
    } catch (error) {
      console.error('❌ Erro ao iniciar gravação:', error);
      alert('Erro ao acessar microfone. Verifique as permissões do navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const sendAudio = async (chunks, mimeType) => {
    console.log('📤 Preparando envio de áudio...');
    console.log('📊 Total de chunks:', chunks.length);
    console.log('🗂️ Tipo MIME:', mimeType);
    
    // Calcular tamanho total
    const totalSize = chunks.reduce((acc, chunk) => acc + chunk.size, 0);
    console.log('📦 Tamanho total:', totalSize, 'bytes');
    
    if (totalSize === 0) {
      console.error('❌ Áudio vazio!');
      alert('Erro: áudio vazio. Tente gravar novamente.');
      return;
    }
    
    // Criar blob com o tipo MIME correto
    const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
    console.log('✅ Blob criado:', audioBlob.size, 'bytes');
    
    const formData = new FormData();
    
    // Determinar extensão do arquivo baseado no MIME type
    let extension = 'webm';
    if (mimeType.includes('ogg')) extension = 'ogg';
    else if (mimeType.includes('mp4')) extension = 'mp4';
    else if (mimeType.includes('wav')) extension = 'wav';
    
    const filename = `audio_${Date.now()}.${extension}`;
    formData.append('audio', audioBlob, filename);
    console.log('📁 Nome do arquivo:', filename);

    const userMessage = {
      role: 'user',
      content: '🎤 Processando áudio...',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      console.log('📡 Enviando áudio para o servidor...');
      const response = await axios.post('/api/chat/audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000 // 60 segundos de timeout
      });

      console.log('✅ Resposta recebida do servidor!');
      console.log('📝 Transcrição:', response.data.transcription);

      // Atualizar mensagem do usuário com transcrição
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'user',
          content: response.data.transcription,
          audio_transcription: response.data.transcription,
          created_at: new Date().toISOString()
        };
        return updated;
      });

      // Adicionar resposta da IA
      const assistantMessage = {
        role: 'assistant',
        content: response.data.message,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      console.log('🎉 Áudio processado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao enviar áudio:', error);
      console.error('❌ Detalhes:', error.response?.data || error.message);
      
      // Remover mensagem de "Processando áudio..."
      setMessages(prev => prev.slice(0, -1));
      
      let errorMsg = 'Desculpe, ocorreu um erro ao processar o áudio. 😔';
      
      if (error.response?.data?.error) {
        errorMsg += '\n\nDetalhes: ' + error.response.data.error;
      } else if (error.message) {
        errorMsg += '\n\nErro: ' + error.message;
      }
      
      const errorMessage = {
        role: 'assistant',
        content: errorMsg,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm('Deseja realmente limpar todo o histórico?')) {
      return;
    }

    try {
      await axios.delete('/api/chat/history');
      setMessages([]);
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      alert('Erro ao limpar histórico');
    }
  };

  const suggestions = [
    "Quanto gastei este mês?",
    "Quais são minhas despesas mais altas?",
    "Me dê dicas de economia",
    "Como registrar uma despesa?"
  ];

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>
          <span>💬</span>
          Chat com IA Financeira
        </h2>
        {messages.length > 0 && (
          <button className="clear-button" onClick={clearHistory}>
            🗑️ Limpar
          </button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-chat-icon">🤖</div>
            <h3>Olá! Sou seu Assistente Financeiro</h3>
            <p>
              Envie uma mensagem de texto ou áudio para começar!<br />
              Posso ajudar com transações, dicas financeiras e muito mais.
            </p>
            <div className="suggestions">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  {msg.content}
                </div>
                {msg.audio_transcription && (
                  <div className="transcription-badge">
                    🎤 Áudio transcrito
                  </div>
                )}
                <div className="message-time">
                  {moment(msg.created_at).format('HH:mm')}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="message-bubble">
                <div className="loading-dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            rows="1"
            disabled={isLoading || isRecording}
          />
          <div className="chat-buttons">
            <button
              className={`chat-button audio-button ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
            >
              {isRecording ? '⏹️' : '🎤'}
            </button>
            <button
              className="chat-button send-button"
              onClick={handleSendClick}
              disabled={!inputMessage.trim() || isLoading || isRecording}
              title="Enviar mensagem"
            >
              ✈️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;

