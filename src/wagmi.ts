
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrum, base, mainnet, optimism, polygon } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Staking App',
  projectId: '53f3bb1882dbe8e266645f7cec3c4225',
  chains: [mainnet, polygon, optimism, arbitrum, base],
});
