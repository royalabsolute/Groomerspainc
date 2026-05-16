const fs = require('fs');
const path = require('path');

// Read the JPEG as a buffer
const inputPath = path.join(__dirname, '..', 'groomersinc.jpeg');
const outputPath = path.join(__dirname, '..', 'public', 'groomersinc.png');

// Use the 'sharp' package if available, otherwise use jimp
let sharp;
try {
    sharp = require('sharp');
} catch (e) {
    sharp = null;
}

if (sharp) {
    sharp(inputPath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
        .then(({ data, info }) => {
            const { width, height, channels } = info;
            for (let i = 0; i < data.length; i += channels) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // If pixel is near-white (>238 on all channels), make transparent
                if (r > 238 && g > 238 && b > 238) {
                    data[i + 3] = 0;
                }
            }
            return sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
                .composite([{ input: Buffer.from(data), raw: { width, height, channels: 4 } }])
                .png()
                .toFile(outputPath);
        })
        .then(() => console.log('Done with sharp! Saved:', outputPath))
        .catch(err => console.error('Sharp error:', err));
} else {
    console.log('Sharp not found. Trying Jimp...');
    const Jimp = require('jimp');
    Jimp.read(inputPath).then(img => {
        img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
            const r = this.bitmap.data[idx];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];
            if (r > 238 && g > 238 && b > 238) {
                this.bitmap.data[idx + 3] = 0;
            }
        });
        img.writeAsync(outputPath).then(() => console.log('Done with Jimp! Saved:', outputPath));
    }).catch(err => console.error('Jimp error:', err));
}
