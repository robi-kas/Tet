import { http, createConfig } from 'wagmi';
import { mainnet, bsc, bscTestnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';
import { getDefaultConfig } from 'connectkit';

const projectId = "075c328670f5e56e477617631da7e089";

export const config = createConfig({
  chains: [bsc, mainnet, bscTestnet, polygon, optimism, arbitrum],
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({ projectId }),
    coinbaseWallet({ appName: "80U Matrix System" }),
  ],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
  },
  multiInjectedProviderDiscovery: false,
});
