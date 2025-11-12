"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TemplateModelConfigProps {
  templateLlmUrl: string;
  templateLlmApiKey: string;
  templateModel: string;
  onInputChange: (value: string, field: string) => void;
}

export default function TemplateModelConfig({
  templateLlmUrl,
  templateLlmApiKey,
  templateModel,
  onInputChange,
}: TemplateModelConfigProps) {
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [customModelsLoading, setCustomModelsLoading] = useState(false);
  const [customModelsChecked, setCustomModelsChecked] = useState(false);
  const [openModelSelect, setOpenModelSelect] = useState(false);
  const [url, setUrl] = useState(templateLlmUrl);
  const [apiKey, setApiKey] = useState(templateLlmApiKey);

  useEffect(() => {
    setUrl(templateLlmUrl);
    setApiKey(templateLlmApiKey);
  }, [templateLlmUrl, templateLlmApiKey]);

  useEffect(() => {
    setCustomModels([]);
    setCustomModelsChecked(false);
    if (!templateModel) {
      onInputChange("", "custom_template_model");
    }
  }, [url, apiKey]);

  const fetchCustomModels = async () => {
    if (!url) return;

    try {
      setCustomModelsLoading(true);
      const response = await fetch("/api/v1/ppt/openai/models/available", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          api_key: apiKey,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCustomModels(data);
        setCustomModelsChecked(true);
      } else {
        console.error("Failed to fetch custom models");
        setCustomModels([]);
        setCustomModelsChecked(true);
        toast.error("Failed to fetch custom models");
      }
    } catch (error) {
      console.error("Error fetching custom models:", error);
      toast.error("Error fetching custom models");
      setCustomModels([]);
      setCustomModelsChecked(true);
    } finally {
      setCustomModelsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Template LLM URL
        </label>
        <input
          type="text"
          placeholder="https://your-custom-llm/v1"
          className="w-full px-4 py-2.5 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          value={templateLlmUrl}
          onChange={(e) => {
            setUrl(e.target.value);
            onInputChange(e.target.value, "custom_template_llm_url");
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Template API Key
        </label>
        <input
          type="text"
          placeholder="Optional"
          className="w-full px-4 py-2.5 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          value={templateLlmApiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            onInputChange(e.target.value, "custom_template_llm_api_key");
          }}
        />
      </div>

      {(!customModelsChecked || (customModelsChecked && customModels.length === 0)) && (
        <div>
          <button
            onClick={fetchCustomModels}
            disabled={customModelsLoading || !url}
            className={`w-full py-2.5 px-4 rounded-lg transition-all duration-200 border-2 ${
              customModelsLoading || !url
                ? "bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500"
                : "bg-white border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500/20"
            }`}
          >
            {customModelsLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking for available models...
              </div>
            ) : (
              "Check for available models"
            )}
          </button>
        </div>
      )}

      {customModelsChecked && customModels.length === 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            No models found. Please make sure your API key is valid and has access to models.
          </p>
        </div>
      )}

      {customModelsChecked && customModels.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Template Model
          </label>
          <Popover open={openModelSelect} onOpenChange={setOpenModelSelect}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openModelSelect}
                className="w-full h-12 px-4 py-4 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors hover:border-gray-400 justify-between"
              >
                <span className="text-sm font-medium text-gray-900">
                  {templateModel || "Select a model"}
                </span>
                <ChevronsUpDown className="w-4 h-4 text-gray-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0"
              align="start"
              style={{ width: "var(--radix-popover-trigger-width)" }}
            >
              <Command>
                <CommandInput placeholder="Search model..." />
                <CommandList>
                  <CommandEmpty>No model found.</CommandEmpty>
                  <CommandGroup>
                    {customModels.map((model, index) => (
                      <CommandItem
                        key={index}
                        value={model}
                        onSelect={(value) => {
                          onInputChange(value, "custom_template_model");
                          setOpenModelSelect(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            templateModel === model ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {model}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
