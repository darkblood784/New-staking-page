// tronweb.ts
const TronWeb = require('tronweb');


// Create TronWeb instance
export const tronWeb: any = new TronWeb({
  fullHost: 'https://api.nileex.io', // URL for the TRON node (Nile Testnet in this case)
});

// Expose TronWeb globally for testing
(window as any).tronWeb1 = tronWeb;
