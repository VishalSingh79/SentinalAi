// services/geminiService.ts - Gemini API Integration with Correct Package
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Types for analysis results
export enum Severity {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High"
}

export interface Incident {
  id: string;
  timestamp: string;
  seconds: number;
  severity: Severity;
  description: string;
}

export interface AnalysisResult {
  summary: string;
  incidents: Incident[];
}

const API_KEY = "AIzaSyB3mAX0ErM8p3ztEyfc4fSwAJ5bLgxOcKs";

/**
 * Convert file to Base64 format for Gemini API
 * @param file - Video file to convert
 * @returns Promise with base64 string (without data URL prefix)
 */
const fileToGenerativePart = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:video/mp4;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    
    reader.onerror = (error) => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Analyze video for violence and dangerous behavior using Gemini AI
 * @param file - Video file to analyze
 * @returns Promise with analysis results
 * @throws Error if API key is missing or analysis fails
 */
export const analyzeVideoWithGemini = async (file: File): Promise<AnalysisResult> => {
  // Get API key from environment variable
  const apiKey = API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }

  // Validate file type
  if (!file.type.startsWith('video/')) {
    throw new Error("Invalid file type. Please upload a video file.");
  }

  // Check file size (client-side base64 has memory limits ~50-100MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    throw new Error("File size exceeds 50MB limit. Please use a smaller video.");
  }

  try {
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Convert video to base64
    // Note: Client-side base64 has memory limits (approx 50MB-100MB depending on browser).
    // For production large file support, use the File API with a backend proxy.
    const videoBase64 = await fileToGenerativePart(file);

    // Define the analysis prompt
    const prompt = `
      Analyze this surveillance video frame by frame for any signs of violence, aggression, or dangerous behavior.
      
      Identify specific incidents and categorize them by severity:
      - Low: Verbal aggression, threatening gestures, intense arguing.
      - Medium: Physical altercation, pushing, shoving, minor fighting.
      - High: Weapons involved, severe assault, dangerous physical harm, mobs.
      
      Return a JSON object with:
      1. A brief 'summary' of the entire video.
      2. An array of 'incidents'. Each incident must have:
         - 'timestamp': string in MM:SS format.
         - 'seconds': integer (approximate second mark where it starts).
         - 'severity': one of "Low", "Medium", "High".
         - 'description': a short description of what is happening.
    `;

    // Get the generative model with schema configuration
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            summary: { 
              type: SchemaType.STRING,
              description: "Brief summary of the entire video analysis"
            },
            incidents: {
              type: SchemaType.ARRAY,
              description: "Array of detected violent incidents",
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  timestamp: { 
                    type: SchemaType.STRING,
                    description: "Time in MM:SS format"
                  },
                  seconds: { 
                    type: SchemaType.INTEGER,
                    description: "Approximate second mark"
                  },
                  severity: { 
                    type: SchemaType.STRING,
                    enum: [Severity.LOW, Severity.MEDIUM, Severity.HIGH],
                    description: "Severity level of the incident"
                  },
                  description: { 
                    type: SchemaType.STRING,
                    description: "Description of what is happening"
                  }
                },
                required: ["timestamp", "seconds", "severity", "description"]
              }
            }
          },
          required: ["summary", "incidents"]
        }
      }
    });

    // Generate content with video and prompt
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: file.type,
          data: videoBase64
        }
      },
      { text: prompt }
    ]);

    // Get response
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("No response from Gemini API");
    }

    // Parse JSON response
    const parsedData = JSON.parse(text);
    
    // Validate response structure
    if (!parsedData.summary || !Array.isArray(parsedData.incidents)) {
      throw new Error("Invalid response format from Gemini API");
    }

    // Add unique IDs for React keys
    const incidents: Incident[] = parsedData.incidents.map((inc: any, index: number) => ({
      id: `inc-${index}-${Date.now()}`,
      timestamp: inc.timestamp,
      seconds: inc.seconds,
      severity: inc.severity as Severity,
      description: inc.description
    }));

    return {
      summary: parsedData.summary || "Analysis complete.",
      incidents: incidents
    };

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    // Handle specific error types
    if (error.message?.includes('API_KEY_INVALID')) {
      throw new Error("Invalid API key. Please check your Gemini API key configuration.");
    }
    
    if (error.message?.includes('quota')) {
      throw new Error("API quota exceeded. Please try again later.");
    }
    
    if (error.message?.includes('Failed to read file')) {
      throw new Error("Failed to read the video file. Please try again.");
    }

    throw new Error(error.message || "Failed to analyze video. Please try again or check the file format.");
  }
};

/**
 * Test if API key is valid
 * @returns Promise with boolean indicating if key is valid
 */
export const testApiKey = async (): Promise<boolean> => {
  const apiKey = API_KEY;
  if (!apiKey) {
    return false;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    await model.generateContent("test");
    return true;
  } catch (error) {
    console.error("API key test failed:", error);
    return false;
  }
};