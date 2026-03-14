// Jarvis Text-to-Speech Service
// Uses the browser's built-in Web Speech API

export interface SpeechOptions {
    rate?: number
    pitch?: number
    volume?: number
    voice?: SpeechSynthesisVoice | null
}

class SpeechService {
    private synth: SpeechSynthesis
    private voices: SpeechSynthesisVoice[] = []
    private isEnabled: boolean = true
    private onStateChange: ((enabled: boolean) => void) | null = null
    private selectedVoiceName: string | null = null

    constructor() {
        this.synth = window.speechSynthesis

        // Load voices (may be empty initially, need to wait)
        this.loadVoices()

        // Some browsers load voices asynchronously
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices()
        }
    }

    private loadVoices() {
        this.voices = this.synth.getVoices()
    }

    /**
     * Get all available voices
     */
    getVoices(): SpeechSynthesisVoice[] {
        return this.voices
    }

    /**
     * Get a voice by its name
     */
    getVoiceByName(name: string): SpeechSynthesisVoice | null {
        return this.voices.find(v => v.name === name) || null
    }

    /**
     * Get a preferred English voice (prefers natural-sounding voices)
     */
    getPreferredVoice(): SpeechSynthesisVoice | null {
        // Try to find a premium English voice
        const englishVoices = this.voices.filter(v => v.lang.startsWith('en'))

        // Prefer Google US English, Microsoft Zira, or similar natural voices
        const preferred = englishVoices.find(v =>
            v.name.includes('Google US English') ||
            v.name.includes('Microsoft Zira') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel') ||
            v.name.includes('Natural')
        )

        return preferred || englishVoices[0] || this.voices[0] || null
    }

    /**
     * Check if speech synthesis is supported
     */
    isSupported(): boolean {
        return 'speechSynthesis' in window
    }

    /**
     * Check if currently speaking
     */
    isSpeaking(): boolean {
        return this.synth.speaking
    }

    /**
     * Stop any current speech
     */
    stop(): void {
        if (this.synth.speaking) {
            this.synth.cancel()
        }
    }

    /**
     * Speak text with optional configuration
     */
    speak(text: string, options: SpeechOptions = {}): void {
        if (!this.isEnabled || !text) return

        // Stop any current speech first
        this.stop()

        const utterance = new SpeechSynthesisUtterance(text)

        // Determine which voice to use: explicit option > selected preference > default
        let voice = options.voice
        if (!voice) {
            voice = this.getSelectedVoice() || this.getPreferredVoice()
        }

        // Apply options
        utterance.rate = options.rate ?? 1.0
        utterance.pitch = options.pitch ?? 1.0
        utterance.volume = options.volume ?? 1.0
        utterance.voice = voice

        // Configure for JARVIS-like sound
        // Slightly lower pitch, measured pace for AI feel
        if (options.voice === undefined) {
            utterance.pitch = 0.9
            utterance.rate = 0.95
        }

        // Handle errors
        utterance.onerror = (event) => {
            console.warn('Speech synthesis error:', event.error)
        }

        this.synth.speak(utterance)
    }

    /**
     * Enable or disable speech
     */
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled
        if (!enabled) {
            this.stop()
        }
        this.onStateChange?.(enabled)
    }

    /**
     * Get current enabled state
     */
    getEnabled(): boolean {
        return this.isEnabled
    }

    /**
     * Subscribe to enabled state changes
     */
    subscribe(callback: (enabled: boolean) => void): () => void {
        this.onStateChange = callback
        return () => {
            this.onStateChange = null
        }
    }

    /**
     * Set the selected voice by name (for persistence)
     */
    setSelectedVoice(name: string | null): void {
        this.selectedVoiceName = name
    }

    /**
     * Get the currently selected voice
     */
    getSelectedVoice(): SpeechSynthesisVoice | null {
        if (!this.selectedVoiceName) return null
        return this.getVoiceByName(this.selectedVoiceName)
    }
}

// Export singleton instance
export const speechService = new SpeechService()
