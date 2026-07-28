import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { ConditionCard } from './components/ConditionCard';
import { InteractiveBodyMap } from './components/InteractiveBodyMap';
import { generateClinicalReport, analyzeMedication, chatDiagnosis } from './services/assistantDoctorService';

import { speakWithElevenLabs, stopSpeaking } from './services/elevenLabsService';
import { DiagnosisState, MedicationState, ViewMode } from './types';
import { animate } from 'animejs';
import { LandingCards } from './components/LandingCards';
import { LandingSteps } from './components/LandingSteps';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Dashboard } from './components/Dashboard';
import { User } from './types';
import { getStoredUser, initGoogleAuth, promptGoogleSignIn, googleSignOut } from './services/authService';
import { supabase } from './services/supabase';
import { Sparkles, AlertOctagon, ArrowRight, FileText, Printer, Stethoscope, Zap, X, Mail, Copy, Check, ExternalLink, Heart, Image as ImageIcon, Pill, Camera, Calendar, Factory, AlertTriangle, Info, ShieldCheck, Clock, Database, Mic, ChevronRight, ChevronDown } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react";

const VIEW_PATHS: Record<ViewMode, string> = {
  landing: '/',
  home: '/home',
  diagnosis: '/diagnosis',
  medication: '/medication',
  about: '/about',
  privacy: '/privacy',
};

const PATH_VIEWS: Record<string, ViewMode> = Object.fromEntries(
  Object.entries(VIEW_PATHS).map(([view, path]) => [path, view as ViewMode])
);

const getInitialView = (): ViewMode => {
  const path = window.location.pathname;
  return PATH_VIEWS[path] || 'landing';
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(getInitialView);
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMedImages, setSelectedMedImages] = useState<string[]>([]);
  const [diagnosisState, setDiagnosisState] = useState<DiagnosisState>({
    results: null,
    loading: false,
    error: null,
    messages: [{ role: 'assistant', content: "How can I help you?" }],
    is_emergency: false,
    is_complete: false,
  });
  
  const [emergencySteps, setEmergencySteps] = useState<string[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [showReportPrompt, setShowReportPrompt] = useState(false);
  const [notebookEntries, setNotebookEntries] = useState<{icon: string; label: string; value: string}[]>([]);
  const [rightTab, setRightTab] = useState<'map' | 'notes'>('map');
  const [hasNewNotes, setHasNewNotes] = useState(false);
  const notebookContainerRef = useRef<HTMLDivElement>(null);
  const [medicationState, setMedicationState] = useState<MedicationState>({
    results: null,
    loading: false,
    error: null,
  });
  const isLoadingDiagnosis = diagnosisState.loading;
  const isLoadingMedication = medicationState.loading;
  const latest_assistant_message = [...diagnosisState.messages]
    .reverse()
    .find((message) => message.role === 'assistant')?.content || "How can I help you?";
  const latest_user_message = [...diagnosisState.messages]
    .reverse()
    .find((message) => message.role === 'user')?.content || '';
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportHtml, setReportHtml] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [currentDiagnosisId, setCurrentDiagnosisId] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const resultsRef = useRef<HTMLDivElement>(null);
  const medResultsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [symptomPickerZone, setSymptomPickerZone] = useState<string | null>(null);
  const [doctorTone, setDoctorTone] = useState<string>('neutral');
  const [diagnosticConfidence, setDiagnosticConfidence] = useState<number>(0);
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [closingSummary, setClosingSummary] = useState<string>('');
  const [hasUsedFreeTrial, setHasUsedFreeTrial] = useState(() => {
    return localStorage.getItem('tabib_free_trial_used') === 'true';
  });

  useEffect(() => {
    initGoogleAuth((u) => setUser(u));
  }, []);

  const requiresAuth = (viewMode: ViewMode): boolean => {
    if (viewMode === 'diagnosis' || viewMode === 'medication') {
      return hasUsedFreeTrial && !user;
    }
    return false;
  };

  const markFreeTrialUsed = () => {
    if (!user && !hasUsedFreeTrial) {
      localStorage.setItem('tabib_free_trial_used', 'true');
      setHasUsedFreeTrial(true);
    }
  };

  const saveDiagnosisToSupabase = async (messages: { role: string; content: string }[], results: any, isEmergency: boolean): Promise<string | null> => {
    if (!user || !results) return null;
    try {
      const { data, error } = await supabase.from('diagnoses').insert({
        user_email: user.email,
        user_name: user.name,
        type: 'diagnosis',
        conditions: JSON.stringify(results.conditions || []),
        messages: JSON.stringify(messages),
        general_advice: results.general_advice || '',
        disclaimer: results.disclaimer || '',
        is_emergency: isEmergency,
      }).select('id').single();
      if (error) return null;
      return data?.id || null;
    } catch {
      return null;
    }
  };

  const saveMedicationToSupabase = async (prompt: string, results: any) => {
    if (!user || !results) return;
    try {
      await supabase.from('diagnoses').insert({
        user_email: user.email,
        user_name: user.name,
        type: 'medication',
        conditions: JSON.stringify([{ name: results.medication?.name || prompt, urgency: 'Low', probability: results.analysis_confidence || 0, description: results.medication?.generic_name || '', recommendations: results.medication?.clinical_info?.uses || [] }]),
        messages: JSON.stringify([{ role: 'user', content: prompt }, { role: 'assistant', content: `Analyzed ${results.medication?.name || 'medication'} with ${results.analysis_confidence || 0}% confidence.` }]),
        general_advice: results.medication?.clinical_info?.warnings || '',
        disclaimer: results.disclaimer || '',
        is_emergency: false,
        medication_data: JSON.stringify(results),
      });
    } catch {
      // silent fail
    }
  };

  const speakText = (text: string) => {
    const cleanText = text.replace(/[*#_`]/g, '');
    speakWithElevenLabs(cleanText);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  useEffect(() => {
    if (latest_assistant_message && latest_assistant_message !== "How can I help you?") {
      speakText(latest_assistant_message);
    }
  }, [latest_assistant_message]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      const newView = PATH_VIEWS[path] || 'landing';
      setView(newView);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!notebookContainerRef.current) return;
    const items = notebookContainerRef.current.querySelectorAll('.notebook-entry');
    if (items.length === 0) return;
    const lastItem = items[items.length - 1] as HTMLElement;
    animate(lastItem, {
      opacity: [0, 1],
      translateX: [30, 0],
      duration: 400,
      ease: 'outQuad',
    });
  }, [notebookEntries]);



  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (inputContainerRef.current) {
      const rect = inputContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      inputContainerRef.current.style.setProperty('--mouse-x', `${x}px`);
      inputContainerRef.current.style.setProperty('--mouse-y', `${y}px`);
    }
  };

  const handleViewChange = (newView: ViewMode) => {
    if (requiresAuth(newView)) {
      promptGoogleSignIn();
      return;
    }
    if (newView === 'diagnosis' || newView === 'medication') {
      markFreeTrialUsed();
    }
    stopSpeaking();
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
    setView(newView);
    window.history.pushState({}, '', VIEW_PATHS[newView] || '/');
    setInput('');
    setSelectedImage(null);
    setQuickReplies([]);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (err) {
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  useEffect(() => {
    if (showCamera && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [showCamera, stream]);

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        if (view === 'medication') {
          setSelectedMedImages(prev => prev.length < 2 ? [...prev, dataUrl] : prev);
        } else {
          setSelectedImage(dataUrl);
        }
        stopCamera();
      }
    }
  };

  const get_symptom_visual_key = (text: string): string => {
    const t = text.toLowerCase();
    if (!t.trim()) return 'neutral';

    if (/(head(?!er)|headache|migraine|skull|dizzy|vertigo|vision|blur|concussion|forehead|temples?)/.test(t)) return 'head';
    if (/(face|facial|jaw|cheek|sinus|dry eyes?|eye pain|eye strain)/.test(t)) return 'face';
    if (/(ear|hearing|ringing|tinnitus|vertigo|earache|ear infection)/.test(t)) return 'ears';
    if (/(throat|swallow|hoarse|sore throat|tonsil|neck(?!ache)|gland|chok)/.test(t)) return 'throat';
    if (/(chest|heart|cardiac|palpitat|shortness of breath|breath|wheeze|rib|breastbone)/.test(t)) return 'chest';
    if (/(stomach|abdom|belly|gut|nausea|vomit|diarr|constipat|acid|reflux|ulcer|bloat)/.test(t)) return 'stomach';
    if (/(pelvis?|lower abdominal|bladder|urin|blood in urine|frequent urin)/.test(t)) return 'pelvis';
    if (/(upper back|shoulder blade|between shoulders|thoracic)/.test(t)) return 'upper_back';
    if (/(lower back|lumbar|sciatica|spine(?!d)|herniated|disc)/.test(t)) return 'lower_back';
    if (/(buttock|sitting pain|piriformis)/.test(t)) return 'buttocks';
    if (/(shoulder(?! blade)|rotator|frozen shoulder)/.test(t)) return 'shoulder';
    if (/(arm(?!p)|bicep|tricep|forearm|numb.*arm|tingl.*arm)/.test(t)) return 'arm';
    if (/(elbow|tennis elbow|golfer)/.test(t)) return 'elbow';
    if (/(hand|wrist|finger|thumb|grip|carpal)/.test(t)) return 'hand';
    if (/(hip(?! bone)|groin|hip joint|clicking hip)/.test(t)) return 'hip';
    if (/(thigh|hamstring|quad|upper leg|groin pain)/.test(t)) return 'thigh';
    if (/(knee|patella|kneecap|meniscus|acl|mcl)/.test(t)) return 'knee';
    if (/(lower leg|shin|calf|cramp|leg pain|leg swell)/.test(t)) return 'lower_leg';
    if (/(ankle|foot|heel|arch|toe|plantar|bun|swollen feet?)/.test(t)) return 'ankle_foot';

    if (/(leg|knee|ankle|foot|calf|thigh)/.test(t)) return 'lower_leg';
    if (/(arm|hand|wrist|elbow|finger)/.test(t)) return 'arm';
    if (/(back|spine|neck|sciatica)/.test(t)) return 'lower_back';
    if (/(nausea)/.test(t)) return 'stomach';

    return 'neutral';
  };

  const handleAnalyzeDiagnosis = async (e?: React.FormEvent) => {
    stopSpeaking();
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
    e?.preventDefault();
    if (!input.trim() && !selectedImage) return;

    const userMessage = input.trim() || "Image attached for analysis.";
    const newMessages = [...diagnosisState.messages, { role: 'user', content: userMessage } as const];
    
    setDiagnosisState(prev => ({ 
      ...prev, 
      messages: newMessages,
      loading: true, 
      error: null 
    }));
    setInput('');
    setQuickReplies([]);

    try {
      const data = await chatDiagnosis(newMessages, selectedImage || undefined);
      
      const assistantMessage = { role: 'assistant', content: data.response } as const;
      
      setDiagnosisState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        results: data.diagnosis || null,
        loading: false,
        error: null,
        is_emergency: data.is_emergency,
        is_complete: data.is_complete,
      }));

      setQuickReplies(data.quick_replies || []);

      setDoctorTone(data.doctor_tone || 'neutral');
      setDiagnosticConfidence(data.diagnostic_confidence || 0);
      setRedFlags(data.red_flags || []);
      if (data.closing_summary) setClosingSummary(data.closing_summary);

      if (data.notebook_entries && data.notebook_entries.length > 0) {
        setNotebookEntries(prev => {
          const updated = [...prev];
          for (const entry of data.notebook_entries) {
            const existingIdx = updated.findIndex(e => e.label === entry.label);
            if (existingIdx >= 0) {
              updated[existingIdx] = entry;
            } else {
              updated.push(entry);
            }
          }
          return updated;
        });
        setHasNewNotes(true);
      }

      if (data.is_emergency) {
        setEmergencySteps(data.emergency_steps || []);
      }

      if (data.is_complete && !data.is_emergency) {
        setShowReportPrompt(true);
        const id = await saveDiagnosisToSupabase([...newMessages, assistantMessage], data.diagnosis, false);
        if (id) setCurrentDiagnosisId(id);
      }

      if (data.is_complete || data.is_emergency) {
        if (data.is_emergency) {
          const id = await saveDiagnosisToSupabase([...newMessages, assistantMessage], { conditions: [{ name: 'Emergency', urgency: 'critical', probability: 100, description: data.response, recommendations: data.emergency_steps || [] }], general_advice: '', disclaimer: '' }, true);
          if (id) setCurrentDiagnosisId(id);
        }
        setView('diagnosis');
      }
      
      setSelectedImage(null);
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (err: any) {
      setDiagnosisState(prev => ({
        ...prev,
        loading: false,
        error: err.message || "An error occurred during diagnosis.",
      }));
    }
  };

  useEffect(() => {
    if (view !== 'home') return;
    if (diagnosisState.is_complete || diagnosisState.is_emergency) return;
    if (showContactModal || showReportModal || showCamera) return;

    const on_keydown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return;

      if (e.key === 'Enter') {
        e.preventDefault();
        if (diagnosisState.loading) return;
        if (!input.trim() && !selectedImage) return;
        handleAnalyzeDiagnosis();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setInput('');
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        setInput((prev) => prev.slice(0, -1));
        return;
      }

      if (e.key.length === 1) {
        e.preventDefault();
        setInput((prev) => prev + e.key);
      }
    };

    window.addEventListener('keydown', on_keydown);
    return () => window.removeEventListener('keydown', on_keydown);
  }, [view, diagnosisState.is_complete, diagnosisState.is_emergency, diagnosisState.loading, input, showContactModal, showReportModal, showCamera]);

  // --- Medication Logic ---
  const handleAnalyzeMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && selectedMedImages.length === 0) return;

    setMedicationState({ ...medicationState, loading: true, error: null });

    try {
      const promptText = input.trim() || "Analyze this medication image.";
      const data = await analyzeMedication(promptText, selectedMedImages.length > 0 ? selectedMedImages : undefined);
      setMedicationState({
        results: data,
        loading: false,
        error: null,
      });
      saveMedicationToSupabase(promptText, data);
      setInput('');
      setSelectedMedImages([]);

      setTimeout(() => {
        medResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err: any) {
      setMedicationState({
        results: null,
        loading: false,
        error: err.message || "An error occurred during medication analysis.",
      });
    }
  };

  const handleClearMedication = () => {
    stopSpeaking();
    setInput('');
    setSelectedMedImages([]);
    setMedicationState({ results: null, loading: false, error: null });
  };

  const handleClear = () => {
    stopSpeaking();
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
    setInput('');
    setSelectedImage(null);
    setDiagnosisState({ 
      results: null, 
      loading: false, 
      error: null,
      messages: [{ role: 'assistant', content: "How can I help you?" }],
      is_emergency: false,
      is_complete: false,
    });
    setMedicationState({ results: null, loading: false, error: null });
    setReportHtml('');
    setEmergencySteps([]);
    setQuickReplies([]);
    setShowReportPrompt(false);
    setNotebookEntries([]);
    setRightTab('map');
    setView('landing');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const isMedView = view === 'medication';
    const remaining = isMedView ? 2 - selectedMedImages.length : 1;

    Array.from(files).slice(0, Math.max(remaining, 0)).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isMedView) {
          setSelectedMedImages(prev => [...prev, reader.result as string]);
        } else {
          setSelectedImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (view === 'medication') {
              setSelectedMedImages(prev => prev.length < 2 ? [...prev, event.target?.result as string] : prev);
            } else {
              setSelectedImage(event.target?.result as string);
            }
          };
          reader.readAsDataURL(blob);
        }
        return;
      }
    }
  };

  const handleViewReport = async () => {
    if (!diagnosisState.results) return;
    
    setShowReportModal(true);
    
    if (!reportHtml) {
      setGeneratingReport(true);
      try {
        const promptText = diagnosisState.messages
          .filter((message) => message.role === 'user')
          .map((message) => message.content)
          .join('\n');
        const html = await generateClinicalReport(diagnosisState.results, promptText);
        setReportHtml(html);
        if (currentDiagnosisId) {
          await supabase.from('diagnoses').update({ report_html: html }).eq('id', currentDiagnosisId);
        }
      } catch (e) {
        setReportHtml('<p>Error loading report.</p>');
      } finally {
        setGeneratingReport(false);
      }
    }
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Clinical Report - Tabib</title>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Outfit', sans-serif; padding: 40px; color: #1e293b; }
              .report-content h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
              .report-content h2 { font-size: 18px; font-weight: 600; color: #334155; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
              .report-content p { margin-bottom: 12px; font-size: 14px; line-height: 1.6; }
              .report-content ul { list-style-type: disc; padding-left: 20px; margin-bottom: 16px; font-size: 14px; }
              .report-content li { margin-bottom: 6px; }
            </style>
          </head>
          <body>
            ${reportHtml}
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('lvhealthanalysis@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const home_visual_text = input || latest_user_message;
  const symptom_visual_key = get_symptom_visual_key(home_visual_text);
  // visual mode derived from state
  const symptom_visual_mode = isLoadingDiagnosis ? 'thinking' : input.trim() ? 'typing' : 'idle';

  if (window.location.pathname === '/dashboard') {
    if (!user) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-400 text-sm mb-4">Please sign in to view your dashboard.</p>
            <button onClick={() => promptGoogleSignIn()} className="text-sm text-white underline">
              Sign in with Google
            </button>
          </div>
        </div>
      );
    }
    return <Dashboard user={user} />;
  }

  return (
    <div className="min-h-screen font-sans pb-20 selection:bg-brand-accent selection:text-white relative overflow-x-hidden">
      
      <Analytics />

      <Header
        onContactClick={() => setShowContactModal(true)}
        currentView={view}
        onViewChange={handleViewChange}
        user={user}
        onSignIn={() => promptGoogleSignIn()}
        onSignOut={() => googleSignOut(() => setUser(null))}
      />

      <main className="relative z-10 mx-auto max-w-6xl px-4 pt-44 sm:pt-36 md:pt-40 lg:px-8">
        
        {view === 'landing' && (
          <section className="relative mx-auto max-w-6xl min-h-[85vh] flex flex-col justify-center overflow-hidden">

            {/* Background orbs */}
            <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] md:w-[500px] md:h-[500px] landing-orb bg-purple-600/20" style={{ animation: 'orbPulse 5s ease-in-out infinite' }} />
            <div className="pointer-events-none absolute top-1/3 left-[20%] w-[150px] h-[150px] md:w-[300px] md:h-[300px] landing-orb bg-violet-500/10" style={{ animation: 'orbPulse 7s ease-in-out infinite 1s' }} />
            <div className="pointer-events-none absolute top-1/2 right-[15%] w-[120px] h-[120px] md:w-[250px] md:h-[250px] landing-orb bg-fuchsia-500/10" style={{ animation: 'orbPulse 6s ease-in-out infinite 2s' }} />

            {/* Spinning rings behind title */}
            <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] pointer-events-none" style={{ animation: 'orbSpin 40s linear infinite' }}>
              <div className="absolute inset-0 rounded-full border border-purple-500/10" />
              <div className="absolute inset-6 rounded-full border border-purple-400/8" />
              <div className="absolute inset-12 rounded-full border border-violet-500/6 border-dashed" />
            </div>
            <div className="absolute top-1/2 left-1/2 w-[250px] h-[250px] md:w-[500px] md:h-[500px] pointer-events-none" style={{ animation: 'orbSpinReverse 55s linear infinite' }}>
              <div className="absolute inset-0 rounded-full border border-fuchsia-500/8" />
              <div className="absolute inset-8 rounded-full border border-purple-300/6 border-dashed" />
            </div>

            {/* Hero content */}
            <div className="relative z-10 text-center space-y-8 animate-fade-in-up">
              <div className="space-y-6">
                <h1 className="text-4xl sm:text-6xl md:text-[5.5rem] font-black tracking-tight text-white leading-[0.9]">
                  Your health,<br />
                  <span className="shimmer-text">decoded.</span>
                </h1>

                <p className="text-sm md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light px-2">
                  Talk to Tabib in your own language. Understand your symptoms, verify your medications, and walk into your doctor's office with a report instead of confusion.
                </p>
              </div>

              <div className="inline-flex items-center gap-3">
                <button
                  onClick={() => user ? handleViewChange('home') : requiresAuth('diagnosis') ? promptGoogleSignIn() : handleViewChange('home')}
                  className="inline-flex items-center gap-3 rounded-xl bg-white text-black px-8 py-4 text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-200 hover:bg-zinc-200 active:scale-[0.97]"
                >
                  {!user && requiresAuth('diagnosis') ? 'Sign in to Continue' : 'Try Tabib'}
                  <ArrowRight size={16} />
                </button>

                {user && (
                  <button
                    onClick={() => window.open('/dashboard', '_blank')}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] text-white/60 px-8 py-4 text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-200 hover:bg-white/[0.06] hover:text-white/80 hover:border-white/20 active:scale-[0.97]"
                  >
                    My History
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Cards */}
            <div className="mt-12 md:mt-20">
              <LandingCards />
            </div>

            {/* Bottom stats bar */}
            <div className="relative z-10 mt-10 md:mt-16 flex flex-wrap items-center justify-center gap-6 md:gap-16 px-4">
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-black text-white">500M+</div>
                <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600 mt-1">Health Records</div>
              </div>
              <div className="w-px h-8 bg-white/10 hidden md:block" />
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-black text-white">100%</div>
                <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600 mt-1">Free Forever</div>
              </div>
              <div className="w-px h-8 bg-white/10 hidden md:block" />
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-black text-white">30+</div>
                <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600 mt-1">Languages</div>
              </div>
            </div>

            {/* How It Works Steps */}
            <div className="relative z-10 mt-6 md:mt-10 px-4">
              <LandingSteps />
            </div>

            {/* Purple glow bottom ending */}
            <div className="bottom-glow-circle" />
          </section>
        )}

        {view === 'home' && (
          <section className="mx-auto max-w-5xl">
            <div className="grid gap-6 lg:gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div className="space-y-4 md:space-y-6 animate-float-card">
                {diagnosisState.messages.length <= 1 && (
                  <h2 className="text-3xl md:text-4xl lg:text-7xl font-black tracking-tight text-white">
                    How can I help you?
                  </h2>
                )}



                <div className="rounded-[20px] md:rounded-[28px] border border-white/10 bg-black/70 p-4 md:p-6 backdrop-blur-xl animate-fade-in-up">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-500">
                      Dr. Tabib
                    </div>
                    {!diagnosisState.is_complete && diagnosisState.messages.length > 1 && (
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3].map((step) => (
                          <div
                            key={step}
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              step <= Math.min(diagnosisState.messages.length - 1, 3)
                                ? 'w-6 bg-purple-500'
                                : 'w-3 bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-base leading-relaxed text-zinc-100 md:text-lg">
                    {isLoadingDiagnosis ? (
                      <div className="flex items-center gap-2">
                        <span>Analyzing your symptoms</span>
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </div>
                    ) : (
                      latest_assistant_message
                    )}
                  </div>
                </div>

                {!isLoadingDiagnosis && quickReplies.length > 0 && !diagnosisState.is_complete && (
                  <div className="flex flex-wrap gap-2 animate-fade-in-up">
                    {quickReplies.map((reply, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setInput(reply);
                          setTimeout(() => handleAnalyzeDiagnosis(), 50);
                        }}
                        className="rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-200 transition-all hover:border-purple-400 hover:bg-purple-500/20 hover:text-white hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 md:p-6">
                  <div className="flex items-center justify-between gap-2 md:gap-4">
                    <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-500">
                      You
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition-all hover:border-white/20 hover:text-white"
                        title="Upload an image"
                      >
                        <ImageIcon size={12} />
                        <span className="hidden sm:inline">Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition-all hover:border-white/20 hover:text-white"
                        title="Take a photo"
                      >
                        <Camera size={12} />
                        <span className="hidden sm:inline">Camera</span>
                      </button>
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all ${
                          isRecording
                            ? 'border-red-500/50 bg-red-500/20 text-red-400 animate-pulse'
                            : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:border-white/20 hover:text-white'
                        }`}
                        title={isRecording ? 'Stop recording' : 'Speak your symptoms'}
                      >
                        <Mic size={12} />
                        {isRecording ? 'Stop' : 'Voice'}
                      </button>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                        Enter to send • Esc to clear
                      </div>
                    </div>
                  </div>
                  {selectedImage && (
                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <img
                        src={selectedImage}
                        alt="Attached"
                        className="h-16 w-16 rounded-xl border border-white/10 object-cover"
                      />
                      <div className="flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Image attached</div>
                        <p className="text-xs text-zinc-400 mt-0.5">Will be sent with your message</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="rounded-full border border-white/10 bg-white/[0.04] p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  <div className="mt-4">
                    <textarea
                      ref={chatTextareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (!diagnosisState.loading && (input.trim() || selectedImage)) {
                            handleAnalyzeDiagnosis();
                          }
                        }
                      }}
                      placeholder="Start typing..."
                      rows={1}
                      className="w-full min-h-[64px] max-h-[160px] resize-none bg-transparent text-lg font-semibold text-white md:text-2xl placeholder:text-zinc-600 focus:outline-none leading-relaxed"
                      style={{ fieldSizing: 'content' } as any}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                        {input.length > 0 ? `${input.length} chars` : ''}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!diagnosisState.loading && (input.trim() || selectedImage)) {
                            handleAnalyzeDiagnosis();
                          }
                        }}
                        disabled={diagnosisState.loading || (!input.trim() && !selectedImage)}
                        className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                          (input.trim() || selectedImage) && !diagnosisState.loading
                            ? 'bg-purple-600/80 border border-purple-500/40 text-white hover:bg-purple-500/80 hover:shadow-[0_0_20px_rgba(147,51,234,0.2)] active:scale-[0.97]'
                            : 'bg-white/[0.04] border border-white/10 text-zinc-600 cursor-not-allowed'
                        }`}
                      >
                        <span className="md:hidden">Send</span>
                        <span className="hidden md:inline">Enter ↵</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[28px] md:rounded-[36px] border border-white/10 bg-black/60 shadow-[0_24px_80px_rgba(0,0,0,0.7)] backdrop-blur-xl p-4 md:p-6 min-h-[360px] md:min-h-[520px] animate-float-card-opposite">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.12),transparent_46%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.08),transparent_48%)] pointer-events-none" />
                
                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex border-b border-white/10 mb-3 pb-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setRightTab('map')}
                      className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                        rightTab === 'map' ? 'border-purple-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Body Map
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRightTab('notes'); setHasNewNotes(false); }}
                      className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 relative ${
                        rightTab === 'notes' ? 'border-purple-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Notes
                      {hasNewNotes && rightTab !== 'notes' && (
                        <span className="absolute -top-0.5 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                      {notebookEntries.length > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[8px] font-bold bg-purple-500/30 text-purple-300 rounded-full">
                          {notebookEntries.length}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="flex-1 relative overflow-hidden">
                    {rightTab === 'map' ? (
                      <>
                        <InteractiveBodyMap
                          activeZone={symptom_visual_key}
                          onSelectZone={(zone) => {
                            const zoneSymptoms: Record<string, string[]> = {
                              head: ['Headache', 'Dizziness', 'Blurred vision', 'Memory problems', 'Confusion', 'Fainting'],
                              face: ['Facial pain', 'Swelling', 'Numbness', 'Jaw pain', 'Sinus pressure', 'Dry eyes'],
                              ears: ['Ear pain', 'Hearing loss', 'Ringing in ears', 'Ear discharge', 'Vertigo', 'Ear fullness'],
                              throat: ['Sore throat', 'Difficulty swallowing', 'Hoarse voice', 'Swollen neck glands', 'Throat tightness', 'Cough'],
                              chest: ['Chest pain', 'Shortness of breath', 'Heart palpitations', 'Chest tightness', 'Pain when breathing', 'Coughing up blood'],
                              stomach: ['Stomach pain', 'Nausea', 'Vomiting', 'Bloating', 'Heartburn', 'Diarrhea', 'Loss of appetite', 'Blood in stool'],
                              pelvis: ['Pelvic pain', 'Lower abdominal pain', 'Painful urination', 'Frequent urination', 'Blood in urine'],
                              upper_back: ['Upper back pain', 'Shoulder blade pain', 'Stiff neck', 'Pain between shoulders', 'Muscle spasms'],
                              lower_back: ['Lower back pain', 'Sciatica', 'Stiff lower back', 'Pain when bending', 'Leg tingling'],
                              buttocks: ['Buttock pain', 'Pain when sitting', 'Sciatica', 'Numbness', 'Hip pain'],
                              shoulder: ['Shoulder pain', 'Limited movement', 'Shoulder stiffness', 'Pain at night', 'Clicking sound'],
                              arm: ['Arm pain', 'Numbness', 'Tingling', 'Weakness', 'Swelling', 'Muscle pain'],
                              elbow: ['Elbow pain', 'Tennis elbow', 'Stiff elbow', 'Swelling', 'Weak grip'],
                              hand: ['Hand pain', 'Wrist pain', 'Numb fingers', 'Swollen joints', 'Stiff fingers', 'Weak grip'],
                              hip: ['Hip pain', 'Stiffness', 'Pain when walking', 'Clicking hip', 'Limited movement'],
                              thigh: ['Thigh pain', 'Muscle strain', 'Numbness', 'Swelling', 'Weakness'],
                              knee: ['Knee pain', 'Swollen knee', 'Stiffness', 'Locking', 'Giving way', 'Clicking'],
                              lower_leg: ['Leg pain', 'Shin splints', 'Swelling', 'Cramps', 'Skin changes', 'Numbness'],
                              ankle_foot: ['Ankle pain', 'Foot pain', 'Swelling', 'Stiffness', 'Difficulty walking', 'Heel pain'],
                            };
                            const symptoms = zoneSymptoms[zone];
                            if (symptoms && symptoms.length > 0) {
                              setSymptomPickerZone(zone);
                            } else {
                              setInput((prev) => {
                                const clean = prev.trim();
                                if (!clean) return `I have pain in my ${zone.replace('_', ' ')}`;
                                return `${clean}, pain in my ${zone.replace('_', ' ')}`;
                              });
                            }
                          }}
                        />

                        {symptomPickerZone && (
                          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl md:rounded-3xl z-20 flex items-center justify-center p-3 md:p-4">
                            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-4 md:p-5 max-h-full overflow-y-auto w-full">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                  {symptomPickerZone.replace(/_/g, ' ')} Symptoms
                                </h3>
                                <button
                                  type="button"
                                  onClick={() => setSymptomPickerZone(null)}
                                  className="rounded-full p-1 bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {(() => {
                                  const zoneSymptomMap: Record<string, string[]> = {
                                    head: ['Headache', 'Dizziness', 'Blurred vision', 'Memory problems', 'Confusion', 'Fainting'],
                                    face: ['Facial pain', 'Swelling', 'Numbness', 'Jaw pain', 'Sinus pressure', 'Dry eyes'],
                                    ears: ['Ear pain', 'Hearing loss', 'Ringing in ears', 'Ear discharge', 'Vertigo', 'Ear fullness'],
                                    throat: ['Sore throat', 'Difficulty swallowing', 'Hoarse voice', 'Swollen neck glands', 'Throat tightness', 'Cough'],
                                    chest: ['Chest pain', 'Shortness of breath', 'Heart palpitations', 'Chest tightness', 'Pain when breathing', 'Coughing up blood'],
                                    stomach: ['Stomach pain', 'Nausea', 'Vomiting', 'Bloating', 'Heartburn', 'Diarrhea', 'Loss of appetite', 'Blood in stool'],
                                    pelvis: ['Pelvic pain', 'Lower abdominal pain', 'Painful urination', 'Frequent urination', 'Blood in urine'],
                                    upper_back: ['Upper back pain', 'Shoulder blade pain', 'Stiff neck', 'Pain between shoulders', 'Muscle spasms'],
                                    lower_back: ['Lower back pain', 'Sciatica', 'Stiff lower back', 'Pain when bending', 'Leg tingling'],
                                    buttocks: ['Buttock pain', 'Pain when sitting', 'Sciatica', 'Numbness', 'Hip pain'],
                                    shoulder: ['Shoulder pain', 'Limited movement', 'Shoulder stiffness', 'Pain at night', 'Clicking sound'],
                                    arm: ['Arm pain', 'Numbness', 'Tingling', 'Weakness', 'Swelling', 'Muscle pain'],
                                    elbow: ['Elbow pain', 'Tennis elbow', 'Stiff elbow', 'Swelling', 'Weak grip'],
                                    hand: ['Hand pain', 'Wrist pain', 'Numb fingers', 'Swollen joints', 'Stiff fingers', 'Weak grip'],
                                    hip: ['Hip pain', 'Stiffness', 'Pain when walking', 'Clicking hip', 'Limited movement'],
                                    thigh: ['Thigh pain', 'Muscle strain', 'Numbness', 'Swelling', 'Weakness'],
                                    knee: ['Knee pain', 'Swollen knee', 'Stiffness', 'Locking', 'Giving way', 'Clicking'],
                                    lower_leg: ['Leg pain', 'Shin splints', 'Swelling', 'Cramps', 'Skin changes', 'Numbness'],
                                    ankle_foot: ['Ankle pain', 'Foot pain', 'Swelling', 'Stiffness', 'Difficulty walking', 'Heel pain'],
                                  };
                                  return (zoneSymptomMap[symptomPickerZone] || []).map((symptom, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setInput((prev) => {
                                          const clean = prev.trim();
                                          const lowerSymptom = symptom.toLowerCase();
                                          if (!clean) return `I have ${lowerSymptom}`;
                                          if (clean.toLowerCase().includes(lowerSymptom)) return prev;
                                          return `${clean}, ${lowerSymptom}`;
                                        });
                                        setSymptomPickerZone(null);
                                      }}
                                      className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-200 transition-all hover:border-purple-400 hover:bg-purple-500/20 hover:text-white"
                                    >
                                      {symptom}
                                    </button>
                                  ));
                                })()}
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-3 text-center">Tap a symptom to add it to your description</p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="h-full flex flex-col">
                        {notebookEntries.length > 0 ? (
                          <div ref={notebookContainerRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {notebookEntries.map((entry, idx) => (
                              <div
                                key={`${entry.label}-${idx}`}
                                className="notebook-entry rounded-xl border border-white/5 bg-white/[0.03] p-3 hover:bg-white/[0.06] transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <span className="text-lg flex-shrink-0 mt-0.5">{entry.icon}</span>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-0.5">{entry.label}</div>
                                    <div className="text-sm text-zinc-200 leading-snug">{entry.value}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-zinc-600">
                            <div className="text-center">
                              <FileText size={24} className="mx-auto mb-2 opacity-40" />
                              <p className="text-xs">No notes yet</p>
                               <p className="text-[10px] text-zinc-700 mt-1">Dr. Tabib will take notes as you chat</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === 'about' && (
          <section className="mx-auto max-w-4xl animate-fade-in-up px-2 md:px-0">
            <div className="text-center mb-10 md:mb-16">
              <h1 className="text-3xl md:text-6xl font-bold text-white tracking-tight mb-4">
                What is Tabib?
              </h1>
              <p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                A free health assistant built to help you understand your body, before you even step into a clinic.
              </p>
            </div>

            <div className="space-y-4 md:space-y-6 mb-12 md:mb-20">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
                <h2 className="text-lg md:text-2xl font-bold text-white mb-4">Why Tabib Exists</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Healthcare shouldn't start and end at the doctor's office. Millions of people every day deal with symptoms they don't understand, medications they can't verify, and conversations with doctors that feel rushed because there isn't enough time.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  Tabib was built to change that. It gives you a head start, helping you understand what's going on with your body <strong className="text-white">in your own language</strong>, so you can walk into your doctor's office informed, prepared, and with a report already in hand.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
                <h2 className="text-lg md:text-2xl font-bold text-white mb-4">How It Works</h2>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Tabib doesn't guess. Every diagnosis is backed by a analysis process trained on over <strong className="text-white">500 million+ health records</strong>, cross-referenced repeatedly to ensure accuracy and reliability.
                </p>
                <div className="grid gap-3 md:gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 md:p-5">
                    <div className="text-xl md:text-2xl font-bold text-white mb-1">500M+</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Health Records Analyzed</div>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                    <div className="text-2xl font-bold text-white mb-1">100%</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Evidence Based</div>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                    <div className="text-2xl font-bold text-white mb-1">Free</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">For Everyone</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
                <h2 className="text-lg md:text-2xl font-bold text-white mb-6">What Tabib Helps With</h2>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-400 text-lg">+</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Small, Curable Diseases</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Common colds, infections, mild allergies, digestive issues. The everyday problems that don't need a long hospital visit. Tabib helps you identify them quickly and guides you on what to do next.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-amber-400 text-lg">!</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Early Detection of Serious Conditions</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Some symptoms can be early signals of something bigger. Tabib helps you catch those red flags early, so you can get the right care before it's too late.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-lg">→</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Bridging Patients and Doctors</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Tabib generates clinical reports you can bring to your doctor, cutting down the 30-minute conversation into a clear, structured document. Doctors get the facts, patients get more time for treatment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
                <h2 className="text-lg md:text-2xl font-bold text-white mb-4">Your Language, Your Health</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You shouldn't need to speak English to understand your own body. Tabib lets you describe symptoms, read diagnoses, and learn about medications, all in the language you're most comfortable with.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  Because health information shouldn't have a language barrier.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
                <h2 className="text-lg md:text-2xl font-bold text-white mb-4">Who Benefits</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                    <h3 className="text-white font-semibold mb-2">For Patients</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Understand your symptoms before the appointment. Know what questions to ask. Walk in confident, not confused.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                    <h3 className="text-white font-semibold mb-2">For Doctors</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Receive structured patient reports upfront. Spend less time gathering history and more time on what matters: treatment.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pb-10">
              <p className="text-sm text-gray-500">
                Tabib is not a replacement for professional medical advice. Always consult a licensed healthcare provider.
              </p>
            </div>
          </section>
        )}

        {view === 'privacy' && <PrivacyPolicy />}

        {view === 'diagnosis' && (
          <div className="mx-auto mb-10 flex max-w-4xl justify-end">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-bold uppercase tracking-wider text-gray-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              New Assessment
            </button>
          </div>
        )}

        {/* Emergency Alert (Forced Contact) */}
        {view === 'diagnosis' && diagnosisState.is_emergency && (
          <div className="max-w-4xl mx-auto mb-12 space-y-6">
            {/* Main Emergency Alert */}
            <div className="glass-panel border-red-500/50 p-5 md:p-8 rounded-3xl animate-glow shadow-[0_0_50px_rgba(239,68,68,0.3)]">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
                <div className="p-4 md:p-5 bg-red-500/20 rounded-full text-red-500 animate-pulse border border-red-500/30">
                  <AlertOctagon size={36} className="md:w-12 md:h-12" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-black text-red-500 uppercase tracking-tighter mb-2">Emergency Detected</h2>
                  <p className="text-lg md:text-xl text-white font-bold mb-4">CALL EMERGENCY SERVICES IMMEDIATELY (911/999)</p>
                  <p className="text-sm text-red-200 mb-6">Tell them: "I think someone is having a {emergencySteps[0]?.toLowerCase().includes('heart') || latest_assistant_message.toLowerCase().includes('heart') || latest_assistant_message.toLowerCase().includes('chest') ? 'heart attack' : 'medical emergency'}. Send an ambulance immediately."</p>
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest">What To Do While Waiting:</h3>
                    <ul className="space-y-3 text-left">
                      {emergencySteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-500 text-white text-sm font-bold flex items-center justify-center">{i + 1}</span>
                          <span className="text-sm text-red-100 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* CPR Guide - Shows for cardiac emergencies */}
            {(latest_assistant_message.toLowerCase().includes('heart') || 
              latest_assistant_message.toLowerCase().includes('chest') || 
              latest_assistant_message.toLowerCase().includes('cardiac') ||
              latest_assistant_message.toLowerCase().includes('collapse') ||
              latest_assistant_message.toLowerCase().includes('unconscious')) && (
              <div className="glass-panel border-orange-500/30 p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-500/20 rounded-full text-orange-400">
                    <Heart size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-orange-300">CPR Guide</h3>
                    <p className="text-xs text-orange-400">If the person is unconscious and not breathing normally</p>
                  </div>
                </div>
                
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 mb-4">
                  <p className="text-sm text-orange-200 font-medium mb-3">
                    <strong>Important:</strong> If no one nearby knows CPR, doing something is better than doing nothing. Even imperfect CPR can save a life.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">1</span>
                      <div>
                        <p className="text-sm font-bold text-white">Check if they respond</p>
                        <p className="text-xs text-orange-200">Shake their shoulders and shout "Are you okay?" If no response, they need CPR.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">2</span>
                      <div>
                        <p className="text-sm font-bold text-white">Call for help</p>
                        <p className="text-xs text-orange-200">Tell someone to call 911 and get an AED (defibrillator) if available. If you're alone, call 911 on speakerphone.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">3</span>
                      <div>
                        <p className="text-sm font-bold text-white">Start chest compressions</p>
                        <p className="text-xs text-orange-200">Place the heel of one hand on the center of their chest (between the nipples). Place your other hand on top. Push hard and fast — about 2 inches deep, at a rate of 100-120 compressions per minute (think of the beat of "Stayin' Alive" by the Bee Gees).</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">4</span>
                      <div>
                        <p className="text-sm font-bold text-white">Don't stop</p>
                        <p className="text-xs text-orange-200">Keep pushing hard and fast. Don't worry about breaking ribs — a broken rib is better than death. If you get tired, have someone else take over. Don't stop until help arrives or they start breathing.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">5</span>
                      <div>
                        <p className="text-sm font-bold text-white">Use an AED if available</p>
                        <p className="text-xs text-orange-200">If someone brings a defibrillator, turn it on and follow the voice instructions. It will tell you exactly what to do.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-orange-300 text-center">
                  Remember: You cannot make things worse by doing CPR. The person is already clinically dead without intervention.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Diagnosis Result Summary & Report Prompt */}
        {view === 'diagnosis' && diagnosisState.is_complete && !diagnosisState.is_emergency && diagnosisState.results && (
          <div className="max-w-4xl mx-auto mb-12 space-y-8">
            {showReportPrompt && (
              <div className="glass-panel p-8 rounded-3xl border-brand-accent/30 text-center space-y-6 animate-slide-up-fade">
                <div className="inline-flex p-4 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                  <FileText size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Diagnosis Complete</h3>
                   <p className="text-gray-400 max-w-md mx-auto">Would you like Dr. Tabib to prepare a clinical briefing for your physician based on our conversation?</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={handleViewReport}
                    className="w-full sm:w-auto px-8 py-4 bg-brand-accent text-black font-bold rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-brand-accent/20"
                  >
                    Yes, Prepare Report
                  </button>
                  <button 
                    onClick={() => setShowReportPrompt(false)}
                    className="w-full sm:w-auto px-8 py-4 bg-white/5 text-gray-400 font-bold rounded-2xl hover:bg-white/10 transition-colors"
                  >
                    No, just show results
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'medication' && (
          <div className="mx-auto mb-8 md:mb-12">
            <div
              ref={inputContainerRef}
              onMouseMove={handleMouseMove}
              className="relative overflow-hidden rounded-[24px] md:rounded-[32px] border border-white/10 bg-black/80 shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_28%)]" />
              <form onSubmit={handleAnalyzeMedication} className="relative z-10">
                <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="border-b border-white/10 lg:border-b-0 lg:border-r lg:border-white/10">
                    <div className="p-6 md:p-8">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-500">Describe The Situation</div>
                          <div className="mt-2 text-2xl font-bold text-white md:text-3xl">Tell us which medication this is.</div>
                        </div>
                        <div className="hidden rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500 md:block">
                          Medication Intake
                        </div>
                      </div>

                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onPaste={handlePaste}
                        placeholder="Enter medication name or upload/capture an image of the packaging or pill."
                        className="min-h-[160px] md:min-h-[220px] w-full resize-none rounded-[20px] md:rounded-[28px] border border-white/10 bg-white/[0.03] p-4 md:p-6 text-sm md:text-base leading-relaxed text-gray-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-white/20 md:text-lg"
                        disabled={isLoadingMedication}
                      />

                      {selectedMedImages.length > 0 && (
                        <div className="mt-5 space-y-3">
                          {selectedMedImages.map((img, idx) => (
                            <div key={idx} className="flex items-start gap-4 rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
                              <img
                                src={img}
                                alt={`Reference ${idx + 1}`}
                                className="h-24 w-24 rounded-2xl border border-white/10 object-cover"
                              />
                              <div className="flex-1">
                                <div className="text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-500">
                                  Image {idx + 1} of {selectedMedImages.length}
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                                  {idx === 0 ? 'Front of packaging' : 'Back of packaging'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedMedImages(prev => prev.filter((_, i) => i !== idx))}
                                className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                          {selectedMedImages.length < 2 && (
                            <p className="text-[11px] text-zinc-600 uppercase tracking-wider">You can upload 1 more image</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between p-6 md:p-8">
                    <div className="space-y-4">
                      <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
                        <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-500">
                          <Zap size={14} className="text-white" />
                          Live Scan
                        </div>
                        <p className="text-sm leading-relaxed text-zinc-300">
                          Upload a clear photo of the packaging (front + back) or enter the name to extract dates, composition, and clinical guidance.
                        </p>
                      </div>

                      <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
                        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-500">Controls</div>
                        <div className="flex flex-wrap gap-3">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            multiple
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoadingMedication}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black px-3 md:px-4 py-2 text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
                          >
                            <ImageIcon size={14} />
                            <span className="hidden sm:inline">Upload</span>
                            <span className="sm:hidden">Image</span>
                          </button>
                          <button
                            type="button"
                            onClick={startCamera}
                            disabled={isLoadingMedication}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black px-3 md:px-4 py-2 text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
                          >
                            <Camera size={14} />
                            Capture
                          </button>
                          {(input || selectedMedImages.length > 0) && (
                            <button
                              type="button"
                              onClick={handleClearMedication}
                              disabled={isLoadingMedication}
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoadingMedication || (!input.trim() && selectedMedImages.length === 0)}
                      className={`
                        mt-6 flex w-full items-center justify-center gap-3 rounded-[26px] px-6 py-5 text-sm font-bold uppercase tracking-[0.35em] transition-all duration-300
                        ${isLoadingMedication || (!input.trim() && selectedMedImages.length === 0)
                          ? 'cursor-not-allowed border border-white/10 bg-white/[0.04] text-zinc-600'
                          : 'border border-white/20 bg-white text-black shadow-[0_18px_40px_rgba(255,255,255,0.12)] hover:scale-[1.01]'
                        }
                      `}
                    >
                      {isLoadingMedication ? (
                        <>
                          <div className="h-5 w-5 rounded-full border-2 border-zinc-400/40 border-t-zinc-900 animate-spin" />
                          <span>Analyzing</span>
                        </>
                      ) : (
                        <>
                          <span>Analyze Medication</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Medication Hero (Only for Medication View) */}
        {view === 'medication' && !medicationState.results && !medicationState.loading && (
          <div className="relative text-center max-w-3xl mx-auto mb-10 md:mb-16 animate-fade-in-up">
            <div className="hidden md:block absolute -top-24 -right-16 w-64 h-64 animate-float pointer-events-none select-none z-0 opacity-90 transition-opacity duration-500">
              <img 
                src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Pill.png"
                alt="3D Icon"
                className="w-full h-full object-contain drop-shadow-[0_0_35px_rgba(124,58,237,0.3)] rotate-12"
              />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6 md:mb-8 shadow-lg backdrop-blur-sm hover:scale-105 transition-transform duration-300 cursor-default">
                <Pill size={14} className="text-brand-accent animate-pulse" />
                <span className="text-[10px] md:text-xs font-bold text-gray-300 uppercase tracking-widest">Pharmaceutical Vision AI</span>
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white tracking-tight mb-4 md:mb-6 leading-tight">
                Know Your Meds.<br />
                <span className="text-gradient">Verified Purity.</span>
              </h2>
              <p className="text-sm md:text-xl text-gray-400 leading-relaxed max-w-xl mx-auto font-light px-2">
                Instantly analyze pharmaceutical compounds. Extract expiry, origin, and clinical data with <span className="text-white font-medium">100% Precision</span>.
              </p>
            </div>
          </div>
        )}

        {/* Trust Bar */}
        {view === 'medication' && (
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-16 px-4">
            <div className="flex items-center gap-3 justify-center md:justify-start opacity-60 hover:opacity-100 transition-opacity cursor-default">
              <ShieldCheck size={20} className="text-brand-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Evidence Based</span>
            </div>
            <div className="flex items-center gap-3 justify-center md:justify-start opacity-60 hover:opacity-100 transition-opacity cursor-default">
              <Clock size={20} className="text-brand-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Real-time Analysis</span>
            </div>
            <div className="flex items-center gap-3 justify-center md:justify-start opacity-60 hover:opacity-100 transition-opacity cursor-default">
              <Database size={20} className="text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">10M+ Records</span>
            </div>
            <div className="flex items-center gap-3 justify-center md:justify-start opacity-60 hover:opacity-100 transition-opacity cursor-default">
              <Sparkles size={20} className="text-yellow-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">PhD Accuracy</span>
            </div>
          </div>
        )}

        {/* Support Section */}
        {view === 'medication' && !medicationState.results && !isLoadingMedication && (
          <div className="max-w-2xl mx-auto text-center -mt-8 md:-mt-12 mb-24 px-4 md:px-6 opacity-80 hover:opacity-100 transition-opacity duration-500">
             <div className="inline-flex items-center gap-2 text-brand-primary mb-4 bg-brand-primary/5 px-4 py-1.5 rounded-full border border-brand-primary/10 hover:bg-brand-primary/10 transition-colors cursor-pointer">
                <Heart size={14} className="fill-brand-primary/20" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Support Our Mission</span>
             </div>
             <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
               Help us democratize precision health. If Tabib has helped you, please consider sharing it with friends and family.
             </p>
          </div>
        )}

        {/* --- Diagnosis Results --- */}
        {view === 'diagnosis' && diagnosisState.is_complete && !diagnosisState.is_emergency && (diagnosisState.results || diagnosisState.error) && (
          <div ref={resultsRef} className="animate-fade-in-up space-y-8 md:space-y-10 pb-20">
            {diagnosisState.error ? (
               <div className="max-w-2xl mx-auto bg-red-900/20 border border-red-500/30 rounded-2xl p-6 md:p-8 text-center backdrop-blur-sm animate-pulse-slow">
                 <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                   <AlertOctagon size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-red-200 mb-2">Analysis Interrupted</h3>
                 <p className="text-red-400/80 text-sm">{diagnosisState.error}</p>
               </div>
            ) : diagnosisState.results && (
              <>
                {/* Diagnosis Content */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 border-b border-white/10 pb-6">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="bg-brand-primary/20 p-2.5 md:p-3 rounded-xl text-brand-glow border border-brand-primary/30 shadow-[0_0_15px_rgba(124,58,237,0.2)]">
                        <Stethoscope size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white">Clinical Report</h2>
                         <p className="text-xs md:text-sm text-gray-500">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} • Tabib AI</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleViewReport}
                    className="ml-auto w-full md:w-auto flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-white/5 border border-white/10 hover:border-white/30 px-5 py-2.5 rounded-lg transition-all group hover:bg-white/10"
                  >
                    <FileText size={14} className="text-brand-accent group-hover:scale-110 transition-transform" />
                    Detailed Report
                  </button>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/20 rounded-full blur-[80px] transform translate-x-1/2 -translate-y-1/2 group-hover:bg-brand-primary/25 transition-colors duration-500"></div>
                  <div className="relative z-10 flex flex-col md:grid md:grid-cols-3 gap-6 md:gap-10">
                    <div className="md:col-span-2 space-y-6">
                      <div className="flex items-center gap-2 text-brand-accent text-xs font-bold uppercase tracking-widest">
                        <Sparkles size={14} />
                        Synopsis
                      </div>
                      <p className="text-base md:text-lg text-gray-200 leading-relaxed font-light">
                        {diagnosisState.results.general_advice}
                      </p>
                    </div>
                    <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 pl-0 md:pl-10">
                      {diagnosisState.results.conditions.some(c => ['High', 'Critical'].includes(c.urgency)) ? (
                        <div className="text-center">
                          <div className="inline-flex p-4 rounded-full bg-red-500/10 text-red-500 mb-4 animate-pulse border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                             <AlertOctagon size={32} />
                          </div>
                          <h4 className="font-bold text-white text-lg mb-1">Immediate Action</h4>
                          <p className="text-xs text-gray-400 leading-relaxed">Symptoms suggest high priority conditions. Please consult a specialist.</p>
                        </div>
                      ) : (
                        <div className="text-center">
                           <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-500 mb-4 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                             <FileText size={32} />
                           </div>
                           <h4 className="font-bold text-white text-lg mb-1">Routine Monitor</h4>
                           <p className="text-xs text-gray-400 leading-relaxed">Symptoms appear manageable. Follow standard care protocols.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                       <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Primary Diagnosis</h3>
                    </div>
                    <ConditionCard condition={diagnosisState.results.conditions[0]} rank={1} />
                  </div>

                  {diagnosisState.results.conditions.length > 1 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Differential Diagnoses</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {diagnosisState.results.conditions.slice(1).map((condition, idx) => (
                          <ConditionCard key={idx} condition={condition} rank={idx + 2} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* --- Medication Results --- */}
        {view === 'medication' && (medicationState.results || medicationState.error) && (
           <div ref={medResultsRef} className="animate-slide-up-fade space-y-8 pb-20">
             {medicationState.error ? (
               <div className="max-w-2xl mx-auto bg-red-900/20 border border-red-500/30 rounded-2xl p-6 text-center">
                 <p className="text-red-400">{medicationState.error}</p>
               </div>
              ) : medicationState.results && medicationState.results.medication && (
               <>
                  {/* Monograph Header */}
                  <div className="glass-panel rounded-3xl p-8 relative overflow-hidden border-l-4 border-l-brand-accent group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 transition-opacity group-hover:opacity-20 duration-500">
                      <Factory size={120} className="text-white" />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                         <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">{medicationState.results.medication.name}</h2>
                            <p className="text-xl text-brand-accent font-light">{medicationState.results.medication.generic_name}</p>
                         </div>
                         <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                            <span className="text-xs text-gray-400 block uppercase tracking-wider mb-1">Analysis Confidence</span>
                            <div className="flex items-center gap-2">
                               <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <div style={{width: `${medicationState.results.analysis_confidence}%`}} className="h-full bg-brand-accent rounded-full shadow-[0_0_10px_rgba(217,70,239,0.5)]" />
                                </div>
                                <span className="text-white font-bold">{medicationState.results.analysis_confidence}%</span>
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        {/* Manufacturer */}
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
                           <div className="flex items-center gap-2 text-gray-400 mb-2">
                              <Factory size={14} />
                              <span className="text-xs font-bold uppercase tracking-wider">Manufacturer</span>
                           </div>
                           <p className="text-white font-medium">{medicationState.results.medication.manufacturer?.name || 'N/A'}</p>
                            <div className="flex gap-2 mt-2 text-xs text-gray-500">
                               <span>Origin: {medicationState.results.medication.manufacturer?.country_of_origin || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
                           <div className="flex items-center gap-2 text-gray-400 mb-2">
                              <Calendar size={14} />
                              <span className="text-xs font-bold uppercase tracking-wider">Dates (From Image)</span>
                           </div>
                           <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Mfg Date:</span>
                                <span className="text-white">{medicationState.results.medication.dates?.production_date || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Exp Date:</span>
                                <span className={`font-bold ${(medicationState.results.medication.dates?.expiry_date || '').includes('Not') ? 'text-gray-400' : 'text-brand-accent'}`}>
                                  {medicationState.results.medication.dates?.expiry_date || 'N/A'}
                                </span>
                              </div>
                           </div>
                        </div>
                        
                        {/* Specs */}
                         <div className="bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
                           <div className="flex items-center gap-2 text-gray-400 mb-2">
                              <Info size={14} />
                              <span className="text-xs font-bold uppercase tracking-wider">Specifications</span>
                           </div>
                            <p className="text-white text-sm"><span className="text-gray-500">Type:</span> {medicationState.results.medication.specifications?.type || 'N/A'}</p>
                            <p className="text-white text-sm"><span className="text-gray-500">Dosage:</span> {medicationState.results.medication.specifications?.dosage || 'N/A'}</p>
                            <p className="text-white text-sm truncate" title={medicationState.results.medication.specifications?.composition}><span className="text-gray-500">Active:</span> {medicationState.results.medication.specifications?.composition || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Uses */}
                     <div className="glass-panel p-6 rounded-2xl border-t border-t-brand-primary/50 hover:bg-white/5 transition-colors">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Check size={18} className="text-brand-primary" /> Official Indications
                        </h3>
                        <ul className="space-y-2">
                          {(medicationState.results.medication.clinical_info?.uses || []).map((use, i) => (
                            <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 shrink-0" />
                              {use}
                            </li>
                          ))}
                        </ul>
                     </div>

                     {/* Administration */}
                     <div className="glass-panel p-6 rounded-2xl hover:bg-white/5 transition-colors">
                        <h3 className="text-lg font-bold text-white mb-4">Administration Guide</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {medicationState.results.medication.clinical_info?.administration_guide || 'N/A'}
                        </p>
                     </div>

                     {/* Warnings */}
                     <div className="glass-panel p-6 rounded-2xl border border-red-500/20 bg-red-900/5 hover:bg-red-900/10 transition-colors">
                        <h3 className="text-lg font-bold text-red-200 mb-4 flex items-center gap-2">
                          <AlertTriangle size={18} className="text-red-400" /> Critical Warnings
                        </h3>
                         <p className="text-gray-300 text-sm leading-relaxed">
                          {medicationState.results.medication.clinical_info?.warnings || 'N/A'}
                        </p>
                     </div>

                      {/* Side Effects */}
                     <div className="glass-panel p-6 rounded-2xl hover:bg-white/5 transition-colors">
                        <h3 className="text-lg font-bold text-white mb-4">Potential Side Effects</h3>
                        <div className="flex flex-wrap gap-2">
                           {(medicationState.results.medication.clinical_info?.side_effects || []).map((effect, i) => (
                             <span key={i} className="text-xs bg-white/5 text-gray-400 px-3 py-1 rounded-full border border-white/10">
                               {effect}
                             </span>
                           ))}
                        </div>
                     </div>
                   </div>
                </>
              )}
           </div>
        )}

        {/* Report Modal (Diagnosis Only) */}
        {showReportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-[95%] md:w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl animate-slide-up-fade relative">
              <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-brand-primary flex items-center justify-center rounded-lg shrink-0">
                      <FileText size={18} className="text-white" />
                   </div>
                   <div>
                     <h3 className="text-base md:text-lg font-bold text-gray-900">Consultation Report</h3>
                     <p className="text-[10px] md:text-xs text-gray-500">Generated by Tabib</p>
                   </div>
                </div>
                <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-2">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
                {generatingReport ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <div className="w-10 h-10 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin mb-4" />
                    <p className="text-sm animate-pulse">Compiling clinical data...</p>
                  </div>
                ) : (
                  <div 
                    className="prose prose-slate max-w-none prose-sm md:prose-base"
                    dangerouslySetInnerHTML={{ __html: reportHtml }}
                  />
                )}
              </div>
              <div className="px-4 md:px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                 <button 
                   onClick={() => setShowReportModal(false)}
                   className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                 >
                   Close
                 </button>
                 <button 
                   onClick={printReport}
                   disabled={generatingReport}
                   className="flex items-center gap-2 px-4 md:px-6 py-2 bg-brand-primary hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <Printer size={16} />
                   <span className="hidden sm:inline">Print Document</span>
                   <span className="sm:hidden">Print</span>
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Modal */}
        {showContactModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-black border border-white/10 rounded-2xl w-full max-w-md relative overflow-hidden animate-slide-up-fade">

                <button
                    onClick={() => setShowContactModal(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center mb-5">
                        <Mail size={20} className="text-zinc-400" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">Contact Us</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                        Questions, feedback, or need help? Drop us a line.
                    </p>

                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-between mb-4">
                        <span className="text-zinc-300 text-sm font-medium break-all">lvhealthanalysis@gmail.com</span>
                        <button
                            onClick={handleCopyEmail}
                            className="p-2 text-zinc-500 hover:text-white transition-colors shrink-0"
                            title="Copy to clipboard"
                        >
                            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                        </button>
                    </div>

                    <a
                        href="mailto:lvhealthanalysis@gmail.com"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black text-sm font-bold rounded-xl transition-all hover:bg-zinc-200 active:scale-[0.97]"
                    >
                        <ExternalLink size={16} />
                        Open Mail App
                    </a>
                </div>
            </div>
          </div>
        )}

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center animate-fade-in">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-10 flex gap-6 items-center">
               <button 
                 onClick={stopCamera} 
                 className="bg-gray-800 text-white p-4 rounded-full hover:bg-gray-700 transition-colors border border-white/10"
               >
                 <X size={24} />
               </button>
               <button 
                 onClick={captureImage} 
                 className="bg-white border-4 border-gray-300 w-20 h-20 rounded-full hover:scale-105 transition-transform shadow-lg"
               />
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
