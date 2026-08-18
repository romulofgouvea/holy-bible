export type AudioVoice = {
  id: string;
  name: string;
};

export const AUDIO_VOICES: AudioVoice[] = [
  { id: "person1", name: "Person 1" },
  { id: "alex", name: "Alex" },
];

export const DEFAULT_VOICE_ID = "person1";
