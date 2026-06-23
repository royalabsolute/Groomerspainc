async function testClient(clientType) {
  try {
    const { Innertube } = await import('youtubei.js');
    const yt = await Innertube.create({ clientType });
    const info = await yt.getInfo('n61ULEU7CO0');
    const status = info.playability_status?.status;
    const reason = info.playability_status?.reason;
    const hasStreamingData = !!info.streaming_data;
    console.log(`[${clientType}] Status: ${status}, Reason: ${reason}, HasStreamingData: ${hasStreamingData}`);
    return hasStreamingData;
  } catch (e) {
    console.log(`[${clientType}] Failed: ${e.message || e}`);
    return false;
  }
}

async function run() {
  const clients = ['WEB', 'MWEB', 'MUSIC', 'IOS', 'ANDROID', 'TV', 'TV_EMBEDDED', 'WEB_EMBEDDED'];
  for (const client of clients) {
    await testClient(client);
  }
}
run();
