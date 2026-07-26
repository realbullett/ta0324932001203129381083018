let currentUtterance: SpeechSynthesisUtterance | null = null;

const VOICE_PREFERENCES = [
  'Google UK English Female',
  'Google UK English Male',
  'Google',
  'Microsoft Zira',
  'Microsoft David',
  'Microsoft Mark',
  'Samantha',
  'Alex',
  'Natural',
  'Neural',
  'Enhanced',
  'Premium',
];

export const speakWithElevenLabs = async (text: string): Promise<void> => {
  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;

  const voices = window.speechSynthesis.getVoices();

  const englishVoices = voices.filter(v => v.lang.startsWith('en'));

  let bestVoice = null;
  for (const pref of VOICE_PREFERENCES) {
    bestVoice = englishVoices.find(v => v.name.includes(pref));
    if (bestVoice) break;
  }

  if (!bestVoice) {
    bestVoice = englishVoices[0] || voices[0];
  }

  if (bestVoice) {
    utterance.voice = bestVoice;
  }

  utterance.rate = 0.92;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = (): void => {
  currentUtterance = null;
  window.speechSynthesis.cancel();
};
