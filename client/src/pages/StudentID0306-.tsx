import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Loader2, Download, CheckCircle2, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function StudentID() {
  const { user, refetch } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idCardRef = useRef<HTMLDivElement>(null);

  const enrollmentsQuery = trpc.students.getMyEnrollments.useQuery();
  const activeEnrollment = enrollmentsQuery.data?.[0];

  const uploadPhotoMutation = trpc.auth.updateProfileImage.useMutation({
    onSuccess: () => {
      toast.success("Foto de perfil atualizada!");
      // Recarrega os dados do usuário para atualizar a foto na carteirinha
      if (typeof refetch === 'function') {
        refetch();
      } else {
        window.location.reload();
      }
      setIsUploading(false);
    },
    onError: (error) => {
      console.error("Erro no upload:", error);
      toast.error(error.message || "Erro ao fazer upload da foto");
      setIsUploading(false);
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação básica de tamanho (ex: 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      uploadPhotoMutation.mutate({
        base64Image: reader.result as string,
        contentType: file.type
      });
    };
    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Função para garantir que a URL da imagem esteja correta
  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    // Se a URL começar com /, remove para não duplicar
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${window.location.origin}/${cleanUrl}`;
  };

  const downloadPDF = async () => {
    if (!idCardRef.current) return;
    
    try {
      setIsGeneratingPDF(true);
      toast.info("Gerando sua carteirinha...");

      const element = idCardRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [85, 135], 
      });

      pdf.addImage(imgData, "JPEG", 0, 0, 85, 135);
      pdf.save(`Carteirinha_${user?.name?.split(" ")[0] || "Estudante"}.pdf`);
      
      toast.success("Download concluído!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Falha ao gerar o PDF. Tente novamente.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const validUntil = "20/12/2026"; 
  const logoUrl = "/fapegma-logo.jpg"; 
  const profilePhoto = getImageUrl(user?.profileImageUrl);

  const styles = {
    container: { minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '48px', fontFamily: 'Arial, sans-serif' },
    header: { backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px', position: 'sticky' as const, top: 0, zIndex: 10 },
    cardWrapper: { width: '100%', maxWidth: '350px', margin: '0 auto', position: 'relative' as const },
    card: { 
      width: '100%', 
      aspectRatio: '1/1.58', 
      backgroundColor: '#ffffff', 
      borderRadius: '40px', 
      overflow: 'hidden', 
      position: 'relative' as const,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0'
    },
    cardContent: { padding: '32px', height: '100%', display: 'flex', flexDirection: 'column' as const, boxSizing: 'border-box' as const },
    logoBox: { width: '64px', height: '64px', backgroundColor: '#003366', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    photoBox: { width: '96px', height: '112px', backgroundColor: '#f1f5f9', borderRadius: '12px', border: '2px solid #e2e8f0', overflow: 'hidden' },
    label: { fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.1em' },
    value: { fontSize: '18px', fontWeight: 'bold', color: '#1e293b' },
    badge: { position: 'absolute' as const, top: '-12px', right: '-12px', backgroundColor: '#22c55e', color: '#ffffff', padding: '4px 16px', borderRadius: '9999px', fontSize: '12px', fontWeight: 'bold', border: '2px solid #ffffff', zIndex: 5 }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ maxWidth: '448px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/student">
            <Button variant="ghost" size="icon" style={{ borderRadius: '9999px' }}>
              <ArrowLeft style={{ width: '20px', height: '20px' }} />
            </Button>
          </Link>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Carteirinha Digital</h1>
        </div>
      </div>

      <div style={{ maxWidth: '448px', margin: '32px auto 0', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{ width: '128px', height: '128px', borderRadius: '16px', backgroundColor: '#e2e8f0', border: '4px solid #ffffff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isUploading ? (
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              ) : profilePhoto ? (
                <img src={profilePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
              ) : (
                <Camera style={{ width: '40px', height: '40px', color: '#94a3b8' }} />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading}
              style={{ position: 'absolute', bottom: '-8px', right: '-8px', backgroundColor: '#003366', color: '#ffffff', padding: '8px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
            >
              <Camera style={{ width: '20px', height: '20px' }} />
            </button>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
          </div>
          <p className="mt-4 text-xs text-slate-500 font-medium">Clique no ícone da câmera para enviar sua foto</p>
        </div>

        <div ref={idCardRef} style={styles.cardWrapper}>
          <div style={styles.card}>
            <div style={styles.cardContent}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={styles.logoBox}>
                    <img src={logoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" onError={(e) => e.currentTarget.src = "https://placehold.co/100x100/003366/white?text=FP"} />
                  </div>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#003366' }}>FAPEGMA</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Faculdade de Imperatriz</div>
                  </div>
                </div>
                <div style={styles.photoBox}>
                  {profilePhoto && <img src={profilePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />}
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#003366', textTransform: 'uppercase', margin: 0 }}>{user?.name}</h3>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={styles.label}>RA</div>
                  <div style={styles.value}>{activeEnrollment?.registrationNumber || "---"}</div>
                </div>
                <div>
                  <div style={styles.label}>Curso</div>
                  <div style={styles.value}>{activeEnrollment?.courseName || "---"}</div>
                </div>
                <div>
                  <div style={styles.label}>Campus</div>
                  <div style={{ fontSize: '14px', color: '#475569' }}>Campus Imperatriz</div>
                </div>
              </div>

              <div style={{ paddingTop: '20px', borderTop: '2px dashed #e2e8f0', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={styles.label}>Validade</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{validUntil}</div>
                </div>
                <div style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck style={{ width: '12px', height: '12px' }} /> AUTÊNTICA
                </div>
              </div>
            </div>
          </div>
          <div style={styles.badge}><CheckCircle2 style={{ width: '12px', height: '12px', marginRight: '4px' }} /> ATIVO</div>
        </div>

        <Button onClick={downloadPDF} disabled={isGeneratingPDF || isUploading} style={{ width: '100%', height: '48px', backgroundColor: '#003366', color: '#ffffff' }}>
          {isGeneratingPDF ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
          Baixar Carteirinha (PDF)
        </Button>
      </div>
    </div>
  );
}
