import { ConnectButton } from '@rainbow-me/rainbowkit';
import Navbar from './pages/Navbar';
import Staking from './pages/Staking';

function App() {
  return (
    <div className="flex items-center flex-col bg-[#000000] text-stone-900 dark:text-stone-300 min-h-screen font-inter">
      <Navbar />
      <div className="px-4 w-full md:w-[95%] xl:w-3/4 ">
        <Staking />
      </div>
    </div>
  );
}

export default App;
