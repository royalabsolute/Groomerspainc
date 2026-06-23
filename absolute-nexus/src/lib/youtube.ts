import { Innertube } from "youtubei.js";

declare global {
  var ytInstance: Innertube | undefined;
}

export async function getYoutubeClient(): Promise<Innertube> {
  if (!globalThis.ytInstance) {
    console.log("[Youtube Client] Creating new Innertube instance...");
    globalThis.ytInstance = await Innertube.create({ client_type: "ANDROID" } as any);
  }
  return globalThis.ytInstance;
}
