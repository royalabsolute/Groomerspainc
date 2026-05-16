"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Shield, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { createUser, deleteUser } from "@/lib/actions/users";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminUsersClient({ initialUsers }: { initialUsers: any[] }) {
    const [users, setUsers] = useState(initialUsers);
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "", role: "MODIFIER" });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await createUser(formData);
        if (res.success) {
            toast.success("Usuario creado con éxito");
            setIsOpen(false);
            setFormData({ email: "", password: "", role: "MODIFIER" });
            window.location.reload(); // Simple refresh to fetch new list
        } else {
            toast.error(res.error || "Error al crear usuario");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
        const res = await deleteUser(id);
        if (res.success) {
            toast.success("Usuario eliminado");
            setUsers(users.filter((u: any) => u.id !== id));
        } else {
            toast.error(res.error || "Error al eliminar");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-foreground">Usuarios</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-12 px-6 rounded-xl font-bold bg-primary text-white shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all">
                            <UserPlus className="mr-2 h-5 w-5" /> Nuevo Usuario
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-3xl border-[3px] border-black p-8 shadow-[12px_12px_0px_0px_#000]">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Agregar Usuario</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label className="font-bold">Email</Label>
                                <Input 
                                    type="email" 
                                    required 
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="border-[3px] border-black rounded-xl h-12 font-medium focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_#000]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Contraseña</Label>
                                <Input 
                                    type="password" 
                                    required 
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                    className="border-[3px] border-black rounded-xl h-12 font-medium focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_#000]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role" className="font-bold">Rol</Label>
                                <select 
                                    id="role"
                                    title="Rol de Usuario"
                                    value={formData.role} 
                                    onChange={e => setFormData({...formData, role: e.target.value})}
                                    className="flex w-full border-[3px] border-black rounded-xl h-12 font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_#000] px-3"
                                >
                                    <option value="ADMIN">Administrador (Total)</option>
                                    <option value="MODIFIER">Modificador (Limitado)</option>
                                </select>
                            </div>
                            <Button type="submit" className="w-full h-12 mt-4 rounded-xl font-bold bg-primary text-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all">
                                Crear Usuario
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user: any) => (
                    <Card key={user.id} className="rounded-[2rem] border-[3px] border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all">
                        <CardContent className="p-6">
                            <div className="flex flex-col h-full space-y-4">
                                <div className="flex items-center gap-3 border-b-2 border-black/10 pb-4">
                                    <div className="bg-primary/20 p-3 rounded-xl border-2 border-primary">
                                        <Shield className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg text-foreground truncate max-w-[200px]" title={user.email}>{user.email}</h3>
                                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{user.role}</p>
                                    </div>
                                </div>
                                <Button 
                                    variant="destructive" 
                                    className="w-full h-10 rounded-xl font-black border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                                    onClick={() => handleDelete(user.id)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
