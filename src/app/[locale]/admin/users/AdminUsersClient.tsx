"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Shield, Trash2, Mail, Lock, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { createUser, deleteUser } from "@/lib/actions/users";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDeleteModal } from "@/components/admin/ConfirmDeleteModal";
import { cn } from "@/lib/utils";

export default function AdminUsersClient({ initialUsers }: { initialUsers: any[] }) {
    const [users, setUsers] = useState(initialUsers);
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "", role: "MODIFIER" });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await createUser(formData);
            if (res.success) {
                toast.success("Usuario creado con éxito");
                setIsOpen(false);
                setFormData({ email: "", password: "", role: "MODIFIER" });
                window.location.reload();
            } else {
                toast.error(res.error || "Error al crear usuario");
            }
        } catch (error) {
            toast.error("Error inesperado");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await deleteUser(id);
            if (res.success) {
                toast.success("Usuario eliminado");
                setUsers(users.filter((u: any) => u.id !== id));
            } else {
                toast.error(res.error || "Error al eliminar");
            }
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900">Personal del Panel</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-10 px-6 rounded-lg font-semibold shadow-sm">
                            <UserPlus className="mr-2 h-4 w-4" /> Nuevo Usuario
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-xl border-slate-200 p-0 overflow-hidden">
                        <DialogHeader className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                            <DialogTitle className="text-lg font-bold text-slate-900">Agregar nuevo acceso</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-500">Correo electrónico</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        type="email" 
                                        required 
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        className="pl-10 h-11 border-slate-200 rounded-lg focus-visible:ring-primary/20"
                                        placeholder="admin@ejemplo.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-500">Contraseña temporal</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        type="password" 
                                        required 
                                        value={formData.password}
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                        className="pl-10 h-11 border-slate-200 rounded-lg focus-visible:ring-primary/20"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="role" className="text-xs font-semibold text-slate-500">Rol asignado</Label>
                                <select 
                                    id="role"
                                    title="Rol de Usuario"
                                    value={formData.role} 
                                    onChange={e => setFormData({...formData, role: e.target.value})}
                                    className="flex w-full border border-slate-200 rounded-lg h-11 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 px-3 bg-white text-sm"
                                >
                                    <option value="ADMIN">Administrador (Acceso Total)</option>
                                    <option value="MODIFIER">Modificador (Limitado)</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsOpen(false)}>Cancelar</Button>
                                <Button type="submit" className="flex-1 font-bold" disabled={isCreating}>
                                    {isCreating ? "Creando..." : "Crear Usuario"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user: any) => (
                    <Card key={user.id} className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white hover:shadow-md transition-all duration-200 group">
                        <CardContent className="p-6">
                            <div className="flex flex-col space-y-5">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-3 rounded-xl border",
                                        user.role === 'ADMIN' ? "bg-primary/5 border-primary/20 text-primary" : "bg-slate-50 border-slate-100 text-slate-400"
                                    )}>
                                        <Shield className="h-6 w-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-slate-900 truncate text-base" title={user.email}>{user.email}</h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                                user.role === 'ADMIN' ? "bg-primary/10 border-primary/20 text-primary" : "bg-slate-100 border-slate-200 text-slate-500"
                                            )}>
                                                {user.role}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="text-[10px] text-slate-400 font-medium">
                                        Creado: {new Date(user.createdAt).toLocaleDateString()}
                                    </div>
                                    <ConfirmDeleteModal 
                                        onConfirm={() => handleDelete(user.id)}
                                        title="¿Eliminar acceso?"
                                        description={`Estás por revocar el acceso de ${user.email}. Esta acción es inmediata.`}
                                        trigger={
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                className="h-8 px-3 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-wider border border-transparent hover:border-rose-100"
                                            >
                                                <Trash2 className="h-3 w-3 mr-2" /> Revocar Acceso
                                            </Button>
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
