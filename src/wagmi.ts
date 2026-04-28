import { http, createConfig } from 'wagmi';
import { mainnet, bsc, bscTestnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { getDefaultConfig } from 'connectkit';

const projectId = "075c328670f5e56e477617631da7e089";

export const config = createConfig(
  getDefaultConfig({
    chains: [bsc, mainnet, bscTestnet, polygon, optimism, arbitrum],
    transports: {
      [mainnet.id]: http(),
      [bsc.id]: http(),
      [bscTestnet.id]: http(),
      [polygon.id]: http(),
      [optimism.id]: http(),
      [arbitrum.id]: http(),
    },
    walletConnectProjectId: projectId,
    appName: "80U Matrix System",
    // We can try to restrict connectors here if getDefaultConfig supports it, 
    // but usually it's better to let it be. 
    // If the error persists, it might be the browser extension itself.
  })
);
