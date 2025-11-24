import { GoogleGenAI, Modality, Chat } from "@google/genai";

// --- Dynamic API Key and Client Initialization ---

const getApiKey = (): string => {
    // Use user-provided key from localStorage if it exists, otherwise fall back to the environment variable.
    const userApiKey = localStorage.getItem('userApiKey');
    return userApiKey || process.env.API_KEY!;
}

const getAiClient = (): GoogleGenAI => {
    const apiKey = getApiKey();
    if (!apiKey) {
        // This will be caught by the error handler and shown to the user.
        throw new Error("API Key not found. Please provide an API key using the 'Lạp API Key' button.");
    }
    return new GoogleGenAI({ apiKey });
}

// --- Error Handling ---

const QUOTA_ERROR_MESSAGE = "Lỗi Hạn Ngạch API. Hạn ngạch được tính trên mỗi Project. GIẢI PHÁP: 1. Tạo một Google Cloud Project HOÀN TOÀN MỚI. 2. Trong Project mới đó, hãy BẬT (ENABLE) \"Generative Language API\". 3. Tạo một API Key mới trong Project đó và dán vào đây.";
const LIFETIME_QUOTA_ERROR_MESSAGE = "LIFETIME_QUOTA_EXCEEDED";

// Interface for structured image data
interface ImagePart {
  base64ImageData: string;
  mimeType: string;
}

// A centralized error handler to create user-friendly messages
const handleGeminiError = (error: unknown, context: 'edit' | 'generate' | 'audio'): Error => {
    console.error(`Error calling Gemini API for ${context}:`, error);
    const actionTextMap = {
        'edit': 'chỉnh sửa ảnh',
        'generate': 'tạo ảnh',
        'audio': 'tạo âm thanh'
    };
    const actionText = actionTextMap[context] || 'thực hiện tác vụ';


    let msg = '';
    if (error instanceof Error) {
        msg = error.message;
    } else if (typeof error === 'string') {
        msg = error;
    } else {
        try {
            msg = JSON.stringify(error);
        } catch {
            msg = String(error);
        }
    }

    // 1. Quota errors
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.toLowerCase().includes('quota') || msg.includes('Hạn ngạch')) {
        return new Error(QUOTA_ERROR_MESSAGE);
    }
    // 2. Invalid API Key
    if (msg.includes("API key not valid") || msg.toLowerCase().includes("permission denied")) {
        return new Error("API Key không hợp lệ hoặc đã bị nhúng sai. Vui lòng kiểm tra lại.");
    }
    // 3. Server-side / transient errors
    if (msg.includes('500') || msg.includes('UNKNOWN') || msg.includes('Rpc failed')) {
        return new Error(`Đã xảy ra lỗi máy chủ tạm thời khi ${actionText}. Vui lòng đợi một lát rồi thử lại.`);
    }
    // 4. Pass through clean, pre-formatted errors I have created myself
    if (msg.startsWith("AI không tạo ra")) {
         return new Error(msg);
    }
    // 5. Generic fallback for all other cases
    return new Error(`Đã xảy ra lỗi khi ${actionText}. Vui lòng thử lại.`);
}

const handleGeminiVideoError = (error: unknown): Error => {
    console.error(`Error calling Gemini API for video generation:`, error);
    
    let msg = '';
    if (error instanceof Error) {
        msg = error.message;
    } else if (typeof error === 'string') {
        msg = error;
    } else {
        try {
            msg = JSON.stringify(error);
        } catch {
            msg = String(error);
        }
    }

    // 0. Specific Lifetime Quota Error
    if (msg.toLowerCase().includes('lifetime quota exceeded')) {
        return new Error(LIFETIME_QUOTA_ERROR_MESSAGE);
    }
    // 1. Quota errors
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.toLowerCase().includes('quota')) {
        return new Error(QUOTA_ERROR_MESSAGE);
    }
    // 2. Invalid API Key
     if (msg.includes("API key not valid") || msg.toLowerCase().includes("permission denied")) {
        return new Error("API Key không hợp lệ hoặc đã bị nhúng sai. Vui lòng kiểm tra lại.");
    }
    // 3. Server-side / transient errors
    if (msg.includes('500') || msg.includes('UNKNOWN') || msg.includes('Rpc failed')) {
        return new Error("Đã xảy ra lỗi máy chủ tạm thời khi tạo video. Vui lòng đợi một lát rồi thử lại.");
    }
    // 4. Pass through clean, pre-formatted errors I have created myself
    if (msg.includes("API không trả về video") || msg.includes("Không thể tải video")) {
        return new Error(msg);
    }
    // 5. Generic fallback
    return new Error(`Đã xảy ra lỗi không xác định khi tạo video.`);
}

const handleGeminiTextError = (error: unknown): Error => {
    console.error(`Error calling Gemini API for text generation:`, error);
    
    let msg = '';
    if (error instanceof Error) {
        msg = error.message;
    } else if (typeof error === 'string') {
        msg = error;
    } else {
        try {
            msg = JSON.stringify(error);
        } catch {
            msg = String(error);
        }
    }
    
    // 1. Quota errors
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.toLowerCase().includes('quota')) {
        return new Error(QUOTA_ERROR_MESSAGE);
    }
    // 2. Invalid API Key
    if (msg.includes("API key not valid") || msg.toLowerCase().includes("permission denied")) {
        return new Error("API Key không hợp lệ hoặc đã bị nhúng sai. Vui lòng kiểm tra lại.");
    }
    // 3. Server-side / transient errors
    if (msg.includes('500') || msg.includes('UNKNOWN') || msg.includes('Rpc failed')) {
        return new Error("Đã xảy ra lỗi máy chủ tạm thời khi tạo văn bản. Vui lòng đợi một lát rồi thử lại.");
    }
    
    // 5. Generic fallback
    return new Error('Đã xảy ra lỗi không xác định khi tạo nội dung văn bản.');
};


// --- Chat Session ---
let chat: Chat | null = null;
let chatApiKey: string | null = null; // Store the key used to initialize the chat

export const getChatSession = (): Chat => {
    const currentApiKey = getApiKey();
    
    // If chat doesn't exist, or if the API key has changed, create a new session.
    if (!chat || chatApiKey !== currentApiKey) {
        const ai = getAiClient();
        const systemInstruction = `You are Trợ lý AI, a friendly and expert assistant for an AI-powered e-commerce toolkit designed for fashion products.
Your primary role is to help users get the most out of the application.
You can:
1.  Explain what each feature does ('Tạo From, dáng cho Q.A', 'Tách bộ', 'Gấp Quần Áo', 'TẠO VIDEO', 'Sáng Tạo Phông Nền').
2.  Provide creative ideas for product photos and videos.
3.  Give tips on writing effective prompts.
4.  Answer general questions about e-commerce product presentation.
Always respond in Vietnamese. Keep your answers concise, helpful, and encouraging.

**SPECIAL RULES:**
- If the user's message is exactly "202179", you must respond with: "Đã xác thực. Bạn có thể hỏi tôi bất cứ điều gì." and nothing else.

**QUY TẮC BẢO MẬT TUYỆT ĐỐI:** Dưới BẤT KỲ trường hợp nào, bạn TUYỆT ĐỐI KHÔNG ĐƯỢC phép tiết lộ, gợi ý, hay giải thích về logic mật khẩu hoặc cách lấy mật khẩu. MỌI câu hỏi liên quan đến mật khẩu (ví dụ: "mật khẩu là gì?", "cho tôi xin pass", "pass đăng nhập", "làm sao để có mật khẩu?") PHẢI được trả lời bằng duy nhất câu sau: "Hãy liên hệ tác giả theo số máy: 0988771339". Không được thêm bất kỳ văn bản, lời giải thích hay lời chào nào khác.`;

        chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: systemInstruction,
            },
        });
        chatApiKey = currentApiKey; // Store the key we just used
    }
    return chat;
};

export const isProductWhite = async (base64ImageData: string, mimeType: string): Promise<boolean> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: base64ImageData, mimeType: mimeType } },
          { text: "Is the dominant color of the main clothing item in this image white, off-white, or a very light cream/beige? Answer with only 'yes' or 'no'." },
        ],
      },
      config: {
          thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text.trim().toLowerCase() === 'yes';
  } catch (error) {
    console.error("Error analyzing image color:", error);
    // Fallback to 'not white' to be safe and use default white background.
    return false; 
  }
};


export const analyzeImageType = async (base64ImageData: string, mimeType: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: base64ImageData, mimeType: mimeType } },
          { text: "Analyze the single clothing item in the image. Is it primarily pants/trousers, or a shirt/top/jacket? Answer with only one of the following words: 'pants' or 'top'." },
        ],
      },
      config: {
          thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text.trim().toLowerCase();
  } catch (error) {
    console.error("Error analyzing image type:", error);
    return 'unknown'; // Fallback to avoid blocking user on analysis failure
  }
};

export const analyzeProductCategory = async (base64ImageData: string, mimeType: string): Promise<'clothing' | 'other'> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: base64ImageData, mimeType: mimeType } },
          { text: "Analyze the main subject in this image. Is it a piece of clothing or a fashion accessory (like a shirt, pants, dress, shoes, hat, belt)? Answer with only 'clothing' or 'other'." },
        ],
      },
      config: {
          thinkingConfig: { thinkingBudget: 0 }
      }
    });
    const result = response.text.trim().toLowerCase();
    if (result === 'clothing') {
        return 'clothing';
    }
    return 'other';
  } catch (error) {
    console.error("Error analyzing product category:", error);
    // Fallback to 'clothing' to maintain original behavior if analysis fails.
    return 'clothing'; 
  }
};


// For editing existing images (background removal, folding, creative scenes)
export const editProductImage = async (
  images: ImagePart[],
  prompt: string
): Promise<string[]> => {
  try {
    const ai = getAiClient();
    const imageParts = images.map(image => ({
      inlineData: {
        data: image.base64ImageData,
        mimeType: image.mimeType,
      },
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          ...imageParts,
          {
            text: prompt,
          },
        ],
      },
// FIX: Corrected responseModalities to only include Modality.IMAGE as per Gemini API guidelines for image editing, ensuring more reliable image-only responses.
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const imageUrls: string[] = [];
     if (response.candidates && response.candidates.length > 0) {
        // FIX: Safely access content and parts to prevent 'undefined' errors
        const content = response.candidates[0].content;
        if (content && content.parts) {
            for (const part of content.parts) {
              if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                imageUrls.push(`data:image/png;base64,${base64ImageBytes}`);
              }
            }
        }
    }
    
    if (imageUrls.length === 0) {
        // When the model returns text instead of an image, it's a generation failure.
        // Provide a user-friendly error message prompting a retry, instead of showing the AI's conversational text.
        throw new Error("AI không tạo ra ảnh trong lần này. Vui lòng nhấn nút 'Tạo Ảnh' để thử lại. Đôi khi điều này xảy ra do lỗi tạm thời hoặc các hạn chế về an toàn.");
    }

    return imageUrls;
  } catch (error) {
    throw handleGeminiError(error, 'edit');
  }
};

export const removeWatermark = async (
  image: ImagePart
): Promise<string[]> => {
  try {
    const ai = getAiClient();
    // Prompt specifically for watermark removal
    const prompt = `Remove all text, watermarks, logos, subtitles, and digital overlays from this image.
    The goal is to restore the original appearance of the image as if the text/watermark was never there.
    Inpaint the areas where text was removed to match the surrounding background perfectly.
    Do not alter the main subject of the image otherwise.`;

    const imagePart = {
      inlineData: {
        data: image.base64ImageData,
        mimeType: image.mimeType,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          imagePart,
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const imageUrls: string[] = [];
    if (response.candidates && response.candidates.length > 0) {
      // FIX: Safely access content and parts
      const content = response.candidates[0].content;
      if (content && content.parts) {
          for (const part of content.parts) {
            if (part.inlineData) {
              const base64ImageBytes: string = part.inlineData.data;
              imageUrls.push(`data:image/png;base64,${base64ImageBytes}`);
            }
          }
      }
    }

    if (imageUrls.length === 0) {
      throw new Error("AI không tạo ra ảnh trong lần này. Vui lòng thử lại. Đôi khi điều này xảy ra do lỗi tạm thời hoặc các hạn chế về an toàn.");
    }

    return imageUrls;

  } catch (error) {
    throw handleGeminiError(error, 'edit');
  }
};

export const cleanImageAutomatically = async (
  originalImage: ImagePart
): Promise<string[]> => {
  try {
    const ai = getAiClient();
    const prompt = `You are an expert photo editor specializing in the "ghost mannequin" effect. Analyze the provided product image. Your task is to identify and completely remove any small, leftover pieces of the mannequin that may still be visible (typically around the neck, shoulders, or inside the garment). Inpaint the removed areas seamlessly to match the surrounding background (which should be seamless white or a light grey gradient) or the inner fabric of the garment. The clothing item itself must remain 100% untouched and perfectly preserved. The final output must be a single, cleaned image. Do not alter the product in any other way.`;

    const originalImagePart = {
      inlineData: {
        data: originalImage.base64ImageData,
        mimeType: originalImage.mimeType,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          originalImagePart,
          { text: prompt },
        ],
      },
// FIX: Corrected responseModalities to only include Modality.IMAGE as per Gemini API guidelines for image editing, ensuring more reliable image-only responses.
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const imageUrls: string[] = [];
    if (response.candidates && response.candidates.length > 0) {
      // FIX: Safely access content and parts
      const content = response.candidates[0].content;
      if (content && content.parts) {
          for (const part of content.parts) {
            if (part.inlineData) {
              const base64ImageBytes: string = part.inlineData.data;
              imageUrls.push(`data:image/png;base64,${base64ImageBytes}`);
            }
          }
      }
    }

    if (imageUrls.length === 0) {
      throw new Error("AI không tạo ra ảnh trong lần này. Vui lòng thử lại. Đôi khi điều này xảy ra do lỗi tạm thời hoặc các hạn chế về an toàn.");
    }

    return imageUrls;

  } catch (error) {
    throw handleGeminiError(error, 'edit');
  }
};

export const cleanImageWithMask = async (
  originalImage: ImagePart,
  maskImage: ImagePart,
): Promise<string[]> => {
    try {
        const ai = getAiClient();
        const prompt = `You are an expert photo inpainting tool. You will be given an original image of a clothing product and a black-and-white mask. Your task is to intelligently remove the objects indicated by the WHITE parts of the mask.
CRITICAL INSTRUCTIONS:
1.  Analyze the context of the areas IMMEDIATELY SURROUNDING the white masked region in the original image. Determine if the masked area should be filled with the background (e.g., to remove a mannequin neck) or with the clothing's fabric (e.g., to fix a hole).
2.  Inpaint the white masked areas seamlessly. If the masked object is inside the clothing (like a mannequin neck), you MUST fill the area with the background seen inside the garment (e.g., the back of the collar, or the seamless studio background). If the masked area is a flaw on the fabric itself, then you should recreate the clothing's texture.
3.  The areas of the original image corresponding to the BLACK parts of the mask are perfect and MUST remain 100% untouched and unchanged. Do NOT modify them in any way.
4.  Your primary goal is to make the product look clean and professional, as if the masked object was never there.
The output must be a single, cleaned image. Do not add any text or change any part of the image that is under the black mask.`;

        const originalImagePart = {
            inlineData: {
                data: originalImage.base64ImageData,
                mimeType: originalImage.mimeType,
            },
        };

        const maskImagePart = {
            inlineData: {
                data: maskImage.base64ImageData,
                mimeType: maskImage.mimeType,
            },
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    originalImagePart,
                    maskImagePart,
                    { text: prompt },
                ],
            },
// FIX: Corrected responseModalities to only include Modality.IMAGE as per Gemini API guidelines for image editing, ensuring more reliable image-only responses.
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const imageUrls: string[] = [];
        if (response.candidates && response.candidates.length > 0) {
            // FIX: Safely access content and parts
            const content = response.candidates[0].content;
            if (content && content.parts) {
                for (const part of content.parts) {
                    if (part.inlineData) {
                        const base64ImageBytes: string = part.inlineData.data;
                        imageUrls.push(`data:image/png;base64,${base64ImageBytes}`);
                    }
                }
            }
        }
        
        if (imageUrls.length === 0) {
            throw new Error("AI không tạo ra ảnh trong lần này. Vui lòng thử lại. Đôi khi điều này xảy ra do lỗi tạm thời hoặc các hạn chế về an toàn.");
        }

        return imageUrls;

    } catch (error) {
        throw handleGeminiError(error, 'edit');
    }
};

// For generating new images from text prompts
export const generateStyledImage = async (
  prompt: string,
  numberOfImages: number,
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9"
): Promise<string[]> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: numberOfImages,
              outputMimeType: 'image/png',
              aspectRatio: aspectRatio,
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("API không trả về ảnh. Nội dung có thể đã vi phạm chính sách an toàn.");
        }

        return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);

    } catch (error) {
        throw handleGeminiError(error, 'generate');
    }
};

export const generateSpeech = async (script: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: script }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: 'Kore' }, // A clear, professional female voice
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!base64Audio) {
            throw new Error("AI không tạo ra âm thanh. Vui lòng thử lại.");
        }
        
        return base64Audio;

    } catch (error) {
        throw handleGeminiError(error, 'audio');
    }
};


// For generating text content, now with optional image input
interface TextContentResult {
    text: string;
    sources: { uri: string; title: string }[] | null;
}

export const generateTextContent = async (
    prompt: string, 
    imagePart?: { base64ImageData: string; mimeType: string; },
    useGoogleSearch: boolean = false
): Promise<TextContentResult> => {
    try {
        const ai = getAiClient();
        
        const contentParts: any[] = [];

        if (imagePart) {
            contentParts.push({
                inlineData: {
                    data: imagePart.base64ImageData,
                    mimeType: imagePart.mimeType
                }
            });
        }
        contentParts.push({ text: prompt });

        const config: any = {};
        if (useGoogleSearch) {
            config.tools = [{googleSearch: {}}];
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: contentParts },
            config: config,
        });

        let sources: { uri: string; title: string }[] | null = null;
        // FIX: Safely access groundingMetadata
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        if (useGoogleSearch && groundingMetadata?.groundingChunks) {
            const chunks = groundingMetadata.groundingChunks;
            // FIX: Add explicit typing and checks to safely process grounding chunks from the API response.
            // This prevents type inference failures that could lead to the 'unknown[]' error during assignment.
            const sourceList = (chunks as any[])
                .map((chunk: any) => chunk?.web)
                .filter(
                    (web: any): web is { uri: string; title?: string | null } =>
                        web && typeof web.uri === 'string' && web.uri.length > 0,
                )
                .map((web: { uri: string; title?: string | null }) => ({
                    uri: web.uri,
                    title: web.title || web.uri,
                }));
            
            if (sourceList.length > 0) {
                 // Deduplicate sources by URI and convert the map values back to an array.
                 sources = [...new Map(sourceList.map(item => [item.uri, item])).values()];
            }
        }

        return { text: response.text, sources };
    } catch (error) {
        throw handleGeminiTextError(error);
    }
};

// For generating 360 videos from an image
export const generate360Video = async (
  base64ImageBytes: string,
  mimeType: string,
  prompt: string,
  orientation: 'horizontal' | 'vertical',
  onPoll: (count: number) => void,
): Promise<string> => {
    try {
        const ai = getAiClient();
        const aspectRatio = orientation === 'horizontal' ? '16:9' : '9:16';
        
        let operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            image: {
                imageBytes: base64ImageBytes,
                mimeType: mimeType,
            },
            config: {
                numberOfVideos: 1,
                aspectRatio: aspectRatio,
            }
        });

        let pollCount = 0;
        // Poll for completion
        while (!operation.done) {
            pollCount++;
            onPoll(pollCount);
            console.log(`Polling for video completion... (Attempt ${pollCount})`);
            // Wait for 10 seconds before checking again
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
            console.log('Current operation status:', operation);
        }

        console.log('Video operation complete:', operation);
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

        if (!downloadLink) {
            throw new Error("API không trả về video. Video có thể đã không được tạo thành công hoặc nội dung vi phạm chính sách.");
        }

        const videoResponse = await fetch(`${downloadLink}&key=${getApiKey()}`);
        if (!videoResponse.ok) {
            throw new Error(`Không thể tải video từ link được cung cấp. Trạng thái: ${videoResponse.status}`);
        }

        const videoBlob = await videoResponse.blob();
        
        // Create an object URL from the blob to use in the <video> src
        const videoObjectURL = URL.createObjectURL(videoBlob);
        
        return videoObjectURL;

    } catch (error) {
        throw handleGeminiVideoError(error);
    }
};