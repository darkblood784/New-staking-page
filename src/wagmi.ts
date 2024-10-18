
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { bsc, bscTestnet, arbitrum, base, mainnet, optimism, polygon, xLayer} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Staking App',
  projectId: '53f3bb1882dbe8e266645f7cec3c4225',
  chains: [xLayer, mainnet, bsc, bscTestnet, polygon, optimism, arbitrum, base],
});
