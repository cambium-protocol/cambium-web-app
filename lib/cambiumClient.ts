import { CambiumClient } from '@cambium-protocol/sdk';

let client: CambiumClient | null = null;

export function getCambiumClient(): CambiumClient {
  if (client) return client;

  client = new CambiumClient({
    network: (process.env.NEXT_PUBLIC_STELLAR_NETWORK as any) || 'testnet',
    rpcUrl:
      process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
      'https://soroban-testnet.stellar.org',
    contracts: {
      registry: process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ID || '',
      creditToken: process.env.NEXT_PUBLIC_CREDIT_TOKEN_CONTRACT_ID || '',
      marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ID || '',
      retirement: process.env.NEXT_PUBLIC_RETIREMENT_CONTRACT_ID || '',
    },
  });

  return client;
}
