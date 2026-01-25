import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GeminiGeneratedWord } from "../types";
import { logApiUsage } from "./usage-tracking";

// Note: In a real production app, API calls should go through a backend proxy
// to protect the API KEY. For this demo, we assume the environment variable is available.
const API_KEY = import.meta.env.VITE_API_KEY || ''; 

// We handle the case where the user hasn't set the key yet gracefully in the UI.
const getClient = () => {
    if (!API_KEY) {
        throw new Error("API Key is missing. Please set VITE_API_KEY in your .env file");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
};

export const generateWordMetadata = async (promptContext: string = ""): Promise<GeminiGeneratedWord> => {
    console.log("=== Starting word generation ===");
    console.log("API Key present:", !!API_KEY);
    
    const ai = getClient();
    const modelName = "gemini-2.0-flash-exp";
    
    const prompt = `Create a brand new, made-up word that sounds like it could be real English but isn't. 
    It should be funny, whimsical, or slightly absurd. 
    Context or theme: ${promptContext || 'General absurdity'}.
    
    Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
    {
      "word": "the made-up word",
      "pronunciation": "phonetic pronunciation like vibe-LIV-ee-on (NOT IPA)",
      "partOfSpeech": "noun/verb/adjective/etc",
      "definition": "a funny definition",
      "example": "a usage example in quotes",
      "origin": "fake etymological origin"
    }`;

    try {
        console.log("Generating content...");
        // Using gemini-2.0-flash which works with the free tier
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: prompt }] }]
        });
        
        console.log("Response received:", response);

        const text = response.text;
        console.log("Response text:", text);
        
        if (!text) throw new Error("No text returned from Gemini");
        
        // Try to extract JSON if it's wrapped in markdown
        let jsonText = text.trim();
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        }
        
        // Log successful API usage
        logApiUsage('text', modelName, true);
        
        return JSON.parse(jsonText) as GeminiGeneratedWord;
    } catch (error: any) {
        console.error("=== FULL ERROR OBJECT ===");
        console.error(error);
        console.error("Error message:", error?.message);
        
        // Log failed API usage
        logApiUsage('text', modelName, false);
        
        throw new Error(`Gemini API Error: ${error?.message || 'Unknown error'}`);
    }
};

export const generateIllustration = async (word: string, definition: string): Promise<string> => {
    const ai = getClient();
    const modelName = 'imagen-3.0-generate-001';
    
    try {
        // Try using Imagen model if available in your API
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `A funny, hand-drawn style, pen and ink illustration representing the word "${word}". Definition: ${definition}. White background, minimalistic, dictionary style sketch.`,
        });

        // Extract image
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                // Log successful image generation
                logApiUsage('image', modelName, true);
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image in response");
    } catch (error: any) {
        console.error("Image generation error:", error?.message || error);
        
        // Log failed image generation
        logApiUsage('image', modelName, false);
        
        // Return a placeholder data URL for a simple colored square as fallback
        // This allows the app to work even without image generation
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPicgKyB3b3JkICsgJzwvdGV4dD48L3N2Zz4=';
    }
};

export const generatePronunciation = async (word: string): Promise<string> => {
    const ai = getClient();
    const modelName = "gemini-2.5-flash-preview-tts";
    
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: `Say the word clearly: ${word}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio generated");
        
        // Log successful audio generation
        logApiUsage('audio', modelName, true);
        
        return base64Audio;
    } catch (error: any) {
        console.warn("Audio generation not available (may require paid tier):", error?.message);
        
        // Log failed audio generation
        logApiUsage('audio', modelName, false);
        
        // Return empty string - audio is optional
        return '';
    }
};

// Audio Helper to play the PCM data from Gemini
export const playAudio = async (base64Audio: string) => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        // Decode base64
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Decode PCM
        const dataInt16 = new Int16Array(bytes.buffer);
        const frameCount = dataInt16.length; // Mono
        const buffer = audioContext.createBuffer(1, frameCount, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i] / 32768.0;
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
    } catch (e) {
        console.error("Audio playback error:", e);
    }
};