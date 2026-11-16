// 起動音（.ogg）エンジン

class StartupAudioEngine {
  private isMuted: boolean = false;
  private audio: HTMLAudioElement | null = null;

  constructor() {
    // プリロード (.oggファイルを指定)
    if (typeof window !== 'undefined') {
      try {
        this.audio = new Audio('/startup.ogg');
        this.audio.preload = 'auto';
        this.audio.volume = 0.95;
      } catch {
        // ignore
      }
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.audio) {
      this.audio.muted = muted;
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * 起動音を再生（指定の .ogg ファイルをそのまま再生）
   */
  public async playStartupSound(): Promise<void> {
    if (this.isMuted) return;

    try {
      if (!this.audio) {
        this.audio = new Audio('/startup.ogg');
      }
      this.audio.currentTime = 0;
      this.audio.volume = 0.95;
      await this.audio.play();
    } catch (error) {
      console.warn('Startup audio playback error:', error);
    }
  }
}

export const startupAudio = new StartupAudioEngine();
