import { GoogleGenAI, Tool, Type, Part } from "@google/genai";
import { ABCResult, ValidationResult } from "../types";

// Define the tool for the model
const validateABCTool: Tool = {
  functionDeclarations: [
    {
      name: 'validate_abc_notation',
      description: 'Validates the syntax of the generated ABC notation using the abcjs engine. Call this to check for errors before finishing.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          abc_notation: {
            type: Type.STRING,
            description: 'The full ABC notation string to validate.',
          },
        },
        required: ['abc_notation'],
      },
    }
  ],
};

export const convertImageToABC = async (
  files: File[], 
  model: string,
  onLog: (message: string, type?: 'info' | 'success' | 'warning' | 'thinking') => void,
  onStreamUpdate: (text: string) => void,
  validatorFn: (abc: string) => ValidationResult
): Promise<ABCResult> => {

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 1. Image Processing
    const parts = await Promise.all(
      files.map(async (file, index) => {
        const base64Data = await fileToGenerativePart(file);
        return {
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        };
      })
    );

    // Simplified instruction because we rely on Native Thinking for the analysis phase
    const systemInstruction = `
      You are an expert Music Transcription Agent using ABC Notation.
      
      YOUR GOAL: Convert the sheet music image ACCURATELY to ABC notation, INCLUDING ALL LYRICS.

      WORKFLOW:
      1. ANALYZE: Use your thought process to analyze the key, time signature, notes, AND lyrics.
      2. GENERATE: Output the ABC notation block (start with X:1).
         - CRITICAL: If the image contains lyrics, you MUST transcribe them using 'w:' lines immediately after the music lines.
      3. VALIDATE: Call the tool 'validate_abc_notation' with your generated code.
      4. REFINE: 
         - If the tool returns errors, fix the code and call the tool again.
         - If the tool returns "Syntax Valid", perform a VISUAL AUDIT. Compare your code measure-by-measure against the image.
      5. FINALIZE: Only output the final ABC notation as text when you are 100% sure it is correct and valid.

      RULES:
      - Ensure headers (X:, T:, M:, L:, K:) are correct.
      - Handle multiple voices (V:1, V:2) if present.
      - LYRICS ARE MANDATORY: Use 'w:' fields. Match syllables to notes using hyphens (-) and spaces. 
      - Do not output only the melody if words are present in the image.
    `;

    // Configure Thinking based on Model Family
    const isGemini2 = model.includes('2.5');
    const thinkingConfig: any = {
        includeThoughts: true
    };

    if (isGemini2) {
        // Configure specific budgets for 2.5 series
        if (model.includes('flash')) {
            thinkingConfig.thinkingBudget = 24576; // Max for Flash
        } else {
            thinkingConfig.thinkingBudget = 32768; // Max for Pro
        }
    } 
    // For Gemini 3, we rely on the default thinking level (High) by only setting includeThoughts: true.
    // Explicitly setting thinkingLevel or temperature often causes INVALID_ARGUMENT.

    // Initialize Chat
    const chat = ai.chats.create({
      model: model,
      config: {
        // temperature: 0.2, // REMOVED: Incompatible with Thinking models in some contexts
        systemInstruction: systemInstruction,
        tools: [validateABCTool],
        thinkingConfig: thinkingConfig
      },
    });

    onLog(`Analyzing input image(s)...`, 'thinking');

    // Initial Message parts
    let currentMessageParts: Part[] = [
        ...parts,
        { text: "Transcribe this sheet music. Use your thinking process to analyze the key signature, time signature, notes, and LYRICS before generating code." }
    ];

    let fullText = "";
    let finalAbc = "";
    let turnCount = 0;
    const MAX_TURNS = 6;

    while (turnCount < MAX_TURNS) {
        onLog(`Turn ${turnCount + 1}: Processing...`, 'info');
        
        const result = await chat.sendMessageStream({ message: currentMessageParts });
        
        let toolCall: any = null;
        let thoughtAccumulator = "";

        for await (const chunk of result) {
            // Check candidates for thoughts and content
            const candidates = chunk.candidates;
            if (candidates && candidates.length > 0) {
                const parts = candidates[0].content.parts;
                
                for (const part of parts) {
                    // 1. Handle Native Thoughts
                    // In the SDK, part.thought is a boolean, and part.text contains the thought content
                    if (part.thought) {
                        if (part.text) {
                            thoughtAccumulator += part.text;
                            onLog(thoughtAccumulator, 'thinking');
                        }
                        continue; // Skip processing this part as code
                    }

                    // 2. Handle Text Content (The Code/Answer)
                    if (part.text) {
                        fullText += part.text;
                        
                        // Extract and stream only the ABC part to the editor
                        const codeMatch = fullText.match(/(X:[\s\S]*)/);
                        if (codeMatch) {
                            onStreamUpdate(cleanAbc(codeMatch[1]));
                        } else {
                            // Only update if it looks like we aren't just chatting
                            if (fullText.includes("X:") || fullText.length > 50) {
                                onStreamUpdate(cleanAbc(fullText));
                            }
                        }
                    }

                    // 3. Handle Tool Calls
                    if (part.functionCall) {
                        toolCall = part.functionCall;
                    }
                }
            }
        }

        // If the model produced a tool call
        if (toolCall) {
            const functionName = toolCall.name;
            const args = toolCall.args;
            
            onLog(`Agent requesting tool: ${functionName}`, 'info');

            if (functionName === 'validate_abc_notation') {
                const abcToValidate = args.abc_notation;
                
                if (abcToValidate) {
                    onStreamUpdate(cleanAbc(abcToValidate));
                }

                // Run the client-side validation
                onLog("Running syntax validation engine...", 'thinking');
                const validationResult = validatorFn(abcToValidate);

                let toolResponseContent = {};
                
                if (validationResult.isValid) {
                    onLog("Syntax valid. Performing visual accuracy check...", 'success');
                    toolResponseContent = {
                        result: "Syntax is VALID (0 errors). \n\nCRITICAL STEP: Now look at the original image again. Compare this ABC notation with the image. \n- Are the key signatures correct?\n- Are the accidentals correct?\n- Are the beams correct?\n- ARE THE LYRICS INCLUDED AND ALIGNED?\n\nIf it matches perfectly, output the ABC code as your final answer. If not, rewrite the ABC code and validate again."
                    };
                } else {
                    onLog(`Syntax errors found: ${validationResult.errors.length}`, 'warning');
                    toolResponseContent = {
                        result: `Syntax Errors Detected:\n${validationResult.errors.join('\n')}\n\nPlease fix these specific errors and re-validate.`
                    };
                }

                currentMessageParts = [
                    {
                        functionResponse: {
                            name: functionName,
                            id: toolCall.id,
                            response: toolResponseContent
                        }
                    }
                ];
            }
        } else {
            const potentialAbc = cleanAbc(fullText);
            if (potentialAbc.includes("X:")) {
                finalAbc = potentialAbc;
                onLog("Finalizing output...", 'success');
                break; 
            } else {
                onLog("Model response ended without code. Retrying...", 'warning');
                currentMessageParts = [{ text: "Please generate the final ABC notation code block now." }];
            }
        }

        turnCount++;
        fullText = "";
    }

    if (turnCount >= MAX_TURNS) {
        onLog("Max refinement turns reached. Returning best effort.", 'warning');
        finalAbc = cleanAbc(fullText);
    }

    return {
      abc: finalAbc,
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    onLog(`Error: ${error.message || "Unknown error occurred"}`, 'warning');
    throw error;
  }
};

function cleanAbc(text: string): string {
    if (!text) return "";
    const match = text.match(/X:[\s\S]*/);
    if (match) {
        return match[0].replace(/```abc\s*/g, '').replace(/```$/g, '').trim();
    }
    return text.replace(/^```abc\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
}

async function fileToGenerativePart(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}