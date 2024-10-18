import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../constants";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from "wagmi"; // Import to use wallet info
import Web3 from 'web3';
import Swal from 'sweetalert2';



function Navbar() {
    const { i18n, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState({
        label: t('English'),  // Default language label
        img: ''  // Default image path
    });
    
    const { isConnected, address } = useAccount(); // Get wallet address and connection status
    const [isOwner, setIsOwner] = useState(false);
    const [testMode, setTestMode] = useState<boolean>(false);
    const contractABI = JSON.parse(import.meta.env.VITE_CONTRACT_ABI);
    const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
    const OWNER_ADDRESS = import.meta.env.VITE_OWNER_ADDRESS;

    // Check if the connected wallet address is the owner address
    useEffect(() => {
        if (isConnected && address?.toLowerCase() === OWNER_ADDRESS.toLowerCase()) {
            setIsOwner(true);
            fetchTestModeStatus();
        } else {
            setIsOwner(false);
        }
    }, [address, isConnected]);

    // Fetch the current test mode status
    const fetchTestModeStatus = async () => {
        if (isConnected && address && isOwner) {
            try {
                const web3 = new Web3(window.ethereum);
                const contract = new web3.eth.Contract(contractABI, contractAddress);
                const currentTestMode: boolean = await contract.methods.testMode().call();
                setTestMode(currentTestMode);
            } catch (error) {
                console.error('Error fetching Test Mode status:', error);
            }
        }
    };

    // Function to toggle Test Mode
    const handleTestModeToggle = async () => {
        try {
            const web3 = new Web3(window.ethereum);
            const contract = new web3.eth.Contract(contractABI, contractAddress);

            // Toggle the current value of testMode
            const newTestMode = !testMode;
            await contract.methods.toggleTestMode(newTestMode).send({ from: address });

            // Update the local state to reflect the change
            setTestMode(newTestMode);

            Swal.fire({
                title: 'Test Mode Toggled',
                text: `Test Mode is now ${newTestMode ? 'enabled' : 'disabled'}!`,
                icon: 'success',
                confirmButtonText: 'OK'
            });
        } catch (error: any) {
            console.error('Error toggling Test Mode:', error);
            Swal.fire({
                title: 'Error',
                text: 'Failed to toggle Test Mode. Please try again later.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    };

    const onChangeLang = (code: string, label: string, img: string) => {
        i18n.changeLanguage(code);
        setSelectedLanguage({ label, img });  // Update the label and image
        setIsOpen(false);
    }

    return (
        <div className="px-2 flex w-full items-center justify-between fixed z-40 top-0 left-0 h-28 md:pr-8 font dark:bg-[rgba(255,255,255,0)] backdrop-blur-[30px] shadow-[0_3px_6px_3px_rgba(0,0,0,0.4)] transition-all duration-300">
            <a href="https://staking.whalestrategy.net/">
                <img src="/logo.png" className="w-16 h-16 sm:ml-10" alt="Logo" />
            </a>
            <div className="flex items-center">
                <ConnectButton />
                <div className="relative">
                    <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-center w-24 md:w-32 h-10 rounded-[13px] p-2 bg-[#0E76FD] text-white text-[16px] font-bold ml-4">
                        {selectedLanguage.img && (
                            <img src={selectedLanguage.img} alt="" className="w-6 h-auto mr-2 mt-[4px]" />
                        )}
                        {t(selectedLanguage.label)}
                    </button>
                    {isOpen && (
                        <div className="absolute ml-4 top-full mt-1 w-24 md:w-32 bg-[#2c2d30] text-white shadow-lg">
                            {LANGUAGES.map(({ code, label, lang }) => (
                                <div key={code} className="flex items-center justify-center cursor-pointer p-2 hover:bg-blue-100" onClick={() => onChangeLang(code, label, lang)}>
                                    <img src={lang} alt="" className="w-6 h-auto mr-2 mt-[4px]" />
                                    <span>{t(label)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Display Test Mode Toggle Button only for the Owner */}
                {isOwner && (
                    <button
                        onClick={handleTestModeToggle}
                        className="ml-4 bg-[#0E76FD] text-white px-4 py-2 rounded-md font-bold"
                    >
                        Toggle Test Mode
                    </button>
                )}

                {/* Display the current Test Mode status */}
                {isOwner && (
                    <span className="ml-4 text-white font-bold">
                        Test Mode: {testMode ? 'ON' : 'OFF'}
                    </span>
                )}
            </div>
        </div>
    )
}

export default Navbar;
