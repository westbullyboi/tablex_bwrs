import { useAiStore } from "../../store/aiStore";
import type { AiProvider } from "../../types/ai";

interface AiSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSettingsDialog({ isOpen, onClose }: AiSettingsDialogProps) {
  const { settings, updateSettings } = useAiStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--overlay))]">
      <div className="w-full max-w-md rounded-lg bg-[hsl(var(--background))] p-6 shadow-[var(--shadow-lg)] dark:bg-[hsl(var(--card))]">
        <h2 className="mb-4 text-lg font-semibold">AI Settings</h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="ai-provider"
              className="mb-1 block text-sm font-medium"
            >
              Provider
            </label>
            <select
              id="ai-provider"
              value={settings.provider}
              onChange={(e) =>
                updateSettings({ provider: e.target.value as AiProvider })
              }
              className="w-full rounded border border-[hsl(var(--border))] px-3 py-2 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--muted))]"
            >
              <option value="Claude">Claude (Anthropic)</option>
              <option value="Ollama">Ollama (Local)</option>
            </select>
          </div>

          {settings.provider === "Claude" && (
            <div>
              <label
                htmlFor="ai-claude-key"
                className="mb-1 block text-sm font-medium"
              >
                Claude API Key
              </label>
              <input
                id="ai-claude-key"
                type="password"
                value={settings.claudeApiKey}
                onChange={(e) =>
                  updateSettings({ claudeApiKey: e.target.value })
                }
                placeholder="sk-ant-..."
                className="w-full rounded border border-[hsl(var(--border))] px-3 py-2 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--muted))]"
              />
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                Get your API key from{" "}
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[hsl(var(--primary))] hover:underline"
                >
                  console.anthropic.com
                </a>
              </p>
            </div>
          )}

          {settings.provider === "Ollama" && (
            <>
              <div>
                <label
                  htmlFor="ai-ollama-url"
                  className="mb-1 block text-sm font-medium"
                >
                  Ollama Base URL
                </label>
                <input
                  id="ai-ollama-url"
                  type="text"
                  value={settings.ollamaBaseUrl}
                  onChange={(e) =>
                    updateSettings({ ollamaBaseUrl: e.target.value })
                  }
                  placeholder="http://localhost:11434"
                  className="w-full rounded border border-[hsl(var(--border))] px-3 py-2 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--muted))]"
                />
              </div>
              <div>
                <label
                  htmlFor="ai-ollama-model"
                  className="mb-1 block text-sm font-medium"
                >
                  Model
                </label>
                <input
                  id="ai-ollama-model"
                  type="text"
                  value={settings.ollamaModel}
                  onChange={(e) =>
                    updateSettings({ ollamaModel: e.target.value })
                  }
                  placeholder="llama3"
                  className="w-full rounded border border-[hsl(var(--border))] px-3 py-2 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--muted))]"
                />
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Make sure Ollama is running with the specified model
                </p>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] dark:text-[hsl(var(--foreground))] dark:hover:bg-[hsl(var(--accent))]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
