async function run() {
  try {
    const { Innertube } = await import('youtubei.js');
    const yt = await Innertube.create({ clientType: 'TV_EMBEDDED' });
    console.log('Created default Innertube instance on VPS');
    const info = await yt.getBasicInfo('n61ULEU7CO0');
    console.log('getBasicInfo succeeded on VPS!');
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    console.log('Format chosen:', format ? format.mime_type : 'None');
    console.log('Format url:', format ? format.url : 'None');
    
    const infoFull = await yt.getInfo('n61ULEU7CO0');
    console.log('getInfo succeeded on VPS!');
    const formatFull = infoFull.chooseFormat({ type: 'audio', quality: 'best' });
    console.log('FormatFull chosen:', formatFull ? formatFull.mime_type : 'None');
    console.log('FormatFull url:', formatFull ? formatFull.url : 'None');
  } catch(e) {
    console.error('ERROR:', e.message || e);
  }
}
run();
