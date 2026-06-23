async function run() {
  try {
    const { Innertube } = await import('youtubei.js');
    const yt = await Innertube.create({ clientType: 'ANDROID' });
    console.log('Created Innertube instance on VPS');
    const stream = await yt.download('n61ULEU7CO0', { type: 'audio', quality: 'best' });
    console.log('Stream obtained, iterable:', typeof stream[Symbol.asyncIterator] === 'function');
    for await (const chunk of stream) {
      console.log('Chunk received, size:', chunk.length);
      break;
    }
    console.log('SUCCESS');
  } catch(e) {
    console.error('ERROR:', e.message || e);
  }
}
run();
