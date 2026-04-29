import { createConfig, http } from 'wagmi';
import { mainnet, bsc } from 'wagmi/chains';
import { getDefaultConfig } from 'connectkit';

const projectId = "075c328670f5e56e477617631da7e089";

export const config = createConfig(
  getDefaultConfig({
    chains: [bsc, mainnet],
    transports: {
      [mainnet.id]: http(),
      [bsc.id]: http(),
    },
    walletConnectProjectId: projectId,
    appName: "80U Matrix System",
    appDescription: "DeFi Matrix Referral Ecosystem",
  })
);
