import { GoogleGenAI, Type } from "@google/genai";
import { FileItem, Connection, DuplicateCandidate } from '../types';

// Initialize safe client
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateFileSummary = async (fileName: string, content: string): Promise<string> => {
  if (!apiKey) return "Chave de API não configurada. Configure process.env.API_KEY para usar IA.";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Resuma o seguinte conteúdo do arquivo "${fileName}" de forma concisa, destacando pontos chave. Se for código, explique o que faz:\n\n${content}`,
    });
    return response.text || "Não foi possível gerar o resumo.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao conectar com a IA Gemini.";
  }
};

export const getAIChatResponse = async (
  userMessage: string, 
  context: { currentConnection?: Connection, currentFiles: FileItem[] }
): Promise<string> => {
  if (!apiKey) return "Modo de demonstração (Sem API Key). Eu posso ajudar a organizar seus arquivos se você configurar a chave API.";

  const fileList = context.currentFiles.map(f => `- ${f.name} (${f.type})`).join('\n');
  const contextPrompt = `
    Você é o Copiloto Nexus, um assistente de IA para um gerenciador de arquivos em nuvem.
    
    Contexto Atual:
    Conexão Ativa: ${context.currentConnection?.name || 'Nenhuma'}
    Arquivos na pasta atual:
    ${fileList}
    
    O usuário perguntou: "${userMessage}"
    
    Responda de forma útil. Se o usuário pedir para organizar, sugira estruturas de pastas. Se pedir para encontrar algo, use a lista acima. Mantenha o tom profissional e técnico.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contextPrompt,
    });
    return response.text || "Desculpe, não entendi.";
  } catch (error) {
    return "Erro ao processar solicitação com IA.";
  }
};

export const suggestOrganization = async (files: FileItem[]): Promise<string> => {
  if (!apiKey) return "Configure a API Key para sugestões automáticas.";

  const fileList = files.map(f => f.name).join(', ');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Dada a seguinte lista de arquivos: [${fileList}], sugira uma estrutura de pastas lógica para organizá-los (ex: por extensão, por data, ou por projeto). Responda apenas com a estrutura sugerida em formato de lista ou árvore.`,
    });
    return response.text || "Sem sugestões no momento.";
  } catch (error) {
    return "Erro ao gerar sugestão.";
  }
};

export const detectDuplicatesWithAI = async (files: FileItem[]): Promise<DuplicateCandidate[]> => {
  if (!apiKey) {
    // Mock response if no API key
    console.warn("Sem API Key. Retornando mocks de duplicatas.");
    const mockItems = [
      {
        fileA: files.find(f => f.name.includes('logo')) || files[0],
        fileB: files.find(f => f.name.includes('FINAL')) || files[1],
        similarity: 98,
        reason: "Tamanho de arquivo idêntico e nome semanticamente similar, indicando que 'FINAL' é uma cópia renomeada.",
        suggestion: 'keep_b' as DuplicateCandidate['suggestion']
      }
    ];
    return mockItems.filter((d): d is DuplicateCandidate => !!(d.fileA && d.fileB));
  }

  // Prepare simplified JSON payload to save tokens
  const fileData = files
    .filter(f => f.type === 'file') // Only compare files, not folders
    .map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      date: f.modifiedAt,
      conn: f.connectionName
    }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Analise esta lista de arquivos de diferentes conexões de armazenamento:
        ${JSON.stringify(fileData)}

        Identifique arquivos que provavelmente são duplicatas.
        Considere:
        1. Correspondência exata de tamanho e nome.
        2. Duplicatas semânticas (ex: "Relatório Q3.pdf" vs "Relatório Q3 Final.pdf" com tamanho similar).
        3. Arquivos de backup (ex: "file.txt" vs "file (1).txt").

        Retorne APENAS um JSON Array.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              fileA_id: { type: Type.STRING, description: "ID do primeiro arquivo" },
              fileB_id: { type: Type.STRING, description: "ID do segundo arquivo" },
              similarity: { type: Type.NUMBER, description: "0 a 100" },
              reason: { type: Type.STRING, description: "Explicação curta do porquê é duplicado" },
              suggestion: { type: Type.STRING, description: "'keep_a', 'keep_b' ou 'manual'" }
            },
            required: ["fileA_id", "fileB_id", "similarity", "reason", "suggestion"]
          }
        }
      }
    });

    const jsonResponse = JSON.parse(response.text || "[]");
    
    // Map IDs back to FileItem objects
    const results: DuplicateCandidate[] = jsonResponse.map((match: any) => {
      const fileA = files.find(f => f.id === match.fileA_id);
      const fileB = files.find(f => f.id === match.fileB_id);
      if (!fileA || !fileB) return null;
      return {
        fileA,
        fileB,
        similarity: match.similarity,
        reason: match.reason,
        suggestion: match.suggestion as 'keep_a' | 'keep_b' | 'manual'
      };
    }).filter((item: any) => item !== null);

    return results;

  } catch (error) {
    console.error("Erro ao detectar duplicatas:", error);
    return [];
  }
};