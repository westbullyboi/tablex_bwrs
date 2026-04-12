import { useState, useEffect } from "react";
import { Trash2, Star, Plug } from "lucide-react";
import type { ConnectionConfig } from "../../types/connection";
import { useConnectionStore } from "../../store/connectionStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { cn } from "../../lib/utils";

interface ConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionDialog({ isOpen, onClose }: ConnectionDialogProps) {
  const {
    testConnection,
    connect,
    isConnecting,
    error,
    clearError,
    savedConnections,
    loadSavedConnections,
    saveConnection,
    deleteConnection,
    setDefaultConnection,
    getConnectionPassword,
  } = useConnectionStore();

  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("");
  const [form, setForm] = useState<Omit<ConnectionConfig, "id">>({
    name: "",
    host: "localhost",
    port: 5432,
    database: "",
    username: "postgres",
    password: "",
    ssl_mode: "disable",
  });
  const [isDefault, setIsDefault] = useState(false);

  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null
  );

  useEffect(() => {
    if (isOpen) {
      loadSavedConnections();
    }
  }, [isOpen, loadSavedConnections]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "port" ? parseInt(value) || 0 : value,
    }));
    setTestResult(null);
    clearError();
  };

  const handleSelectConnection = async (id: string) => {
    setSelectedConnectionId(id);
    if (!id) {
      // New connection
      setForm({
        name: "",
        host: "localhost",
        port: 5432,
        database: "",
        username: "postgres",
        password: "",
        ssl_mode: "disable",
      });
      setIsDefault(false);
      return;
    }

    const saved = savedConnections.find((c) => c.id === id);
    if (saved) {
      try {
        const password = await getConnectionPassword(id);
        setForm({
          name: saved.name,
          host: saved.host,
          port: saved.port,
          database: saved.database,
          username: saved.username,
          password,
          ssl_mode: saved.ssl_mode,
        });
        setIsDefault(saved.is_default);
      } catch {
        // Password not found, leave empty
        setForm({
          name: saved.name,
          host: saved.host,
          port: saved.port,
          database: saved.database,
          username: saved.username,
          password: "",
          ssl_mode: saved.ssl_mode,
        });
        setIsDefault(saved.is_default);
      }
    }
    setTestResult(null);
    clearError();
  };

  const handleSslModeChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      ssl_mode: value as "disable" | "prefer" | "require",
    }));
    setTestResult(null);
    clearError();
  };

  const handleTest = async () => {
    const config: ConnectionConfig = {
      ...form,
      id: selectedConnectionId || crypto.randomUUID(),
    };

    const success = await testConnection(config);
    setTestResult(success ? "success" : "error");
  };

  const handleConnect = async () => {
    // Always use the password from the form
    const config: ConnectionConfig = {
      ...form,
      id: selectedConnectionId || crypto.randomUUID(),
    };

    try {
      await connect(config);
      onClose();
    } catch {
      // Error is handled in store
    }
  };

  const handleSave = async () => {
    const id = selectedConnectionId || crypto.randomUUID();
    clearError();
    try {
      await saveConnection({
        id,
        ...form,
        is_default: isDefault,
      });
      setSelectedConnectionId(id);
      setTestResult(null);
    } catch {
      // Error is handled in store
    }
  };

  const handleDelete = async () => {
    if (!selectedConnectionId) return;
    if (!confirm("Delete this connection?")) return;

    try {
      await deleteConnection(selectedConnectionId);
      setSelectedConnectionId("");
      setForm({
        name: "",
        host: "localhost",
        port: 5432,
        database: "",
        username: "postgres",
        password: "",
        ssl_mode: "disable",
      });
      setIsDefault(false);
    } catch {
      // Error is handled in store
    }
  };

  const handleSetDefault = async () => {
    if (!selectedConnectionId) return;
    try {
      await setDefaultConnection(selectedConnectionId);
      setIsDefault(true);
    } catch {
      // Error is handled in store
    }
  };

  const handleClose = () => {
    clearError();
    setTestResult(null);
    setSelectedConnectionId("");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleConnect();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connection</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Saved Connections Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium">Saved Connections</label>
            <Select
              value={selectedConnectionId || "new"}
              onValueChange={(value) =>
                handleSelectConnection(value === "new" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select connection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New Connection</SelectItem>
                {savedConnections.map((conn) => (
                  <SelectItem key={conn.id} value={conn.id}>
                    {conn.name}
                    {conn.is_default ? " (Default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="conn-name" className="text-[13px] font-medium">
              Connection Name
            </label>
            <Input
              id="conn-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="My Database"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label htmlFor="conn-host" className="text-[13px] font-medium">
                Host
              </label>
              <Input
                id="conn-host"
                type="text"
                name="host"
                value={form.host}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="conn-port" className="text-[13px] font-medium">
                Port
              </label>
              <Input
                id="conn-port"
                type="number"
                name="port"
                value={form.port}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="conn-database" className="text-[13px] font-medium">
              Database
            </label>
            <Input
              id="conn-database"
              type="text"
              name="database"
              value={form.database}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="conn-username" className="text-[13px] font-medium">
              Username
            </label>
            <Input
              id="conn-username"
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="conn-password" className="text-[13px] font-medium">
              Password
            </label>
            <Input
              id="conn-password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium">SSL Mode</label>
            <Select value={form.ssl_mode} onValueChange={handleSslModeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disable">Disable</SelectItem>
                <SelectItem value="prefer">Prefer</SelectItem>
                <SelectItem value="require">Require</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Default checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--ring))]"
            />
            <label htmlFor="isDefault" className="text-[13px]">
              Set as default (auto-connect on startup)
            </label>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-[var(--radius)] bg-[hsl(var(--destructive))]/10 p-2.5 text-[13px] text-[hsl(var(--destructive))]"
            >
              {error}
            </div>
          )}

          {testResult === "success" && (
            <div
              role="status"
              className="rounded-[var(--radius)] bg-[hsl(var(--success))]/10 p-2.5 text-[13px] text-[hsl(var(--success))]"
            >
              Connection successful!
            </div>
          )}

          <div className="flex justify-between pt-2">
            <div className="flex gap-1.5">
              {selectedConnectionId && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  {!isDefault && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSetDefault}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Set Default
                    </Button>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isConnecting || !form.name}
                className={cn(
                  "border-[hsl(var(--success))] text-[hsl(var(--success))]",
                  "hover:bg-[hsl(var(--success))]/10"
                )}
              >
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={isConnecting}
              >
                Test
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      size="icon-sm"
                      disabled={isConnecting}
                    >
                      <Plug className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isConnecting ? "Connecting..." : "Connect"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
