export class MultiChannelOutputRouter {
  private ctx: AudioContext | null = null;
  private mergerNode: ChannelMergerNode | null = null;
  private splitterNode: ChannelSplitterNode | null = null;
  private routeGainL: GainNode | null = null;
  private routeGainR: GainNode | null = null;
  private currentChannelRouting: string = 'Ch 1 / 2 (Main L/R)';
  private maxChannels: number = 2;

  public init(ctx: AudioContext, initialChannels = 6) {
    this.ctx = ctx;
    this.maxChannels = Math.max(2, Math.min(32, initialChannels));

    try {
      if (this.ctx.destination.maxChannelCount >= this.maxChannels) {
        this.ctx.destination.channelCount = this.maxChannels;
        this.ctx.destination.channelCountMode = 'explicit';
        this.ctx.destination.channelInterpretation = 'discrete';
      }
    } catch (e) {
      console.warn('Could not set multi-channel destination mode:', e);
    }

    this.setupMerger();
  }

  private setupMerger() {
    if (!this.ctx) return;
    try {
      this.mergerNode = this.ctx.createChannelMerger(this.maxChannels);
      this.splitterNode = this.ctx.createChannelSplitter(2);
      this.routeGainL = this.ctx.createGain();
      this.routeGainR = this.ctx.createGain();

      this.splitterNode.connect(this.routeGainL, 0);
      this.splitterNode.connect(this.routeGainR, 1);

      this.mergerNode.connect(this.ctx.destination);
      this.applyRouting(this.currentChannelRouting);
    } catch (e) {
      console.warn('Error setting up multi-channel output merger:', e);
    }
  }

  public connectInput(sourceNode: AudioNode) {
    if (this.splitterNode) {
      sourceNode.connect(this.splitterNode);
    }
  }

  public setMaxChannels(channels: number) {
    this.maxChannels = Math.max(2, Math.min(32, channels));
    if (this.ctx) {
      try {
        if (this.ctx.destination.maxChannelCount >= this.maxChannels) {
          this.ctx.destination.channelCount = this.maxChannels;
        }
      } catch (e) {
        // ignore
      }
      this.setupMerger();
    }
  }

  public applyRouting(routingId: string) {
    this.currentChannelRouting = routingId;
    if (!this.routeGainL || !this.routeGainR || !this.mergerNode || !this.ctx) return;

    try {
      this.routeGainL.disconnect();
      this.routeGainR.disconnect();

      if (!routingId || routingId === 'none') {
        return;
      }

      // Determine target channels (0-indexed for Web Audio ChannelMerger)
      let targetL = 0;
      let targetR = 1;

      if (routingId.includes('3 / 4') || routingId.includes('3/4')) {
        targetL = Math.min(2, this.maxChannels - 1);
        targetR = Math.min(3, this.maxChannels - 1);
      } else if (routingId.includes('5 / 6') || routingId.includes('5/6')) {
        targetL = Math.min(4, this.maxChannels - 1);
        targetR = Math.min(5, this.maxChannels - 1);
      } else if (routingId.includes('7 / 8') || routingId.includes('7/8')) {
        targetL = Math.min(6, this.maxChannels - 1);
        targetR = Math.min(7, this.maxChannels - 1);
      } else if (routingId.includes('Ch 1 (Mono') || routingId === 'Ch 1') {
        targetL = 0;
        targetR = 0;
      } else if (routingId.includes('Ch 2 (Mono') || routingId === 'Ch 2') {
        targetL = Math.min(1, this.maxChannels - 1);
        targetR = Math.min(1, this.maxChannels - 1);
      } else if (routingId.includes('Ch 3')) {
        targetL = Math.min(2, this.maxChannels - 1);
        targetR = Math.min(2, this.maxChannels - 1);
      } else if (routingId.includes('Ch 4')) {
        targetL = Math.min(3, this.maxChannels - 1);
        targetR = Math.min(3, this.maxChannels - 1);
      } else if (routingId.includes('Ch 5')) {
        targetL = Math.min(4, this.maxChannels - 1);
        targetR = Math.min(4, this.maxChannels - 1);
      } else if (routingId.includes('Ch 6')) {
        targetL = Math.min(5, this.maxChannels - 1);
        targetR = Math.min(5, this.maxChannels - 1);
      }

      this.routeGainL.connect(this.mergerNode, 0, targetL);
      this.routeGainR.connect(this.mergerNode, 0, targetR);
    } catch (e) {
      console.warn('Could not re-route output channels:', e);
    }
  }

  public async setOutputSinkId(deviceId: string): Promise<boolean> {
    if (this.ctx && typeof (this.ctx as any).setSinkId === 'function') {
      try {
        await (this.ctx as any).setSinkId(deviceId === 'default' ? '' : deviceId);
        return true;
      } catch (e) {
        console.warn('setSinkId failed:', e);
        return false;
      }
    }
    return false;
  }
}

export const multiChannelOutputRouter = new MultiChannelOutputRouter();
