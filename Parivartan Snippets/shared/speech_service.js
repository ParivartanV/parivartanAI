/**
 * Parivartan Snippet - Audio Dictation & Speech-to-Text Service
 * Dual-Mode Engine:
 * 1. Web Speech API (streaming real-time recognition for Chrome/Edge)
 * 2. MediaRecorder + AI Transcriber (Gemini 1.5 Flash / Whisper) for Brave, Firefox & Linux
 */

class SpeechService {
  constructor() {
    this.recognition = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioStream = null;
    this.isRecording = false;
    this.activeMode = 'web_speech'; // 'web_speech' | 'ai'
    this.callbacks = {
      onResult: null,
      onStart: null,
      onEnd: null,
      onError: null
    };
    this.config = {
      language: 'en-US',
      autoPunctuation: true,
      continuous: true,
      preferAI: false,
      aiConfig: null
    };
    this.accumulatedText = '';
    this._init();
  }

  _init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
          this.isRecording = true;
          if (this.callbacks.onStart) this.callbacks.onStart();
        };

        this.recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalChunk = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalChunk += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalChunk) {
            let processedFinal = finalChunk;
            if (this.config.autoPunctuation) {
              processedFinal = this.formatVoicePunctuation(processedFinal);
            }
            if (this.accumulatedText && !this.accumulatedText.endsWith(' ') && !this.accumulatedText.endsWith('\n') && !processedFinal.startsWith(' ')) {
              this.accumulatedText += ' ';
            }
            this.accumulatedText += processedFinal;
          }

          let displayInterim = interimTranscript;
          if (this.config.autoPunctuation && displayInterim) {
            displayInterim = this.formatVoicePunctuation(displayInterim);
          }

          if (this.callbacks.onResult) {
            this.callbacks.onResult({
              finalText: this.accumulatedText,
              interimText: displayInterim,
              newFinalChunk: finalChunk ? this.formatVoicePunctuation(finalChunk) : ''
            });
          }
        };

        this.recognition.onerror = async (event) => {
          console.warn('[SpeechService] Recognition error:', event.error);
          this.isRecording = false;

          // If network error (Brave / Linux without Google Speech backend)
          if (event.error === 'network') {
            const userMsg = 'Brave/Linux blocks Google speech servers. Switching to AI Voice Transcriber... Speak your message now.';
            if (this.callbacks.onError) {
              this.callbacks.onError({ error: 'network', message: userMsg, willFallback: true });
            }
            // Auto fallback to MediaRecorder + AI Transcriber if AI is configured
            try {
              await this.startMediaRecorderMode();
            } catch (err) {
              if (this.callbacks.onError) {
                this.callbacks.onError({
                  error: 'ai-fallback-failed',
                  message: err.message || 'Could not start microphone recorder.'
                });
              }
            }
            return;
          }

          let userMessage = 'Microphone error occurred.';
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            userMessage = 'Microphone permission denied. Please allow microphone access in your browser.';
          } else if (event.error === 'no-speech') {
            userMessage = 'No speech detected. Dictation stopped.';
          } else if (event.error === 'audio-capture') {
            userMessage = 'No microphone device found on your system.';
          }

          if (this.callbacks.onError) {
            this.callbacks.onError({ error: event.error, message: userMessage });
          }
        };

        this.recognition.onend = () => {
          if (this.activeMode === 'web_speech') {
            this.isRecording = false;
            if (this.callbacks.onEnd) {
              this.callbacks.onEnd();
            }
          }
        };
      } catch (e) {
        console.error('[SpeechService] Error instantiating SpeechRecognition:', e);
      }
    }
  }

  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition || (navigator.mediaDevices && window.MediaRecorder));
  }

  getIsListening() {
    return this.isRecording;
  }

  formatVoicePunctuation(text) {
    if (!text) return '';
    let res = text;

    const replacements = [
      { regex: /\b(period|full stop)\b/gi, rep: '.' },
      { regex: /\b(comma)\b/gi, rep: ',' },
      { regex: /\b(question mark)\b/gi, rep: '?' },
      { regex: /\b(exclamation mark|exclamation point)\b/gi, rep: '!' },
      { regex: /\b(colon)\b/gi, rep: ':' },
      { regex: /\b(semicolon)\b/gi, rep: ';' },
      { regex: /\b(dash|hyphen)\b/gi, rep: '-' },
      { regex: /\b(new line|newline)\b/gi, rep: '\n' },
      { regex: /\b(new paragraph)\b/gi, rep: '\n\n' },
      { regex: /\b(open quote|open quotation)\b/gi, rep: '"' },
      { regex: /\b(close quote|close quotation)\b/gi, rep: '"' }
    ];

    replacements.forEach(r => {
      res = res.replace(r.regex, r.rep);
    });

    res = res.replace(/\s+([.,!?:;])/g, '$1');
    res = res.replace(/([.?!]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());

    return res;
  }

  async start(options = {}) {
    if (this.isRecording) {
      return await this.stop();
    }

    this.callbacks = {
      onResult: options.onResult || null,
      onStart: options.onStart || null,
      onEnd: options.onEnd || null,
      onError: options.onError || null
    };

    this.config.language = options.language || this.config.language || 'en-US';
    this.config.autoPunctuation = options.autoPunctuation !== false;
    this.config.preferAI = !!options.preferAI;
    this.config.aiConfig = options.aiConfig || null;
    this.accumulatedText = options.initialText || '';

    // If user prefers AI or Brave is detected or Web Speech is not present, use MediaRecorder mode
    const isBrave = !!(navigator.brave && typeof navigator.brave.isBrave === 'function');
    if (this.config.preferAI || isBrave || !this.recognition) {
      return await this.startMediaRecorderMode();
    }

    // Try Web Speech API
    try {
      this.activeMode = 'web_speech';
      this.recognition.lang = this.config.language;
      this.isRecording = true;
      this.recognition.start();
      return true;
    } catch (err) {
      console.warn('[SpeechService] Recognition start failed, trying MediaRecorder:', err);
      return await this.startMediaRecorderMode();
    }
  }

  async startMediaRecorderMode() {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      if (this.callbacks.onError) {
        this.callbacks.onError({
          error: 'not-supported',
          message: 'Audio recording is not supported in this browser.'
        });
      }
      return false;
    }

    try {
      this.activeMode = 'ai';
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioStream = stream;
      this.audioChunks = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg');

      this.mediaRecorder = new MediaRecorder(stream, { mimeType });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstart = () => {
        this.isRecording = true;
        if (this.callbacks.onStart) {
          this.callbacks.onStart({ mode: 'ai' });
        }
      };

      this.mediaRecorder.onstop = async () => {
        this.isRecording = false;
        if (this.audioStream) {
          this.audioStream.getTracks().forEach(t => t.stop());
          this.audioStream = null;
        }

        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        if (audioBlob.size < 1000) {
          if (this.callbacks.onEnd) this.callbacks.onEnd();
          return;
        }

        // Transcribe using AIService (Gemini or OpenAI)
        try {
          if (window.AIService && typeof window.AIService.transcribeAudio === 'function') {
            const aiConfig = this.config.aiConfig || { provider: 'gemini', model: 'gemini-1.5-flash', apiKey: '' };
            const transcribed = await window.AIService.transcribeAudio(audioBlob, aiConfig);
            if (transcribed && this.callbacks.onResult) {
              this.callbacks.onResult({
                finalText: (this.accumulatedText ? this.accumulatedText + ' ' : '') + transcribed,
                newFinalChunk: transcribed
              });
            }
          } else {
            throw new Error('AIService not available for transcription.');
          }
        } catch (transcribeErr) {
          console.error('[SpeechService] AI Transcription failed:', transcribeErr);
          if (this.callbacks.onError) {
            this.callbacks.onError({
              error: 'transcribe-failed',
              message: transcribeErr.message || 'AI transcription failed. Check your API key in Settings.'
            });
          }
        }

        if (this.callbacks.onEnd) {
          this.callbacks.onEnd();
        }
      };

      this.mediaRecorder.start(250);
      return true;
    } catch (micErr) {
      console.warn('[SpeechService] MediaRecorder mic error:', micErr);
      this.isRecording = false;
      if (this.callbacks.onError) {
        this.callbacks.onError({
          error: 'mic-denied',
          message: 'Microphone access denied. Please click the padlock/sliders in your address bar and allow Microphone.'
        });
      }
      return false;
    }
  }

  async stop() {
    this.isRecording = false;
    if (this.activeMode === 'ai' && this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (err) {}
      return false;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {}
    }
    return false;
  }

  async toggle(options = {}) {
    if (this.isRecording) {
      return await this.stop();
    } else {
      return await this.start(options);
    }
  }
}

// Attach globally
if (typeof window !== 'undefined') {
  window.SpeechService = new SpeechService();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SpeechService };
}
