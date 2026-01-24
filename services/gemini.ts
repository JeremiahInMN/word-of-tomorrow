import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GeminiGeneratedWord } from "../types";

// Note: In a real production app, API calls should go through a backend proxy
// to protect the API KEY. For this demo, we assume the environment variable is available.
const API_KEY = process.env.API_KEY || ''; 

// We handle the case where the user hasn't set the key yet gracefully in the UI.
const getClient = () => {
    if (!API_KEY) {
        throw new Error("API Key is missing. Please set REACT_APP_API_KEY or process.env.API_KEY");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
};

export const generateWordMetadata = async (promptContext: string = ""): Promise<GeminiGeneratedWord> => {
    const ai = getClient();
    
    const prompt = `Create a brand new, made-up word that sounds like it could be real English but isn't. 
    It should be funny, whimsical, or slightly absurd. 
    Context or theme: ${promptContext || 'General absurdity'}.
    Provide the word, simple phonetic pronunciation (use easy-to-read respelling like "vibe-LIV-ee-on", do NOT use IPA symbols), part of speech, a funny definition, a usage example, and a fake etymological origin.`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING },
                    pronunciation: { type: Type.STRING },
                    partOfSpeech: { type: Type.STRING },
                    definition: { type: Type.STRING },
                    example: { type: Type.STRING },
                    origin: { type: Type.STRING },
                },
                required: ["word", "pronunciation", "partOfSpeech", "definition", "example", "origin"]
            }
        }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from Gemini");
    
    return JSON.parse(text) as GeminiGeneratedWord;
};

export const generateIllustration = async (word: string, definition: string): Promise<string> => {
    const ai = getClient();
    
    // Using gemini-2.5-flash-image for generation as requested
    // Note: The prompt asks for "funny illustration"
    const prompt = `A funny, hand-drawn style, pen and ink illustration representing the word "${word}". Definition: ${definition}. White background, minimalistic, dictionary style sketch.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: prompt,
        config: {
            imageConfig: {
                aspectRatio: "1:1",
            }
        }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image generated");
};

export const generatePronunciation = async (word: string): Promise<string> => {
    const ai = getClient();
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
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
    return base64Audio;
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