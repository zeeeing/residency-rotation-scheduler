import { useState, useEffect } from "react";
import {
  listSessions,
  createSession,
  getSession,
  deleteSession,
  updateSession,
  type SessionSummary,
} from "../api/api";
import type { ApiResponse } from "../types";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Save, FolderOpen, Trash2, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

type SessionManagerProps = {
  apiResponse: ApiResponse | null;
  currentSessionId: number | null;
  academicYear: string;
  onSessionLoaded: (response: ApiResponse, sessionId: number) => void;
  onSessionSaved: (sessionId: number) => void;
};

export function SessionManager({
  apiResponse,
  currentSessionId,
  academicYear,
  onSessionLoaded,
  onSessionSaved,
}: SessionManagerProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const result = await listSessions();
      setSessions(result.sessions);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoadDialogOpen) {
      fetchSessions();
    }
  }, [isLoadDialogOpen]);

  const handleSave = async () => {
    if (!apiResponse || !sessionName.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      if (currentSessionId) {
        await updateSession(currentSessionId, {
          name: sessionName,
          api_response: apiResponse,
          academic_year: academicYear,
        });
        onSessionSaved(currentSessionId);
      } else {
        const result = await createSession({
          name: sessionName,
          api_response: apiResponse,
          academic_year: academicYear,
        });
        onSessionSaved(result.session.id);
      }

      setIsSaveDialogOpen(false);
      setSessionName("");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to save session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async (sessionId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const session = await getSession(sessionId);
      onSessionLoaded(session.api_response, session.id);
      setIsLoadDialogOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (sessionId: number) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    try {
      setIsLoading(true);
      await deleteSession(sessionId);
      await fetchSessions();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to delete session");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="flex gap-2">
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!apiResponse}
            className="flex items-center gap-1"
          >
            <Save size={16} />
            Save Session
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentSessionId ? "Update Session" : "Save Session"}
            </DialogTitle>
            <DialogDescription>
              Save your current solver results to the database so you can
              retrieve them later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="session-name">Session Name</Label>
            <Input
              id="session-name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g., AY2024-25 Draft 1"
              className="mt-2"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSaveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !sessionName.trim()}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <FolderOpen size={16} />
            Load Session
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Load Session</DialogTitle>
            <DialogDescription>
              Load a previously saved solver session from the database.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex-1 overflow-hidden">
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchSessions}
                disabled={isLoading}
              >
                <RefreshCw
                  size={14}
                  className={isLoading ? "animate-spin" : ""}
                />
              </Button>
            </div>
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            {sessions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No saved sessions found.
              </p>
            ) : (
              <div className="max-h-80 overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="max-w-[200px]">Name</TableHead>
                      <TableHead className="w-24">Year</TableHead>
                      <TableHead className="w-16">Count</TableHead>
                      <TableHead className="w-32">Updated</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium max-w-[200px] truncate" title={session.name}>
                          {session.name}
                        </TableCell>
                        <TableCell>{session.academic_year || "-"}</TableCell>
                        <TableCell>{session.resident_count}</TableCell>
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(session.updated_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLoad(session.id)}
                              disabled={isLoading}
                            >
                              Load
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(session.id)}
                              disabled={isLoading}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
