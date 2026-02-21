"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Plus, Shield, Trash2, Lock } from "lucide-react";
import { api, type CommandPermission, type BotStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function PermissionsPage() {
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState<CommandPermission[]>([]);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [commandName, setCommandName] = useState("");
  const [guildId, setGuildId] = useState("");
  const [roleId, setRoleId] = useState("");

  const token = (session as { accessToken?: string })?.accessToken;

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  async function fetchData() {
    try {
      const status = await api.getBotStatus(token!);
      setBotStatus(status);
      
      if (status.guilds.length > 0) {
        const perms = await api.getPermissions(token!, status.guilds[0].id);
        setPermissions(perms.permissions);
      }
    } catch (err) {
      toast.error("Failed to fetch permissions data");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    try {
      await api.addPermission(token, {
        command_name: commandName,
        guild_id: guildId,
        role_id: roleId,
      });
      toast.success("Permission added");
      setOpen(false);
      setCommandName("");
      setRoleId("");
      fetchData();
    } catch (err) {
      toast.error("Failed to add permission");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(cmd: string, gid: string, rid: string) {
    if (!token || !confirm("Are you sure you want to remove this restriction?")) return;

    try {
      await api.removePermission(token, cmd, gid, rid);
      toast.success("Restriction removed");
      fetchData();
    } catch (err) {
      toast.error("Failed to remove permission");
    }
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
          <h1 className="text-2xl font-bold">Command Permissions</h1>
          <p className="text-muted-foreground text-sm">Restrict slash commands to specific server roles.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Restriction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Restrict Command</DialogTitle>
                <DialogDescription>
                  Users will need at least one of the specified roles to use the command.
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
                  <Label htmlFor="command">Command Name</Label>
                  <Input 
                    id="command" 
                    placeholder="e.g. review" 
                    value={commandName} 
                    onChange={e => setCommandName(e.target.value)}
                    required 
                  />
                  {botStatus?.commands && (
                    <div className="flex flex-wrap gap-1 mt-1">
                       {botStatus.commands.map(c => (
                         <button 
                           key={c} 
                           type="button"
                           onClick={() => setCommandName(c)}
                           className="text-[10px] bg-muted hover:bg-accent px-1.5 py-0.5 rounded border"
                         >
                           {c}
                         </button>
                       ))}
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role ID</Label>
                  <Input 
                    id="role" 
                    placeholder="Discord Role ID" 
                    value={roleId} 
                    onChange={e => setRoleId(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Restriction
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            Active Restrictions
          </CardTitle>
          <CardDescription>
            Commands not listed here are available to everyone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {permissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Lock className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
              <p className="text-sm text-muted-foreground">No command restrictions found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Command</TableHead>
                  <TableHead>Guild ID</TableHead>
                  <TableHead>Role ID</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((perm, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">/{perm.command_name}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{perm.guild_id}</TableCell>
                    <TableCell className="text-xs font-mono">{perm.role_id}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(perm.command_name, perm.guild_id, perm.role_id)}
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
