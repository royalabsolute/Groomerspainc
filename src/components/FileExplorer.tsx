"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Folder,
  File,
  FileArchive,
  Trash,
  PackageOpen,
  ArrowLeft,
  UploadCloud,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  Play,
  FolderPlus,
  RefreshCw,
  MoreVertical,
  Edit,
  Edit2,
  Search,
  ChevronRight,
  Copy,
  Scissors,
  Clipboard
} from "lucide-react";
import { useNav } from "@/context/NavigationContext";

interface FileItem {
  name: string;
  isDirectory: boolean;
  size: number;
  mtime: string;
}

export default function FileExplorer() {
  const { state } = useNav();
  const { activeChannel } = state;

  // Map activeChannel to virtual base paths
  const getChannelBasePath = (channel: string) => {
    const map: Record<string, string> = {
      "minecraft-server": "/vps-root/var/minecraft/server",
      "www-grooming":     "/vps-root/var/www/groomingpet",
      "home-root":        "/vps-root",
    };
    return map[channel] || "/vps-root/var/minecraft/server";
  };

  const [currentPath, setCurrentPath] = useState<string>("/vps-root/var/minecraft/server");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // name of file executing action
  const [dragActive, setDragActive] = useState(false);
  
  // Search query state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Custom dialogs/dropdown states
  const [activeMenuFile, setActiveMenuFile] = useState<string | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState<{ oldName: string; newName: string } | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    file: FileItem | null;
  } | null>(null);

  // Clipboard state for copy/cut/paste
  const [clipboard, setClipboard] = useState<{
    file: FileItem;
    action: "copy" | "move";
    sourcePath: string;
  } | null>(null);
  
  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  
  const [uploadStatus, setUploadStatus] = useState<{
    status: "idle" | "uploading" | "success" | "error";
    message?: string;
  }>({ status: "idle" });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize path when activeChannel changes
  useEffect(() => {
    setCurrentPath(getChannelBasePath(activeChannel));
    setSearchQuery(""); // Clear search on channel change
  }, [activeChannel]);

  // Fetch files in the current path
  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/minecraft/files?path=${encodeURIComponent(currentPath)}`);
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
      } else {
        console.error("Error fetching files:", data.error);
        setFiles([]);
      }
    } catch (error) {
      console.error("Network error fetching files:", error);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentPath]);

  // Close context menu on click outside
  useEffect(() => {
    const handleCloseMenu = () => {
      if (contextMenu?.visible) {
        setContextMenu(null);
      }
    };
    window.addEventListener("click", handleCloseMenu);
    return () => window.removeEventListener("click", handleCloseMenu);
  }, [contextMenu]);

  // Context menu on container/empty space
  const handleContainerContextMenu = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains("empty-area-check")) {
      e.preventDefault();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        file: null,
      });
    }
  };

  // Paste action execution
  const handlePaste = async () => {
    if (!clipboard) return;
    setIsLoading(true);
    try {
      const sourceFileVirtualPath = `${clipboard.sourcePath}/${clipboard.file.name}`;
      const res = await fetch("/api/minecraft/files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: currentPath,
          filename: clipboard.file.name,
          action: clipboard.action,
          sourcePath: sourceFileVirtualPath,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUploadStatus({
          status: "success",
          message: `${clipboard.action === "copy" ? "Copiado" : "Movido"} con éxito.`
        });
        fetchFiles();
        if (clipboard.action === "move") {
          setClipboard(null);
        }
      } else {
        setUploadStatus({ status: "error", message: `Error al pegar: ${data.error}` });
      }
    } catch (error) {
      setUploadStatus({ status: "error", message: "Error de red al pegar." });
    } finally {
      setTimeout(() => setUploadStatus({ status: "idle" }), 4000);
    }
  };

  // Navigate into a directory
  const handleFolderClick = (folderName: string) => {
    setCurrentPath((prev) => {
      if (prev === "/") return `/${folderName}`;
      return `${prev}/${folderName}`;
    });
  };

  // Go up to the parent directory
  const handleGoUp = () => {
    const basePath = getChannelBasePath(activeChannel);
    if (currentPath === basePath || currentPath === "/") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    const parentPath = "/" + parts.join("/");
    if (parentPath.startsWith(basePath) || basePath === "/") {
      setCurrentPath(parentPath);
    }
  };

  // Helper to format file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Helper to format date
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper to get file type string for display
  const getFileType = (file: FileItem) => {
    if (file.isDirectory) return "Carpeta de archivos";
    const ext = file.name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "zip": return "Archivo comprimido ZIP";
      case "rar": return "Archivo comprimido RAR";
      case "7z": return "Archivo comprimido 7Z";
      case "gz":
      case "tgz":
        return "Archivo comprimido GZIP";
      case "jar": return "Ejecutable Java (JAR)";
      case "sh": return "Script de consola Bash";
      case "json": return "Archivo JSON";
      case "txt": return "Documento de texto";
      case "log": return "Archivo de registro (LOG)";
      case "yml":
      case "yaml":
        return "Configuración YAML";
      case "properties":
        return "Propiedades Java";
      default: return ext ? `Archivo ${ext.toUpperCase()}` : "Archivo";
    }
  };

  // Create folder action
  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setIsCreateFolderOpen(false);
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/minecraft/files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: currentPath,
          action: "mkdir",
          folderName: newFolderName.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setUploadStatus({ status: "success", message: `Carpeta "${newFolderName}" creada con éxito.` });
        fetchFiles();
      } else {
        setUploadStatus({ status: "error", message: `Error al crear carpeta: ${data.error}` });
      }
    } catch (error) {
      setUploadStatus({ status: "error", message: "Error de red al crear carpeta." });
    } finally {
      setNewFolderName("");
      setTimeout(() => setUploadStatus({ status: "idle" }), 4000);
    }
  };

  // Rename action
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameTarget.newName.trim() || renameTarget.newName.trim() === renameTarget.oldName) {
      setRenameTarget(null);
      return;
    }
    const { oldName, newName } = renameTarget;
    setRenameTarget(null);
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/minecraft/files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: currentPath,
          filename: oldName,
          action: "rename",
          newName: newName.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setUploadStatus({ status: "success", message: `Elemento renombrado a "${newName}" con éxito.` });
        fetchFiles();
      } else {
        setUploadStatus({ status: "error", message: `Error al renombrar: ${data.error}` });
      }
    } catch (error) {
      setUploadStatus({ status: "error", message: "Error de red al renombrar." });
    } finally {
      setTimeout(() => setUploadStatus({ status: "idle" }), 4000);
    }
  };

  // Execute deletion via PATCH action
  const executeDelete = async (filename: string) => {
    setActionLoading(filename);
    try {
      const res = await fetch("/api/minecraft/files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: currentPath, filename, action: "delete" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchFiles();
        setUploadStatus({ status: "success", message: `Archivo ${filename} eliminado con éxito.` });
        setTimeout(() => setUploadStatus({ status: "idle" }), 4000);
      } else {
        setUploadStatus({ status: "error", message: `Error al eliminar: ${data.error}` });
      }
    } catch (error) {
      setUploadStatus({ status: "error", message: "Error de red al eliminar el archivo." });
    } finally {
      setActionLoading(null);
    }
  };

  // Extract a .zip file
  const handleExtract = async (filename: string) => {
    setActionLoading(filename);
    try {
      const res = await fetch("/api/minecraft/files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: currentPath, filename, action: "unzip" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchFiles();
        setUploadStatus({ status: "success", message: `Zip ${filename} extraído con éxito.` });
        setTimeout(() => setUploadStatus({ status: "idle" }), 4000);
      } else {
        setUploadStatus({ status: "error", message: `Error al extraer: ${data.error}` });
      }
    } catch (error) {
      setUploadStatus({ status: "error", message: "Error de red al extraer el archivo." });
    } finally {
      setActionLoading(null);
    }
  };

  // Set boot executable
  const handleSetBoot = async (filename: string) => {
    setActionLoading(filename);
    try {
      const res = await fetch("/api/minecraft/files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: currentPath, filename, action: "set_boot" }),
      });
      const data = await res.json();
      if (data.success) {
        setUploadStatus({ status: "success", message: `Configurado ${filename} como ejecutable de arranque.` });
        setTimeout(() => setUploadStatus({ status: "idle" }), 4000);
      } else {
        setUploadStatus({ status: "error", message: `Error al configurar arranque: ${data.error}` });
      }
    } catch (error) {
      setUploadStatus({ status: "error", message: "Error de red al configurar el arranque." });
    } finally {
      setActionLoading(null);
    }
  };

  // Stream-based raw upload handler
  const handleUploadFile = async (file: File) => {
    setUploadStatus({ status: "uploading", message: `Subiendo ${file.name}...` });
    try {
      const url = `/api/minecraft/files?path=${encodeURIComponent(currentPath)}&filename=${encodeURIComponent(file.name)}`;
      
      const res = await fetch(url, {
        method: "POST",
        body: file,
        headers: {
          "Content-Type": "application/octet-stream"
        }
      });

      const data = await res.json();
      if (data.success) {
        setUploadStatus({ status: "success", message: `Archivo ${file.name} subido con éxito.` });
        fetchFiles();
        setTimeout(() => setUploadStatus({ status: "idle" }), 4000);
      } else {
        setUploadStatus({ status: "error", message: data.error || "Error al subir archivo." });
      }
    } catch (error) {
      setUploadStatus({ status: "error", message: "Error de red durante la subida." });
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUploadFile(e.target.files[0]);
    }
  };

  // Build breadcrumbs path list
  const buildBreadcrumbs = () => {
    const basePath = getChannelBasePath(activeChannel);
    let relativePath = "";
    if (currentPath.startsWith(basePath)) {
      relativePath = currentPath.slice(basePath.length);
    }
    const segments = relativePath.split("/").filter(Boolean);
    const list = [{ label: "Inicio", path: basePath }];
    let accum = basePath;
    for (const seg of segments) {
      accum = accum === "/" ? `/${seg}` : `${accum}/${seg}`;
      list.push({ label: seg, path: accum });
    }
    return list;
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-[#313338] h-full overflow-hidden text-[#DBDEE1]">
      
      {/* ─── Topbar (Barra de Navegación) ────────────────────────────────────────── */}
      <div className="bg-[#2B2D31] p-3 border-b border-[#1F2023] flex items-center justify-between gap-4 shrink-0 select-none">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 font-mono text-sm max-w-full overflow-x-auto whitespace-nowrap scrollbar-none">
          {currentPath !== getChannelBasePath(activeChannel) ? (
            <button
              onClick={handleGoUp}
              className="p-1 hover:bg-[#35373C] hover:text-white rounded transition flex items-center justify-center cursor-pointer text-white mr-1"
              title="Atrás"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="p-1 text-zinc-500 mr-1">
              <FolderOpen className="w-4 h-4" />
            </div>
          )}

          {buildBreadcrumbs().map((item, index, arr) => {
            const isLast = index === arr.length - 1;
            return (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
                {isLast ? (
                  <span className="text-white font-semibold">{item.label}</span>
                ) : (
                  <button
                    onClick={() => setCurrentPath(item.path)}
                    className="hover:text-white hover:underline font-medium text-zinc-400 transition-colors"
                  >
                    {item.label}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Input de Búsqueda */}
        <div className="relative flex items-center w-64 shrink-0">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar archivos..."
            aria-label="Buscar archivos"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1E1F22] border border-[#1F2023] rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#5865F2] transition-colors"
          />
        </div>
      </div>

      {/* ─── Toolbar (Barra de Herramientas) ────────────────────────────────────────── */}
      <div className="bg-[#2B2D31] px-4 py-2 flex items-center justify-between border-b border-[#1F2023] shrink-0 select-none">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateFolderOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#2B2D31] hover:bg-[#35373C] text-[#DBDEE1] hover:text-white transition-colors border border-[#1F2023] cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-blue-400" />
            <span>Nueva Carpeta</span>
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#2B2D31] hover:bg-[#35373C] text-[#DBDEE1] hover:text-white transition-colors border border-[#1F2023] cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-emerald-400" />
            <span>Subir Archivo</span>
          </button>

          {clipboard && (
            <button
              onClick={handlePaste}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#2B2D31] hover:bg-[#35373C] text-emerald-400 hover:text-white transition-colors border border-[#1F2023] cursor-pointer"
            >
              <Clipboard className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Pegar ({clipboard.file.name})</span>
            </button>
          )}

          <button
            onClick={fetchFiles}
            className="flex items-center justify-center p-2 rounded bg-[#2B2D31] hover:bg-[#35373C] text-[#DBDEE1] hover:text-white transition-colors border border-[#1F2023] cursor-pointer"
            title="Actualizar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
        
        <div className="text-xs text-[#949BA4] font-mono">
          {filteredFiles.length} elementos {searchQuery && `(filtrados de ${files.length})`}
        </div>
      </div>

      {/* ─── Dropzone & File List Wrapper ────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto p-4 relative flex flex-col gap-4 select-text"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        {/* Visual Drag overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-[#5865F2]/10 border-2 border-dashed border-[#5865F2] m-4 rounded-lg flex items-center justify-center flex-col z-40 backdrop-blur-[1px]">
            <UploadCloud className="w-12 h-12 text-[#5865F2] animate-bounce" />
            <p className="text-sm font-semibold text-white mt-2">Suelta el archivo aquí para subirlo a la ruta actual</p>
          </div>
        )}

        {/* Notificaciones de subida */}
        {uploadStatus.status !== "idle" && (
          <div className={`p-3 rounded border text-xs flex items-center gap-2.5 max-w-lg shadow-md animate-in slide-in-from-top-4 duration-150 ${
            uploadStatus.status === "uploading" ? "bg-[#35373C] border-[#4E5058] text-white" :
            uploadStatus.status === "success" ? "bg-[#23A55A]/10 border-[#23A55A]/20 text-[#23A55A]" :
            "bg-[#F23F43]/10 border-[#F23F43]/20 text-[#F23F43]"
          }`}>
            {uploadStatus.status === "uploading" && <Loader2 className="w-4 h-4 animate-spin text-[#5865F2]" />}
            {uploadStatus.status === "success" && <CheckCircle className="w-4 h-4 shrink-0" />}
            {uploadStatus.status === "error" && <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span className="font-medium">{uploadStatus.message}</span>
          </div>
        )}

        {/* ─── Tabla de Archivos (Main View) ─────────────────────────────────────── */}
        <div 
          onContextMenu={handleContainerContextMenu}
          className="grow bg-[#2B2D31] rounded-lg border border-[#1F2023] overflow-hidden min-h-[300px] flex flex-col empty-area-check"
        >
          
          {/* Header */}
          <div className="grid grid-cols-12 bg-[#1E1F22] px-4 py-2 text-xs font-bold text-[#949BA4] uppercase tracking-wider border-b border-[#1F2023] select-none">
            <div className="col-span-5">Nombre</div>
            <div className="col-span-3">Fecha de modificación</div>
            <div className="col-span-2">Tipo</div>
            <div className="col-span-2 text-right">Tamaño</div>
          </div>

          {/* Files List */}
          {isLoading ? (
            <div className="grow flex items-center justify-center p-8 select-none empty-area-check">
              <Loader2 className="w-8 h-8 animate-spin text-[#B5BAC1]" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="grow flex items-center justify-center p-8 text-zinc-500 italic select-none empty-area-check">
              {searchQuery ? "No se encontraron archivos que coincidan con la búsqueda." : "Directorio vacío. Suelta archivos aquí o usa el botón 'Subir'."}
            </div>
          ) : (
            <div 
              onContextMenu={handleContainerContextMenu}
              className="divide-y divide-[#1F2023]/50 overflow-y-auto grow empty-area-check"
            >
              {filteredFiles.map((file) => {
                const isArchive = file.name.endsWith(".zip") || file.name.endsWith(".rar") || file.name.endsWith(".7z") || file.name.endsWith(".tar.gz") || file.name.endsWith(".tgz");
                const isExecutingAction = actionLoading === file.name;

                return (
                  <div
                    key={file.name}
                    onDoubleClick={() => {
                      if (file.isDirectory) {
                        handleFolderClick(file.name);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({
                        visible: true,
                        x: e.clientX,
                        y: e.clientY,
                        file: file,
                      });
                    }}
                    className={`grid grid-cols-12 px-4 py-2.5 text-sm items-center hover:bg-[#2B2D31] transition-colors group relative border-b border-[#1F2023]/30 ${
                      file.isDirectory ? "cursor-pointer select-none" : ""
                    }`}
                  >
                    {/* Col 1: Nombre y Tipo */}
                    <div className="col-span-5 flex items-center gap-2.5 overflow-hidden">
                      {file.isDirectory ? (
                        <Folder className="w-5 h-5 text-blue-400 shrink-0" />
                      ) : isArchive ? (
                        <FileArchive className="w-5 h-5 text-amber-500 shrink-0" />
                      ) : (
                        <File className="w-5 h-5 text-zinc-400 shrink-0" />
                      )}
                      
                      {file.isDirectory ? (
                        <span className="font-semibold text-white truncate">
                          {file.name}
                        </span>
                      ) : (
                        <span className="truncate text-[#DBDEE1]">{file.name}</span>
                      )}
                    </div>

                    {/* Col 2: Fecha Modificación */}
                    <div className="col-span-3 text-xs text-[#949BA4]">
                      {formatDate(file.mtime)}
                    </div>

                    {/* Col 3: Tipo */}
                    <div className="col-span-2 text-xs text-[#949BA4] truncate">
                      {getFileType(file)}
                    </div>

                    {/* Col 4: Tamaño y Menú de opciones */}
                    <div className="col-span-2 text-right text-xs font-mono text-[#949BA4] pr-8 relative flex items-center justify-end">
                      <span>{file.isDirectory ? "--" : formatSize(file.size)}</span>
                      
                      {/* Opciones (3 puntos en hover) */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
                        {isExecutingAction ? (
                          <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuFile(activeMenuFile === file.name ? null : file.name);
                            }}
                            className="p-1 text-[#949BA4] hover:text-white hover:bg-[#35373C] rounded transition opacity-0 group-hover:opacity-100 focus:opacity-100 z-10 cursor-pointer"
                            title="Opciones"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown Options Menu */}
                      {activeMenuFile === file.name && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuFile(null);
                            }}
                          />
                          <div className="absolute right-0 top-6 bg-[#111214] border border-[#1F2023] rounded-md shadow-2xl py-1 w-36 z-40 text-left font-sans select-none">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuFile(null);
                                setRenameTarget({ oldName: file.name, newName: file.name });
                              }}
                              className="w-full px-3 py-2 text-xs text-[#DBDEE1] hover:bg-[#5865F2] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Renombrar</span>
                            </button>
                            
                            {isArchive && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuFile(null);
                                  handleExtract(file.name);
                                }}
                                className="w-full px-3 py-2 text-xs text-[#23A55A] hover:bg-[#23A55A] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <PackageOpen className="w-3.5 h-3.5" />
                                <span>Extraer</span>
                              </button>
                            )}

                            {(file.name.endsWith(".jar") || file.name.endsWith(".sh")) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuFile(null);
                                  handleSetBoot(file.name);
                                }}
                                className="w-full px-3 py-2 text-xs text-[#60A5FA] hover:bg-[#5865F2] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>Boot</span>
                              </button>
                            )}

                            <div className="border-t border-[#1F2023]/60 my-1" />
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuFile(null);
                                setDeleteTarget(file.name);
                              }}
                              className="w-full px-3 py-2 text-xs text-[#F23F43] hover:bg-[#F23F43] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Trash className="w-3.5 h-3.5" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        id="hiddenFileInput"
        ref={fileInputRef}
        className="hidden"
        title="Seleccionar archivo para subir"
        aria-label="Seleccionar archivo para subir"
        onChange={handleFileSelect}
      />

      {/* ─── Modal Confirmar Eliminación ──────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-[440px] bg-[#2B2D31] rounded-lg shadow-2xl border border-[#1F2023] overflow-hidden flex flex-col select-none animate-in fade-in zoom-in-95 duration-100">
            <div className="px-5 py-4 border-b border-[#1F2023]">
              <h3 className="font-bold text-white text-base">Confirmar eliminación</h3>
            </div>
            <div className="p-5 text-sm text-[#B5BAC1] space-y-2">
              <p>¿Estás seguro de que deseas eliminar permanentemente <span className="text-white font-semibold font-mono">{deleteTarget}</span>?</p>
              <p className="text-xs text-[#F23F43]">Esta acción es irreversible y podría causar inestabilidad si borras archivos críticos del sistema.</p>
            </div>
            <div className="bg-[#232428] px-5 py-3.5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded text-xs font-semibold bg-[#4E5058] hover:bg-[#6D6F78] text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const target = deleteTarget;
                  setDeleteTarget(null);
                  await executeDelete(target);
                }}
                className="px-4 py-2 rounded text-xs font-semibold bg-[#F23F43] hover:bg-[#C93236] text-white transition-colors cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Crear Nueva Carpeta ────────────────────────────────────────── */}
      {isCreateFolderOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-[400px] bg-[#2B2D31] rounded-lg shadow-2xl border border-[#1F2023] overflow-hidden flex flex-col select-none animate-in fade-in zoom-in-95 duration-100">
            <div className="px-5 py-4 border-b border-[#1F2023]">
              <h3 className="font-bold text-white text-base">Crear Nueva Carpeta</h3>
            </div>
            <form onSubmit={handleCreateFolderSubmit}>
              <div className="p-5 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="newFolderNameInput" className="text-xs font-bold text-[#949BA4] uppercase">Nombre de la carpeta</label>
                  <input
                    type="text"
                    id="newFolderNameInput"
                    required
                    autoFocus
                    placeholder="Nueva Carpeta"
                    title="Nombre de la carpeta"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="bg-[#1E1F22] border border-[#1F2023] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5865F2] w-full"
                  />
                </div>
              </div>
              <div className="bg-[#232428] px-5 py-3.5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateFolderOpen(false);
                    setNewFolderName("");
                  }}
                  className="px-4 py-2 rounded text-xs font-semibold bg-[#4E5058] hover:bg-[#6D6F78] text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded text-xs font-semibold bg-[#5865F2] hover:bg-[#4752C4] text-white transition-colors cursor-pointer"
                >
                  Crear Carpeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Renombrar Elemento ─────────────────────────────────────────── */}
      {renameTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-[400px] bg-[#2B2D31] rounded-lg shadow-2xl border border-[#1F2023] overflow-hidden flex flex-col select-none animate-in fade-in zoom-in-95 duration-100">
            <div className="px-5 py-4 border-b border-[#1F2023]">
              <h3 className="font-bold text-white text-base">Renombrar elemento</h3>
            </div>
            <form onSubmit={handleRenameSubmit}>
              <div className="p-5 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="renameNameInput" className="text-xs font-bold text-[#949BA4] uppercase">Nuevo Nombre</label>
                  <input
                    type="text"
                    id="renameNameInput"
                    required
                    autoFocus
                    placeholder="Nuevo nombre"
                    title="Nuevo nombre"
                    value={renameTarget.newName}
                    onChange={(e) => setRenameTarget({ ...renameTarget, newName: e.target.value })}
                    className="bg-[#1E1F22] border border-[#1F2023] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5865F2] w-full"
                  />
                </div>
              </div>
              <div className="bg-[#232428] px-5 py-3.5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="px-4 py-2 rounded text-xs font-semibold bg-[#4E5058] hover:bg-[#6D6F78] text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded text-xs font-semibold bg-[#5865F2] hover:bg-[#4752C4] text-white transition-colors cursor-pointer"
                >
                  Renombrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Menú Contextual Flotante Nativo ────────────────────────────────────── */}
      {contextMenu && contextMenu.visible && (
        <div
          className="fixed bg-[#2B2D31] border border-[#1F2023] rounded-md shadow-2xl py-1 w-44 z-50 select-none text-left font-sans text-[#DBDEE1]"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.file ? (
            <>
              {/* Option: Copiar */}
              <button
                onClick={() => {
                  if (contextMenu.file) {
                    setClipboard({
                      file: contextMenu.file,
                      action: "copy",
                      sourcePath: currentPath,
                    });
                    setUploadStatus({ status: "success", message: `Copiado "${contextMenu.file.name}" al portapapeles.` });
                    setTimeout(() => setUploadStatus({ status: "idle" }), 3000);
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-xs text-[#DBDEE1] hover:bg-[#5865F2] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                <span>Copiar</span>
              </button>

              {/* Option: Mover/Cortar */}
              <button
                onClick={() => {
                  if (contextMenu.file) {
                    setClipboard({
                      file: contextMenu.file,
                      action: "move",
                      sourcePath: currentPath,
                    });
                    setUploadStatus({ status: "success", message: `Cortado "${contextMenu.file.name}" al portapapeles.` });
                    setTimeout(() => setUploadStatus({ status: "idle" }), 3000);
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-xs text-[#DBDEE1] hover:bg-[#5865F2] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                <span>Mover / Cortar</span>
              </button>

              {/* Option: Renombrar */}
              <button
                onClick={() => {
                  if (contextMenu.file) {
                    setRenameTarget({ oldName: contextMenu.file.name, newName: contextMenu.file.name });
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-xs text-[#DBDEE1] hover:bg-[#5865F2] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                <span>Renombrar</span>
              </button>

              {/* Option: Extraer (Conditional) */}
              {(contextMenu.file.name.endsWith(".zip") ||
                contextMenu.file.name.endsWith(".rar") ||
                contextMenu.file.name.endsWith(".7z") ||
                contextMenu.file.name.endsWith(".tar.gz") ||
                contextMenu.file.name.endsWith(".tgz")) && (
                <button
                  onClick={() => {
                    if (contextMenu.file) {
                      handleExtract(contextMenu.file.name);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-2 text-xs text-[#23A55A] hover:bg-[#23A55A] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <PackageOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>Extraer Aquí</span>
                </button>
              )}

              {/* Option: Boot (Conditional) */}
              {(contextMenu.file.name.endsWith(".jar") || contextMenu.file.name.endsWith(".sh")) && (
                <button
                  onClick={() => {
                    if (contextMenu.file) {
                      handleSetBoot(contextMenu.file.name);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-2 text-xs text-[#60A5FA] hover:bg-[#5865F2] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 shrink-0" />
                  <span>Boot</span>
                </button>
              )}

              {/* Option: Pegar (if clipboard is active) */}
              {clipboard && (
                <button
                  onClick={() => {
                    handlePaste();
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-2 text-xs text-emerald-400 hover:bg-[#5865F2] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Clipboard className="w-3.5 h-3.5 shrink-0" />
                  <span>Pegar</span>
                </button>
              )}

              <div className="border-t border-[#1F2023]/60 my-1" />

              {/* Option: Eliminar */}
              <button
                onClick={() => {
                  if (contextMenu.file) {
                    setDeleteTarget(contextMenu.file.name);
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-xs text-[#F23F43] hover:bg-[#F23F43] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Trash className="w-3.5 h-3.5 shrink-0" />
                <span>Eliminar</span>
              </button>
            </>
          ) : (
            <>
              {/* Option: Nueva Carpeta */}
              <button
                onClick={() => {
                  setIsCreateFolderOpen(true);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-xs text-[#DBDEE1] hover:bg-[#5865F2] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Nueva Carpeta</span>
              </button>

              {/* Option: Subir Archivo */}
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-xs text-[#DBDEE1] hover:bg-[#5865F2] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Subir Archivo</span>
              </button>

              {/* Option: Pegar (if clipboard is active) */}
              {clipboard && (
                <button
                  onClick={() => {
                    handlePaste();
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-2 text-xs text-emerald-400 hover:bg-[#5865F2] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Clipboard className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Pegar</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
