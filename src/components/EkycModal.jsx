import React, { useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ShieldCheck, Camera, User, FileText, ArrowRight, ArrowLeft, RefreshCw, CheckCircle, Clock, Upload, CameraOff as CameraReverse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import Webcam from "react-webcam";

const steps = [
  { id: 1, name: 'Bienvenue', icon: User },
  { id: 2, name: 'Document', icon: FileText },
  { id: 3, name: 'Selfie', icon: Camera },
  { id: 4, name: 'Révision', icon: CheckCircle },
  { id: 5, name: 'Finalisation', icon: Clock },
];

const EkycModal = ({ isOpen, onClose, onComplete, user }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [docType, setDocType] = useState(null);
  const [docFront, setDocFront] = useState(null);
  const [docBack, setDocBack] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isCapturing, setIsCapturing] = useState(null); // 'front', 'back', 'selfie'
  const [cameraFacingMode, setCameraFacingMode] = useState('user');

  const webcamRef = useRef(null);
  const docFrontUploadRef = useRef(null);
  const docBackUploadRef = useRef(null);
  const progress = (currentStep / steps.length) * 100;

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (isCapturing === 'front') setDocFront(imageSrc);
    if (isCapturing === 'back') setDocBack(imageSrc);
    if (isCapturing === 'selfie') setSelfie(imageSrc);
    setIsCapturing(null);
  }, [webcamRef, isCapturing]);

  const handleFileUpload = (e, side) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === 'front') setDocFront(reader.result);
        if (side === 'back') setDocBack(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleCamera = () => {
    setCameraFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };
  
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  
  const handleDocSelect = (type) => {
    setDocType(type);
    nextStep();
  };
  
  const handleStartCapture = (side) => {
    setIsCapturing(side);
  };

  const handleReview = () => {
    setExtractedData({
      name: user?.full_name || 'N/A',
      dob: '01/01/1990',
      docNumber: 'XA12345678',
    });
    nextStep();
  }

  const handleFinalSubmit = () => {
    nextStep();
    setTimeout(() => {
      onComplete();
    }, 1500);
  };
  
  const videoConstraints = {
    facingMode: isCapturing === 'selfie' ? 'user' : 'environment'
  };

  const renderStepContent = () => {
    if (isCapturing) {
        return (
            <motion.div key={`${currentStep}-cam`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
                <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="rounded-xl w-full" videoConstraints={videoConstraints} />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    { isCapturing === 'selfie' && <div className="w-64 h-64 rounded-full border-4 border-dashed border-white/50" /> }
                    { (isCapturing === 'front' || isCapturing === 'back') && <div className="w-full h-2/3 rounded-xl border-4 border-dashed border-white/50" style={{width: '90%'}} /> }
                </div>

                <div className="absolute bottom-4 w-full flex justify-center items-center gap-4">
                    <Button onClick={toggleCamera} variant="outline" size="icon" className="rounded-full h-12 w-12"><CameraReverse className="h-6 w-6" /></Button>
                    <Button onClick={capture} size="lg" className="rounded-full h-16 w-16 p-0"><Camera className="h-8 w-8" /></Button>
                    <Button onClick={() => setIsCapturing(null)} variant="ghost" size="icon" className="rounded-full h-12 w-12"><X className="h-6 w-6" /></Button>
                </div>
            </motion.div>
        )
    }

    switch(currentStep) {
      case 1: // Welcome
        return (
          <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
            <ShieldCheck className="mx-auto h-16 w-16 text-green-500" />
            <h3 className="mt-4 text-2xl font-bold">Vérification d'Identité Sécurisée</h3>
            <p className="mt-2 text-muted-foreground">Le processus est rapide et sécurisé. Préparez votre pièce d'identité et assurez-vous d'avoir une bonne luminosité.</p>
            <Button onClick={nextStep} className="mt-8 w-full">Commencer <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </motion.div>
        );
      case 2: // Doc Select & Capture
        return (
          <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h3 className="text-2xl font-bold text-center">Capturez votre document</h3>
            <p className="text-muted-foreground text-center mt-2">Sélectionnez le type de document puis prenez une photo du recto et du verso.</p>

             <div className="mt-6 space-y-4">
              <input type="file" accept="image/*" ref={docFrontUploadRef} onChange={(e) => handleFileUpload(e, 'front')} className="hidden" />
              <input type="file" accept="image/*" ref={docBackUploadRef} onChange={(e) => handleFileUpload(e, 'back')} className="hidden" />
              
              {!docType ? (
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <button onClick={() => setDocType('passport')} className="flex flex-col items-center justify-center p-6 border-2 border-border rounded-xl hover:border-primary transition-colors bg-background">
                        <FileText className="h-12 w-12 text-primary" />
                        <span className="mt-2 font-semibold">Passeport</span>
                    </button>
                    <button onClick={() => setDocType('idcard')} className="flex flex-col items-center justify-center p-6 border-2 border-border rounded-xl hover:border-primary transition-colors bg-background">
                        <User className="h-12 w-12 text-primary" />
                        <span className="mt-2 font-semibold">Carte d'Identité</span>
                    </button>
                </div>
              ) : (
                <div className="space-y-4">
                    <div className="p-4 border rounded-xl bg-muted/30">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {docFront ? <img src={docFront} alt="Recto document" className="w-16 h-10 object-cover rounded-md"/> : <div className="w-16 h-10 bg-muted rounded-md flex items-center justify-center"><FileText className="h-6 w-6 text-muted-foreground"/></div>}
                            <span className="font-semibold">Recto du document</span>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => docFrontUploadRef.current.click()} variant="outline" size="sm"><Upload className="mr-2 h-4 w-4" /> Importer</Button>
                            <Button onClick={() => handleStartCapture('front')} size="sm">Capturer <Camera className="ml-2 h-4 w-4" /></Button>
                        </div>
                        </div>
                    </div>
                    {docType === 'idcard' && (
                        <div className="p-4 border rounded-xl bg-muted/30">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                {docBack ? <img src={docBack} alt="Verso document" className="w-16 h-10 object-cover rounded-md"/> : <div className="w-16 h-10 bg-muted rounded-md flex items-center justify-center"><FileText className="h-6 w-6 text-muted-foreground"/></div>}
                                <span className="font-semibold">Verso du document</span>
                                </div>
                                <div className="flex gap-2">
                                <Button onClick={() => docBackUploadRef.current.click()} variant="outline" size="sm" disabled={!docFront}><Upload className="mr-2 h-4 w-4" /> Importer</Button>
                                <Button onClick={() => handleStartCapture('back')} size="sm" disabled={!docFront}>Capturer <Camera className="ml-2 h-4 w-4" /></Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
              )}
            </div>
            
            {(docFront && (docType === 'idcard' ? docBack : true)) && (
               <Button onClick={nextStep} className="mt-8 w-full">Continuer <ArrowRight className="ml-2 h-4 w-4" /></Button>
            )}
          </motion.div>
        );
      case 3: // Selfie
        return (
          <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
            <h3 className="text-2xl font-bold">Prenez un selfie</h3>
            <p className="mt-2 text-muted-foreground">Assurez-vous que votre visage est bien éclairé et centré.</p>
            {!selfie ? (
                <div className="mt-6 flex flex-col items-center gap-4">
                    <div className="w-48 h-48 rounded-full bg-muted flex items-center justify-center"><User className="w-24 h-24 text-muted-foreground" /></div>
                    <Button onClick={() => handleStartCapture('selfie')} className="w-full max-w-xs">Prendre un selfie <Camera className="ml-2 h-4 w-4"/></Button>
                </div>
            ) : (
              <>
                <img src={selfie} alt="selfie" className="rounded-full mx-auto w-48 h-48 object-cover mt-4 border-4 border-green-500" />
                <div className="flex justify-center gap-4 mt-4">
                  <Button variant="outline" onClick={() => setSelfie(null)}><RefreshCw className="mr-2 h-4 w-4" /> Recommencer</Button>
                  <Button onClick={handleReview}>Continuer <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </>
            )}
          </motion.div>
        );
      case 4: // Review
        return (
          <motion.div key="4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h3 className="text-2xl font-bold text-center">Vérifiez vos informations</h3>
            <div className="mt-6 space-y-3 p-4 border rounded-xl bg-muted/50">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Nom complet</span>
                <span className="font-semibold">{extractedData?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Date de naissance</span>
                <span className="font-semibold">{extractedData?.dob}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">N° Document</span>
                <span className="font-semibold">{extractedData?.docNumber}</span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
                <img src={docFront} alt="Recto" className="rounded-lg object-cover aspect-video" />
                {docBack && <img src={docBack} alt="Verso" className="rounded-lg object-cover aspect-video" />}
                <img src={selfie} alt="Selfie" className="rounded-lg object-cover aspect-square" />
            </div>
            <p className="text-xs text-center mt-4 text-muted-foreground">Ces informations sont-elles correctes ?</p>
            <Button onClick={handleFinalSubmit} className="mt-6 w-full">Confirmer et Soumettre</Button>
          </motion.div>
        );
      case 5: // Finalization
        return (
          <motion.div key="5" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 animate-pulse" />
            <h3 className="mt-4 text-2xl font-bold">Vérification en cours</h3>
            <p className="mt-2 text-muted-foreground">Vos documents ont été soumis. La vérification finale prend généralement moins de 5 minutes. Nous vous préviendrons.</p>
          </motion.div>
        );
      default:
        return null;
    }
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="bg-card rounded-2xl shadow-2xl max-w-lg w-full m-0 sm:m-4 border border-border flex flex-col max-h-[95vh]"
        >
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <h2 className="text-lg font-semibold">{steps[currentStep-1].name}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button>
          </div>

          <div className="p-4 sm:p-6 min-h-[450px] flex flex-col justify-center overflow-y-auto">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </div>

          <div className="p-4 border-t flex-shrink-0">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between items-center mt-2">
              <div>
                {currentStep > 1 && currentStep < steps.length && (
                  <Button variant="ghost" onClick={prevStep}><ArrowLeft className="mr-2 h-4 w-4" />Précédent</Button>
                )}
              </div>
              <span className="text-sm text-muted-foreground">Étape {currentStep} sur {steps.length}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EkycModal;