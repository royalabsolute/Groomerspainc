"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Shield, Trash2, Mail, Lock, UserCircle, Edit, User, X, Upload, Loader2, Key } from "lucide-react";
import { toast } from "sonner";
import { createUser, deleteUser, updateUser } from "@/lib/actions/users";
import { uploadFile } from "@/lib/actions/upload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDeleteModal } from "@/components/admin/ConfirmDeleteModal";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function AdminUsersClient({ initialUsers }: { initialUsers: any[] }) {
    const [users, setUsers] = useState(initialUsers);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Create Form State
    const [createForm, setCreateForm] = useState({ 
        name: "", 
        email: "", 
        password: "", 
        role: "MODIFIER", 
        image: "" 
    });
    const [creatingImageUpload, setCreatingImageUpload] = useState(false);

    // Edit Form State
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ 
        name: "", 
        email: "", 
        password: "", 
        role: "MODIFIER", 
        image: "" 
    });
    const [editingImageUpload, setEditingImageUpload] = useState(false);

    // Handle Image Upload for Creation
    const handleCreateImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCreatingImageUpload(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await uploadFile(formData);
            if (res.success && res.url) {
                setCreateForm(prev => ({ ...prev, image: res.url! }));
                toast.success("Foto cargada correctamente");
            } else {
                toast.error(res.error || "Error al subir foto");
            }
        } catch {
            toast.error("Error al conectar con el servidor");
        } finally {
            setCreatingImageUpload(false);
        }
    };

    // Handle Image Upload for Editing
    const handleEditImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setEditingImageUpload(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await uploadFile(formData);
            if (res.success && res.url) {
                setEditForm(prev => ({ ...prev, image: res.url! }));
                toast.success("Foto cargada correctamente");
            } else {
                toast.error(res.error || "Error al subir foto");
            }
        } catch {
            toast.error("Error al conectar con el servidor");
        } finally {
            setEditingImageUpload(false);
        }
    };

    // Create User Submit
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.email || !createForm.password) {
            toast.error("El correo y contraseña son obligatorios");
            return;
        }
        setIsCreating(true);
        try {
            const res = await createUser(createForm);
            if (res.success) {
                toast.success("Usuario creado con éxito");
                setIsCreateOpen(false);
                setCreateForm({ name: "", email: "", password: "", role: "MODIFIER", image: "" });
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

    // Open Edit Dialog
    const openEditDialog = (user: any) => {
        setEditingUserId(user.id);
        setEditForm({
            name: user.name || "",
            email: user.email || "",
            password: "",
            role: user.role || "MODIFIER",
            image: user.image || ""
        });
        setIsEditOpen(true);
    };

    // Edit User Submit
    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUserId) return;
        if (!editForm.email) {
            toast.error("El correo electrónico es obligatorio");
            return;
        }

        startTransition(async () => {
            try {
                const res = await updateUser(editingUserId, {
                    name: editForm.name,
                    email: editForm.email,
                    role: editForm.role,
                    image: editForm.image || null,
                    password: editForm.password ? editForm.password : undefined
                });

                if (res.success) {
                    toast.success("Usuario actualizado correctamente");
                    setIsEditOpen(false);
                    setUsers(users.map((u: any) => 
                        u.id === editingUserId 
                            ? { ...u, name: editForm.name, email: editForm.email, role: editForm.role, image: editForm.image }
                            : u
                    ));
                } else {
                    toast.error(res.error || "Error al actualizar usuario");
                }
            } catch {
                toast.error("Error inesperado al actualizar");
            }
        });
    };

    // Delete User
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
        <div className="space-y-6 bg-transparent text-white">
            <div className="flex justify-between items-center">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-400">Personal de la Veterinaria</h2>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-11 px-6 rounded-xl font-black bg-[#7C3AED] text-white hover:bg-[#7C3AED]/90 shadow-lg cursor-pointer uppercase tracking-wider text-xs">
                            <UserPlus className="mr-2 h-4 w-4" /> Nuevo Usuario
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-2xl border-[#3A3A3A] bg-[#1A1A1A] p-0 overflow-hidden text-white shadow-2xl">
                        <DialogHeader className="bg-[#252525]/30 px-6 py-4 border-b border-[#3A3A3A]/50">
                            <DialogTitle className="text-sm font-black text-white uppercase tracking-wider">Agregar nuevo personal</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            {/* Avatar selector */}
                            <div className="flex flex-col items-center justify-center space-y-3 pb-2">
                                <div className="relative h-16 w-16 rounded-full border border-[#3A3A3A] bg-[#252525] overflow-hidden flex items-center justify-center text-lg font-black text-[#7C3AED] uppercase shadow-md">
                                    {createForm.image ? (
                                        <Image src={createForm.image} alt="Preview" fill className="object-cover" />
                                    ) : (
                                        createForm.name ? createForm.name.substring(0, 2) : "US"
                                    )}
                                    {creatingImageUpload && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <Loader2 className="h-5 w-5 text-[#7C3AED] animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <label className="flex items-center gap-1.5 text-[9px] font-black text-[#7C3AED] uppercase tracking-widest px-2.5 py-1.5 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 rounded-xl border border-[#7C3AED]/25 cursor-pointer transition-all">
                                    <Upload className="h-3 w-3" />
                                    Subir Foto
                                    <input type="file" accept="image/*" onChange={handleCreateImageChange} className="hidden" />
                                </label>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nombre Completo</Label>
                                <Input 
                                    required 
                                    value={createForm.name}
                                    onChange={e => setCreateForm({...createForm, name: e.target.value})}
                                    className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                                    placeholder="Nombre de pila"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Correo electrónico</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input 
                                        type="email" 
                                        required 
                                        value={createForm.email}
                                        onChange={e => setCreateForm({...createForm, email: e.target.value})}
                                        className="pl-10 h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                                        placeholder="admin@ejemplo.com"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Contraseña de acceso</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input 
                                        type="password" 
                                        required 
                                        value={createForm.password}
                                        onChange={e => setCreateForm({...createForm, password: e.target.value})}
                                        className="pl-10 h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create-role" className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rol del Personal</Label>
                                <select 
                                    id="create-role"
                                    title="Rol del Personal"
                                    value={createForm.role} 
                                    onChange={e => setCreateForm({...createForm, role: e.target.value})}
                                    className="flex w-full border border-[#3A3A3A] rounded-xl h-11 font-black focus:outline-none focus:ring-1 focus:ring-[#7C3AED] focus:border-[#7C3AED] px-3 bg-[#252525] text-xs text-white uppercase tracking-wider"
                                >
                                    <option value="ADMIN">Administrador (Acceso Total)</option>
                                    <option value="MODIFIER">Modificador (Limitado)</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3 border-t border-[#3A3A3A]/40">
                                <Button type="button" variant="outline" className="flex-1 rounded-xl border-[#3A3A3A] bg-[#252525] text-slate-300 font-bold hover:bg-[#2F2F2F] hover:text-white cursor-pointer uppercase tracking-wider text-xs" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                                <Button type="submit" className="flex-1 rounded-xl bg-[#7C3AED] text-white font-black hover:bg-[#7C3AED]/90 cursor-pointer uppercase tracking-wider text-xs" disabled={isCreating}>
                                    {isCreating ? "Creando..." : "Crear Usuario"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

             {/* Vista Escritorio: Grid de tarjetas original refactorizado a 100% Sleek Dark Mode con click para editar */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user: any) => (
                    <Card 
                        key={user.id} 
                        onClick={() => openEditDialog(user)}
                        className="border-[#3A3A3A] shadow-xl rounded-2xl overflow-hidden bg-[#1A1A1A] hover:border-[#7C3AED]/50 transition-all duration-300 group cursor-pointer"
                    >
                        <CardContent className="p-6">
                            <div className="flex flex-col space-y-5">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border relative overflow-hidden bg-[#252525] font-black text-sm uppercase tracking-wider text-[#7C3AED] border-[#3A3A3A] group-hover:border-[#7C3AED]/40 transition-colors"
                                    )}>
                                        {user.image ? (
                                            <Image src={user.image} alt={user.name || "Avatar"} fill className="object-cover" />
                                        ) : (
                                            user.name ? user.name.substring(0, 2) : "US"
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-black text-white truncate text-sm tracking-tight group-hover:text-[#7C3AED] transition-colors" title={user.name || user.email}>
                                            {user.name || "Sin nombre"}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 truncate font-bold mt-0.5" title={user.email}>{user.email}</p>
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <span className={cn(
                                                "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                                                user.role === 'ADMIN' ? "bg-[#7C3AED]/10 border-[#7C3AED]/25 text-[#7C3AED]" : "bg-slate-800 border-slate-700 text-slate-400"
                                            )}>
                                                {user.role}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-[#3A3A3A]/50 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                                        Registro: {new Date(user.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditDialog(user)}
                                            className="h-8.5 rounded-xl border border-[#3A3A3A] text-slate-400 hover:text-white hover:bg-[#252525] font-bold text-[9px] uppercase tracking-wider px-3 cursor-pointer"
                                        >
                                            <Edit className="h-3 w-3 mr-1.5" /> Editar
                                        </Button>
                                        <ConfirmDeleteModal 
                                            onConfirm={() => handleDelete(user.id)}
                                            title="¿Eliminar acceso?"
                                            description={`Estás por revocar el acceso de ${user.email || user.name}. Esta acción es inmediata.`}
                                            trigger={
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    className="h-8.5 w-8.5 p-0 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-950/20 border border-[#3A3A3A] cursor-pointer flex items-center justify-center"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Vista Híbrida Móvil: Listado compacto de usuarios */}
            <div className="block md:hidden space-y-3">
                {users.map((user: any) => (
                    <div 
                        key={user.id} 
                        onClick={() => openEditDialog(user)}
                        className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3 cursor-pointer hover:border-[#7C3AED]/40 transition-colors"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border relative overflow-hidden bg-[#252525] font-black text-xs uppercase tracking-wider text-[#7C3AED] border-[#3A3A3A]"
                            )}>
                                {user.image ? (
                                    <Image src={user.image} alt={user.name || "Avatar"} fill className="object-cover" />
                                ) : (
                                    user.name ? user.name.substring(0, 2) : "US"
                                )}
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-black text-white text-xs truncate max-w-[170px]" title={user.name || user.email}>
                                    {user.name || "Sin nombre"}
                                </h4>
                                <p className="text-[9px] text-slate-500 truncate font-bold mt-0.5">{user.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={cn(
                                        "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border",
                                        user.role === 'ADMIN' ? "bg-[#7C3AED]/10 border-[#7C3AED]/25 text-[#7C3AED]" : "bg-slate-800 border-slate-700 text-slate-400"
                                    )}>
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <ConfirmDeleteModal 
                                onConfirm={() => handleDelete(user.id)}
                                title="¿Eliminar acceso?"
                                description={`Estás por revocar el acceso de ${user.email || user.name}. Esta acción es inmediata.`}
                                trigger={
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="h-8.5 w-8.5 p-0 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-950/20 border border-[#3A3A3A] cursor-pointer flex items-center justify-center"
                                        title="Revocar Acceso"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                }
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit User Modal Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl border-[#3A3A3A] bg-[#1A1A1A] p-0 overflow-hidden text-white shadow-2xl">
                    <DialogHeader className="bg-[#252525]/30 px-6 py-4 border-b border-[#3A3A3A]/50">
                        <DialogTitle className="text-sm font-black text-white uppercase tracking-wider">Editar Perfil del Personal</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="p-6 space-y-4">
                        {/* Avatar uploader */}
                        <div className="flex flex-col items-center justify-center space-y-3 pb-2">
                            <div className="relative h-16 w-16 rounded-full border border-[#3A3A3A] bg-[#252525] overflow-hidden flex items-center justify-center text-lg font-black text-[#7C3AED] uppercase shadow-md">
                                {editForm.image ? (
                                    <Image src={editForm.image} alt="Preview" fill className="object-cover" />
                                ) : (
                                    editForm.name ? editForm.name.substring(0, 2) : "US"
                                )}
                                {editingImageUpload && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <Loader2 className="h-5 w-5 text-[#7C3AED] animate-spin" />
                                    </div>
                                )}
                            </div>
                            <label className="flex items-center gap-1.5 text-[9px] font-black text-[#7C3AED] uppercase tracking-widest px-2.5 py-1.5 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 rounded-xl border border-[#7C3AED]/25 cursor-pointer transition-all">
                                <Upload className="h-3 w-3" />
                                Cambiar Foto
                                <input type="file" accept="image/*" onChange={handleEditImageChange} className="hidden" />
                            </label>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nombre Completo</Label>
                            <Input 
                                required 
                                value={editForm.name}
                                onChange={e => setEditForm({...editForm, name: e.target.value})}
                                className="h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Correo electrónico</Label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input 
                                    type="email" 
                                    required 
                                    value={editForm.email}
                                    onChange={e => setEditForm({...editForm, email: e.target.value})}
                                    className="pl-10 h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nueva Contraseña</Label>
                                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">(Opcional)</span>
                            </div>
                            <div className="relative">
                                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input 
                                    type="password" 
                                    value={editForm.password}
                                    onChange={e => setEditForm({...editForm, password: e.target.value})}
                                    className="pl-10 h-11 bg-[#252525] border-[#3A3A3A] text-white rounded-xl focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                                    placeholder="•••••••• (dejar vacío si no cambia)"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-role" className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rol del Personal</Label>
                            <select 
                                id="edit-role"
                                title="Rol del Personal"
                                value={editForm.role} 
                                onChange={e => setEditForm({...editForm, role: e.target.value})}
                                className="flex w-full border border-[#3A3A3A] rounded-xl h-11 font-black focus:outline-none focus:ring-1 focus:ring-[#7C3AED] focus:border-[#7C3AED] px-3 bg-[#252525] text-xs text-white uppercase tracking-wider"
                            >
                                <option value="ADMIN">Administrador (Acceso Total)</option>
                                <option value="MODIFIER">Modificador (Limitado)</option>
                            </select>
                        </div>
                        <div className="pt-4 flex gap-3 border-t border-[#3A3A3A]/40">
                            <Button type="button" variant="outline" className="flex-1 rounded-xl border-[#3A3A3A] bg-[#252525] text-slate-300 font-bold hover:bg-[#2F2F2F] hover:text-white cursor-pointer uppercase tracking-wider text-xs" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                            <Button type="submit" className="flex-1 rounded-xl bg-[#7C3AED] text-white font-black hover:bg-[#7C3AED]/90 cursor-pointer uppercase tracking-wider text-xs" disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
