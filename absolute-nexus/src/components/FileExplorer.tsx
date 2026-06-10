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
  Play
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
      "minecraft-server": "/var/minecraft/server",
      "www-grooming":     "/var/www/grooming",
      "www-nexus":        "/var/www/absolute-nexus",
      "home-root":        "/root",
    };
    return map[channel] || "/var/minecraft/server";
  };

  const [currentPath, setCurrentPath] = useState<string>("/var/minecraft/server");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // name of file executing action
  const [dragActive, setDragActive] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{
    status: "idle" | "uploading" | "success" | "error";
    message?: string;
  }>({ status: "idle" });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize path when activeChannel changes
  useEffect(() => {
    setCurrentPath(getChannelBasePath(activeChannel));
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

  // Navigate into a directory
  const handleFolderClick = (folderName: string) => {
    setCurrentPath((prev) => (prev ? `${prev}/${folderName}` : folderName));
  };

  // Go up to the parent directory
  const handleGoUp = () => {
    const basePath = getChannelBasePath(activeChannel);
    if (currentPath === basePath) return;
    const parts = currentPath.split("/");
    parts.pop();
    const parentPath = parts.join("/");
    if (parentPath.startsWith(basePath)) {
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

  return (
    <div className="flex-1 flex flex-col bg-[#313338] h-full overflow-hidden text-[#DBDEE1]">
      
      {/* Barra de Control Superior */}
      <div className="bg-[#2B2D31] p-3 border-b border-[#1F2023] flex items-center justify-between flex-wrap gap-2.5">
        
        {/* Breadcrumbs / Ruta */}
        <div className="flex items-center gap-2 font-mono text-sm max-w-full overflow-x-auto whitespace-nowrap">
          {currentPath !== getChannelBasePath(activeChannel) ? (
            <button
              onClick={handleGoUp}
              className="p-1.5 hover:bg-[#35373C] hover:text-white rounded transition flex items-center justify-center cursor-pointer text-white"
              title="Subir de nivel"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="p-1.5 text-zinc-500">
              <FolderOpen className="w-4 h-4" />
            </div>
          )}

          {currentPath.split("/").filter(Boolean).map((part, index, arr) => {
            const pathUpTo = "/" + arr.slice(0, index + 1).join("/");
            const basePath = getChannelBasePath(activeChannel);
            const isClickable = pathUpTo.startsWith(basePath);
            
            return (
              <React.Fragment key={index}>
                {index > 0 && <span className="text-[#80848E]">/</span>}
                {isClickable ? (
                  <button
                    onClick={() => setCurrentPath(pathUpTo)}
                    className="hover:text-white hover:underline font-semibold"
                  >
                    {part}
                  </button>
                ) : (
                  <span className="text-[#80848E] font-medium">{part}</span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Botón de Carga */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            aria-label="Seleccionar archivo para subir"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#5865F2] hover:bg-[#4752C4] text-white cursor-pointer shadow-sm transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Subir Archivo</span>
          </button>
        </div>
      </div>

      {/* Dropzone & File List Wrapper */}
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

        {/* Tabla de Archivos */}
        <div className="flex-grow bg-[#2B2D31] rounded-lg border border-[#1F2023] overflow-hidden min-h-[300px] flex flex-col">
          
          {/* Header */}
          <div className="grid grid-cols-12 bg-[#1E1F22] px-4 py-2 text-xs font-bold text-[#949BA4] uppercase tracking-wider border-b border-[#1F2023] select-none">
            <div className="col-span-6 md:col-span-7">Nombre</div>
            <div className="col-span-3 md:col-span-2 text-right">Tamaño</div>
            <div className="col-span-3 md:col-span-3 text-right">Fecha Modificación</div>
          </div>

          {/* Files List */}
          {isLoading ? (
            <div className="grow flex items-center justify-center p-8 select-none">
              <Loader2 className="w-8 h-8 animate-spin text-[#B5BAC1]" />
            </div>
          ) : files.length === 0 ? (
            <div className="grow flex items-center justify-center p-8 text-zinc-500 italic select-none">
              Directorio vacío. Suelta archivos aquí para subirlos.
            </div>
          ) : (
            <div className="divide-y divide-[#1F2023] overflow-y-auto">
              {files.map((file) => {
                const isZip = file.name.endsWith(".zip");
                const isExtractingOrDeleting = actionLoading === file.name;

                return (
                  <div
                    key={file.name}
                    onDoubleClick={() => {
                      if (file.isDirectory) {
                        handleFolderClick(file.name);
                      }
                    }}
                    className={`grid grid-cols-12 px-4 py-2.5 text-sm items-center hover:bg-[#35373C]/50 transition-colors group relative ${
                      file.isDirectory ? "cursor-pointer select-none" : ""
                    }`}
                  >
                    {/* Nombre y Tipo */}
                    <div className="col-span-6 md:col-span-7 flex items-center gap-2.5 overflow-hidden">
                      {file.isDirectory ? (
                        <Folder className="w-5 h-5 text-blue-400 shrink-0" />
                      ) : isZip ? (
                        <FileArchive className="w-5 h-5 text-amber-500 shrink-0" />
                      ) : (
                        <File className="w-5 h-5 text-zinc-400 shrink-0" />
                      )}
                      
                      {file.isDirectory ? (
                        <span className="font-medium text-white truncate">
                          {file.name}
                        </span>
                      ) : (
                        <span className="truncate">{file.name}</span>
                      )}
                    </div>

                    {/* Tamaño */}
                    <div className="col-span-3 md:col-span-2 text-right text-xs font-mono text-[#949BA4]">
                      {file.isDirectory ? "Carpeta" : formatSize(file.size)}
                    </div>

                    {/* Fecha y Acciones al Hover */}
                    <div className="col-span-3 md:col-span-3 text-right text-xs text-[#949BA4] relative flex items-center justify-end">
                      {/* Fecha de modificación estática (se oculta en hover) */}
                      <span className="group-hover:opacity-0 transition-opacity duration-100 pr-1">
                        {formatDate(file.mtime)}
                      </span>

                      {/* Botones de acción flotantes (solo visibles en hover) */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 bg-[#2B2D31] pl-2 z-10 transition-opacity duration-100 select-none">
                        {isExtractingOrDeleting ? (
                          <div className="flex items-center gap-1 px-2 py-1 text-xs text-[#B5BAC1]">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Procesando...</span>
                          </div>
                        ) : (
                          <>
                            {isZip && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExtract(file.name);
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-[#23A55A]/20 hover:bg-[#23A55A] text-[#23A55A] hover:text-white transition-colors cursor-pointer"
                                title="Extraer ZIP aquí"
                              >
                                <PackageOpen className="w-3.5 h-3.5" />
                                <span>Extraer</span>
                              </button>
                            )}
                            {(file.name.endsWith(".jar") || file.name.endsWith(".sh")) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetBoot(file.name);
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-[#5865F2]/20 hover:bg-[#5865F2] text-[#5865F2] hover:text-white transition-colors cursor-pointer"
                                title="Establecer como arranque en start.sh"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>Boot</span>
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(file.name);
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-[#F23F43]/20 hover:bg-[#F23F43] text-[#F23F43] hover:text-white transition-colors cursor-pointer"
                              title="Eliminar permanentemente"
                            >
                              <Trash className="w-3.5 h-3.5" />
                              <span>Eliminar</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-[440px] bg-[#2B2D31] rounded-lg shadow-2xl border border-[#1F2023] overflow-hidden flex flex-col">
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
    </div>
  );
}
