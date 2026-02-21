"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Plus, MessageSquare, Trash2, UserCircle } from "lucide-react";
import { api, type ChannelPrompt, type BotStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PromptsPage() {
  const { data: session } = useSession();
  const [prompts, setPrompts] = useState<ChannelPrompt[]>([]);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [channelId, setChannelId] = useState("");
  const [guildId, setGuildId] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");

  const token = (session as { accessToken?: string })?.accessToken;

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  async function fetchData() {
    try {
      const [promptsRes, statusRes] = await Promise.all([
        api.getChannelPrompts(token!),
        api.getBotStatus(token!),
      ]);
      setPrompts(promptsRes.prompts);
      setBotStatus(statusRes);
      if (statusRes.guilds.length > 0) {
        setGuildId(statusRes.guilds[0].id);
      }
    } catch (err) {
      toast.error("Failed to fetch prompts data");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    try {
      await api.setChannelPrompt(token, {
        channel_id: channelId,
        guild_id: guildId,
        system_prompt: systemPrompt,
      });
      toast.success("Channel persona saved");
      setOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error("Failed to save persona");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token || !confirm("Remove the custom persona for this channel?")) return;

    try {
      await api.deleteChannelPrompt(token, id);
      toast.success("Persona removed");
      fetchData();
    } catch (err) {
      toast.error("Failed to remove persona");
    }
  }

  function resetForm() {
    setChannelId("");
    setSystemPrompt("");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Channel Personas</h1>
          <p className="text-muted-foreground text-sm">Define unique AI personalities for specific Discord channels.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Persona
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Add Channel Persona</DialogTitle>
                <DialogDescription>
                  This system prompt will be used for all AI interactions in this specific channel.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="guild">Guild ID</Label>
                  <Input 
                    id="guild" 
                    placeholder="Discord Server ID" 
                    value={guildId} 
                    onChange={e => setGuildId(e.target.value)}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="channel">Channel ID</Label>
                  <Input 
                    id="channel" 
                    placeholder="Discord Channel ID" 
                    value={channelId} 
                    onChange={e => setChannelId(e.target.value)}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prompt">System Prompt</Label>
                  <Textarea 
                    id="prompt" 
                    placeholder="Describe the personality, tone, and knowledge of the AI for this channel..." 
                    value={systemPrompt} 
                    onChange={e => setSystemPrompt(e.target.value)}
                    rows={6}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Persona
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-purple-600" />
            Active Personas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No channel-specific personas found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel ID</TableHead>
                  <TableHead>System Prompt</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prompts.map((p) => (
                  <TableRow key={p.channel_id}>
                    <TableCell className="font-mono text-xs">{p.channel_id}</TableCell>
                    <TableCell>
                      <p className="text-xs line-clamp-2 max-w-md">{p.system_prompt}</p>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(p.channel_id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
