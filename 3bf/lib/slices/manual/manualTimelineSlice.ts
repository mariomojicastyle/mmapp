// @ts-nocheck

export const createManualTimelineSlice = (set: any, get: any): any => ({
  isTimelinePlaying: false,
  timelineCurrentTime: 0,
  timelineVelocidad: 1.0,
  idiomaVozManual: "es",
  audioMutedManual: false,

  setIsTimelinePlaying: (isTimelinePlaying: boolean) => set({ isTimelinePlaying }),
  setTimelineCurrentTime: (timelineCurrentTime: number) => set({ timelineCurrentTime }),
  setTimelineVelocidad: (timelineVelocidad: number) => set({ timelineVelocidad }),
  setIdiomaVozManual: (idiomaVozManual: string) => set({ idiomaVozManual }),
  setAudioMutedManual: (audioMutedManual: boolean) => set({ audioMutedManual }),
  versionAnimacionManual: 0,
  despertarAnimacionManual: () =>
    set((state: any) => ({ versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 })),
});
