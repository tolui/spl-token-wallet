import { MARKETS } from '@project-serum/serum';
import { PublicKey } from '@solana/web3.js';
import { MAINNET_URL } from './connection';

interface Markets {
  [coin: string]: {
    publicKey: PublicKey;
    name: string;
    deprecated?: boolean;
  };
}

export const serumMarkets = (() => {
  const m: Markets = {};
  //dex.mn implementation
  const quest = {
    address: new PublicKey("7QwEMFeKS8mPACndc9EzpgoqKbQhpBm1N4JCtzjGEyR7"),
    name: "QUEST/USDT",
    programId:new PublicKey("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"),
    deprecated:false,
    quoteLabel:"USDT",
    baseLabel:"QUEST"
  }
  const NEWMARKETS = JSON.parse(JSON.stringify(MARKETS));
  NEWMARKETS.push(quest);
  NEWMARKETS.forEach((market) => {
  //dex.mn implementation
    //MARKETS.forEach((market) => {
    const coin = market.name.split('/')[0];
    if (m[coin]) {
      // Only override a market if it's not deprecated	.
      if (!m.deprecated) {
        m[coin] = {
          publicKey: market.address,
          name: market.name.split('/').join(''),
        };
      }
    } else {
      m[coin] = {
        publicKey: market.address,
        name: market.name.split('/').join(''),
      };
    }
  });
  return m;
})();

// Create a cached API wrapper to avoid rate limits.
class PriceStore {
  cache: {};

  constructor() {
    this.cache = {};
  }

  async getPrice(connection, marketName): Promise<number | undefined> {
    return new Promise((resolve, reject) => {
      if (connection._rpcEndpoint !== MAINNET_URL) {
        resolve(undefined);
        return;
      }
      if (this.cache[marketName] === undefined) {
        //dex.mn implementation
        let reqUrl = "https://serum-api.bonfida.com/orderbooks/";
        if(marketName === 'QUESTUSDT'){
          reqUrl = "https://api.dex.mn/orderbooks/";
        }
        fetch(reqUrl+marketName).then(
        //dex.mn implementation
        //fetch(`https://serum-api.bonfida.com/orderbooks/${marketName}`).then(
          (resp) => {
            resp.json().then((resp) => {
              if(marketName === 'QUESTUSDT'){
                console.log(resp)
              }
              if (resp.data.asks === null || resp.data.bids === null) {
                resolve(undefined);
              } else if (
                resp.data.asks.length === 0 &&
                resp.data.bids.length === 0
              ) {
                console.log("here2")
                resolve(undefined);
              } else if (resp.data.asks.length === 0) {
                resolve(resp.data.bids[0].price);
              } else if (resp.data.bids.length === 0) {
                resolve(resp.data.asks[0].price);
              } else {
                const mid =
                  (resp.data.asks[0].price + resp.data.bids[0].price) / 2.0;
                this.cache[marketName] = mid;
                resolve(this.cache[marketName]);
              }
            });
          },
        );
      } else {
        return resolve(this.cache[marketName]);
      }
    });
  }
}

export const priceStore = new PriceStore();
