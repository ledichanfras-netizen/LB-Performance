import React, { useState, useRef } from "react";
import { Athlete } from "../types";
import { Camera, Upload, Trash2, User, X, Pencil, Eye, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";

interface ProfilePhotoOptionsModalProps {
  isOpen: boolean;
  athlete: Athlete | null;
  onClose: () => void;
  onUploadPhoto: (base64: string) => void;
  onRemovePhoto: () => void;
  onEditProfileData: () => void;
}

export const processProfileImageFile = (file: File, callback: (base64: string) => void) => {
  if (!file.type.startsWith("image/")) {
    toast.error("Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_SIZE = 600;
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
      callback(dataUrl);
    };
    img.onerror = () => {
      toast.error("Erro ao processar imagem.");
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

export const ProfilePhotoOptionsModal: React.FC<ProfilePhotoOptionsModalProps> = ({
  isOpen,
  athlete,
  onClose,
  onUploadPhoto,
  onRemovePhoto,
  onEditProfileData,
}) => {
  const [showFullImage, setShowFullImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !athlete) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processProfileImageFile(file, (base64) => {
        onUploadPhoto(base64);
        toast.success("Foto de perfil atualizada com sucesso! 📷");
        onClose();
      });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-md p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left"
        >
          {/* Header & Close */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-primary">
                Gerenciamento de Perfil
              </span>
              <h2 className="text-xl font-black italic uppercase text-white tracking-tight">
                Editar Foto & Perfil
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-all hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Avatar Circle & Preview */}
          <div className="flex flex-col items-center justify-center my-4">
            <div className="relative group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-800 border-4 border-slate-700/80 p-1 shadow-2xl overflow-hidden flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
                {athlete.photoUrl ? (
                  <img
                    src={athlete.photoUrl}
                    alt={athlete.name}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-16 h-16 text-slate-500" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-brand-primary text-slate-950 flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer border-2 border-slate-900"
                title="Carregar nova foto"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-base font-black uppercase text-white mt-3 italic tracking-tight">
              {athlete.name}
            </h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {athlete.modality || "Preparação Física"}
            </p>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Action Options List */}
          <div className="space-y-3 mt-6">
            {/* Option 1: Choose/Change Photo */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-brand-primary/50 text-white transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 group-hover:bg-brand-primary group-hover:text-slate-950 transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-black uppercase tracking-wider text-white">
                    {athlete.photoUrl ? "Alterar Foto de Perfil" : "Escolher Foto de Perfil"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Selecione uma foto da sua galeria ou câmera
                  </div>
                </div>
              </div>
              <span className="text-xs text-brand-primary font-bold">→</span>
            </button>

            {/* Option 2: View Full Size Photo (if exists) */}
            {athlete.photoUrl && (
              <button
                type="button"
                onClick={() => setShowFullImage(true)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 text-white transition-all group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black uppercase tracking-wider text-white">
                      Ver Foto em Tamanho Cheio
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Visualizar a imagem atual ampliada
                    </div>
                  </div>
                </div>
                <span className="text-xs text-blue-400 font-bold">→</span>
              </button>
            )}

            {/* Option 3: Edit Profile Info */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditProfileData();
              }}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/50 text-white transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                  <Pencil className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-black uppercase tracking-wider text-white">
                    Editar Dados do Perfil
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Alterar nome, data de nascimento e modalidade
                  </div>
                </div>
              </div>
              <span className="text-xs text-emerald-400 font-bold">→</span>
            </button>

            {/* Option 4: Remove Photo (if exists) */}
            {athlete.photoUrl && (
              <button
                type="button"
                onClick={() => {
                  onRemovePhoto();
                  toast.success("Foto de perfil removida com sucesso.");
                  onClose();
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-500/50 text-red-400 transition-all group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 group-hover:bg-red-500 group-hover:text-white transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black uppercase tracking-wider text-red-400">
                      Remover Foto Atual
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Voltar a utilizar a ilustração padrão
                    </div>
                  </div>
                </div>
                <span className="text-xs text-red-400 font-bold">×</span>
              </button>
            )}
          </div>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-black uppercase tracking-wider border border-slate-800 transition-all"
          >
            Cancelar
          </button>
        </motion.div>

        {/* Full Image Preview Modal */}
        {showFullImage && athlete.photoUrl && (
          <div
            className="fixed inset-0 z-[1300] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowFullImage(false)}
          >
            <div className="relative max-w-2xl max-h-[85vh] p-2 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col items-center">
              <button
                onClick={() => setShowFullImage(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-950/80 text-white flex items-center justify-center border border-slate-700"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={athlete.photoUrl}
                alt={athlete.name}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 mt-3">
                {athlete.name}
              </span>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
