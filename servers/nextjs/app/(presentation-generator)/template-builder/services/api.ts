import { SaveTemplateRequest, SaveTemplateResponse } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const saveTemplateAPI = async (
  templateData: SaveTemplateRequest
): Promise<SaveTemplateResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/ppt/template/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(templateData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to save template" }));
    throw new Error(error.detail || "Failed to save template");
  }

  return response.json();
};

export const listTemplatesAPI = async (): Promise<{ templates: any[] }> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/ppt/template/list`);

  if (!response.ok) {
    throw new Error("Failed to fetch templates");
  }

  return response.json();
};

export const getTemplateAPI = async (templateId: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/ppt/template/${templateId}`);

  if (!response.ok) {
    throw new Error("Template not found");
  }

  return response.json();
};
