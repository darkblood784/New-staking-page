import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Web3 from "web3";
import { useAccount } from "wagmi"; // Import to use wallet info
import usdtABI from "../usdtABI.json";
import Swal from 'sweetalert2';


import banner from '../assets/banner.png';
import usdtbackground from '../assets/usdtplanbackground.png';
import btcbg from '../assets/bitcoinplanbackground.png';
import ethbg from '../assets/ethereumplanbackground.png';
import mystake from '../assets/my_staking_btg.png'
import usdt from '../assets/usdt.png';
import btc from '../assets/btc.png';
import eth from '../assets/eth.png';
import bg_whale from '../assets/bg-whale.png';
import linktree from '../assets/social/linktree.png';
import discord from '../assets/social/discord.png';
import symbol from '../assets/symbol.png';

import WhaleSlider from "../components/SliderComponent";
import PrimeInput from "../components/PrimeInput";
import DurationSelector from "../components/DurationSelector";

interface WhaleImagePaths {
    "0-25": string;
    "25-75": string;
    "75-100": string;
}

interface BlinkingUnderscoreInputProps {
    inputValue: string;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    validatePrime: () => void;
}

const headImages: WhaleImagePaths = {
    "0-25": './whale/TTTTWHALE.png',
    "25-75": './whale/25-75.png',
    "75-100": './whale/75-100.png'
};

// Contract ABI and addresses from .env
const contractABI = JSON.parse(import.meta.env.VITE_CONTRACT_ABI);
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const usdtAddress = import.meta.env.VITE_USDT_ADDRESS;
const wbtcAddress = import.meta.env.VITE_WBTC_ADDRESS;
const wethAddress = import.meta.env.VITE_WETH_ADDRESS;



function Staking() {
    const { t } = useTranslation();
    const [usdtduration, setUsdtDuration] = useState("");
    const [btcduration, setBtcDuration] = useState("");
    const [ethduration, setEthDuration] = useState("");
    const [inputValueusdt, setInputValueusdt] = useState('');
    const [inputValuebtc, setInputValuebtc] = useState('');
    const [inputValueeth, setInputValueeth] = useState('');
    const [sliderValueusdt, setSliderValueusdt] = useState<number>(0);
    const [sliderValuebtc, setSliderValuebtc] = useState<number>(0);
    const [sliderValueeth, setSliderValueeth] = useState<number>(0);

    const [usdtWalletBalance, setUsdtWalletBalance] = useState<string | null>(null);
    const [testMode, setTestMode] = useState<boolean>(false);

    const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const [hasStakes, setHasStakes] = useState(false); // State to track if the user has any active stakes

    const [loading, setLoading] = useState(true); // To manage loading state for the stake info

    

    const { isConnected, address } = useAccount(); // To get wallet address and connection status
    const [web3, setWeb3] = useState<Web3 | null>(null);
    const [contract, setContract] = useState<any>(null);
    const [stakedAmount, setStakedAmount] = useState<{ [key: string]: number | null }>({
        USDT: null,
        BTC: null,
        ETH: null,
    });
    const [stakeRewards, setStakeRewards] = useState<{ [key: string]: number | null }>({
        USDT: null,
        BTC: null,
        ETH: null,
    });
    const [stakeEnd, setStakeEnd] = useState<{ [key: string]: number | null }>({
        USDT: null,
        BTC: null,
        ETH: null,
    });
    const [stakedOn, setStakedOn] = useState<{ [key: string]: number | null }>({
        USDT: null,
        BTC: null,
        ETH: null,
    });


    useEffect(() => {
        const initializeWeb3AndContract = async () => {
            if (isConnected && window.ethereum) {
                try {
                    const _web3 = new Web3(window.ethereum);
                    setWeb3(_web3);
                    const _contract = new _web3.eth.Contract(contractABI, contractAddress);
                    setContract(_contract);
                    
                    // Fetch stake information after initializing web3 and contract
                    await fetchStakeInfo(_web3, _contract);
                    
                    // Show SweetAlert2 toast notification for wallet connection success
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: 'Wallet connected successfully!',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true
                    });
                } catch (error) {
                    console.error("Error initializing Web3 or contract:", error);
                }
            } else {
                // Reset state when wallet is disconnected
                setWeb3(null);
                setContract(null);
                setHasStakes(false);
                setLoading(false); // Stop loading if wallet is disconnected
            }
        };

        initializeWeb3AndContract();
    }, [isConnected, address]);

    useEffect(() => {
        const fetchTestMode = async () => {
            if (contract) {
                try {
                    const mode = await contract.methods.testMode().call();
                    setTestMode(mode);
                } catch (error) {
                    console.error("Error fetching test mode status:", error);
                }
            }
        };
        fetchTestMode();
    }, [contract]);
    

    
    

    // Fetch wallet balance function to be called in useEffect
    useEffect(() => {
        const fetchWalletBalance = async () => {
            if (web3 && address) {
                try {
                    // Create a USDT contract instance
                    const usdtContract = new web3.eth.Contract(usdtABI, usdtAddress);
    
                    // Ensure the balanceOf method is available
                    if (usdtContract.methods.balanceOf) {
                        // Fetch balance for the connected address
                        const balance: string = await usdtContract.methods.balanceOf(address).call();
                        
                        if (balance) {
                            const balanceInUSDT = web3.utils.fromWei(balance, 'ether');
                            setUsdtWalletBalance(balanceInUSDT);
                        } else {
                            console.error("Failed to fetch balance: Balance returned undefined or null");
                            setUsdtWalletBalance("Error");
                        }
                    } else {
                        console.error("balanceOf method not available in the contract ABI");
                        setUsdtWalletBalance("Error");
                    }
                } catch (error) {
                    console.error("Error fetching USDT balance:", error);
                    setUsdtWalletBalance("Error");
                }
            } else {
                setUsdtWalletBalance("Wallet not connected");
            }
        };
    
        if (isConnected) {
            fetchWalletBalance();
        }
    }, [web3, address, isConnected]);

    useEffect(() => {
        console.log("hasStakes state updated:", hasStakes);
    }, [hasStakes]);
    
    
    // Function to fetch staking information
    const fetchStakeInfo = async (_web3: Web3, _contract: any) => {
        if (_web3 && _contract && address) {
            try {
                console.log("Attempting to fetch staking information...");
                setLoading(true); // Start loading while fetching

                const tokens = [
                    { address: usdtAddress, name: "USDT" },
                    { address: wbtcAddress, name: "BTC" },
                    { address: wethAddress, name: "ETH" }
                ];

                let hasActiveStakes = false;

                const promises = tokens.map(async (token) => {
                    console.log(`Fetching data for token: ${token.name}`);
                    const stakedInfo = await contract.methods.userStakeInfos(address, token.address).call();
                    console.log(`Staked info for ${token.name}:`, stakedInfo);

                    const stakedAmount = stakedInfo.stakedAmount ? _web3.utils.fromWei(stakedInfo.stakedAmount, "ether") : "0";
                    const rewards = stakedInfo.rewards ? _web3.utils.fromWei(stakedInfo.rewards, "ether") : "0";

                    const amount = Number(stakedAmount);
                    console.log(`Amount staked for ${token.name}:`, amount);

                    if (amount > 0) {
                        hasActiveStakes = true; // If any token has a staked amount, set to true
                    }

                    return {
                        name: token.name,
                        amount,
                        rewards: Number(rewards),
                        stakeEnd: stakedInfo.stakeEnd ? Number(stakedInfo.stakeEnd) : null,
                        stakedAt: stakedInfo.stakedAt ? Number(stakedInfo.stakedAt) : null,
                    };
                });

                const results = await Promise.all(promises);

                // Log out the final results before updating state
                console.log("Final results from fetchStakeInfo:", results);
                console.log("Has active stakes after fetching:", hasActiveStakes);

                
                // Process results and update state
                const stakedAmounts: { [key: string]: number } = {};
                const stakeRewards: { [key: string]: number } = {};
                const stakeEnds: { [key: string]: number | null } = {};
                const stakedOns: { [key: string]: number | null } = {};

                results.forEach((token) => {
                    stakedAmounts[token.name] = token.amount;
                    stakeRewards[token.name] = token.rewards;
                    stakeEnds[token.name] = token.stakeEnd;
                    stakedOns[token.name] = token.stakedAt;
                });

                setStakedAmount(stakedAmounts);
                setStakeRewards(stakeRewards);
                setStakeEnd(stakeEnds);
                setStakedOn(stakedOns);

                setHasStakes(hasActiveStakes);

                 // Save fetched stake information in session storage
                 sessionStorage.setItem("stakeInfo", JSON.stringify({
                    stakedAmount: stakedAmounts,
                    hasStakes: hasActiveStakes
                }));


                console.log("Successfully fetched staking information");
            } catch (error) {
                console.error("Error fetching staking information:", error);
                Swal.fire({
                    title: 'Data Fetch Error',
                    text: 'Unable to retrieve staking information. Please try again later.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            } finally {
                setLoading(false); // Stop loading once data is fetched
            }
        } else {
            console.warn("Missing web3, contract, or address");
        }
    };

    // Effect to fetch staking information when wallet connects
    useEffect(() => {
        if (isConnected && web3 && contract && address) {
            console.log("All dependencies are ready, fetching stake info...");
            fetchStakeInfo(web3, contract);
        }
    }, [web3, contract, address, isConnected]);
    
    
        

    // Function to scroll to the staking section
    const scrollToStakingSection = () => {
        const stakingSection = document.getElementById('staking-section'); // Assume you have a wrapper element with this ID
        if (stakingSection) {
            stakingSection.scrollIntoView({ behavior: 'smooth' });
        }
    };
    
    
    


    useEffect(() => {
        if (window.ethereum) {
            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);
    
            // Explicitly declare accounts type as string[]
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length > 0) {
                    setWeb3(new Web3(window.ethereum));
                    // This will automatically trigger the useEffect hook to fetch the new balance
                } else {
                    setUsdtWalletBalance("Not connected");
                }
            };
    
            window.ethereum.on('accountsChanged', handleAccountsChanged);
    
            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            };
        }
    }, []);
    



    const handleStakeUSDT = async () => {
        if (!web3 || !contract || !address) {
            Swal.fire({
                title: 'Oops!',
                text: 'Please connect your wallet first!',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }
    
        try {
            // Validate input amount
            if (!inputValueusdt || parseFloat(inputValueusdt) <= 0) {
                Swal.fire({
                    title: 'Invalid Input',
                    text: 'Please enter a valid amount greater than zero to stake.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
                return;
            }
    
            // Validate duration selection
            if (!usdtduration) {
                Swal.fire({
                    title: 'Select Duration',
                    text: 'Please select a staking duration.',
                    icon: 'info',
                    confirmButtonText: 'OK'
                });
                return;
            }
    
            // Convert input value to Wei
            const amountToStake = web3.utils.toWei(inputValueusdt, "ether");
    
            // Step 1: Check allowance
            const usdtContract = new web3.eth.Contract(usdtABI, usdtAddress);
            const allowance = await usdtContract.methods.allowance(address, contractAddress).call();
    
            if (Number(allowance) < Number(amountToStake)) {
                // Approve the staking contract to transfer tokens on behalf of the user
                await usdtContract.methods
                    .approve(contractAddress, web3.utils.toWei('1000000', 'ether')) // Approving a large amount
                    .send({ from: address })
                    .on('transactionHash', (hash) => {
                        Swal.fire({
                            title: 'Approval in Progress',
                            text: `Transaction Hash: ${hash}`,
                            icon: 'info',
                            confirmButtonText: 'OK'
                        });
                    });
            }
    
            // Step 2: Stake the tokens after approval (or if already approved)
            const durationInMonths = usdtduration === '30 Days' ? 1 : usdtduration === '6 Months' ? 6 : 12;
            const gasLimit = 200000; // Set a reasonable gas limit
            const gasPrice = web3.utils.toWei('6', 'gwei'); // Set gas price
    
            await contract.methods.stake(usdtAddress, durationInMonths, amountToStake)
                .send({ from: address, gas: gasLimit, gasPrice: gasPrice })
                .on('receipt', async () => {
                    Swal.fire({
                        title: 'Success!',
                        text: 'Staked successfully!',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });
    
                    // Step 4: Clear input fields and update UI
                    // Clear input fields and update UI
                    setInputValueusdt('');
                    setSliderValueusdt(0);
                    setUsdtDuration('');

                    // Fetch updated staking information
                    await fetchStakeInfo(web3, contract);

                });
    
        } catch (error: any) {
            console.error("Staking error:", error);
    
            if (error.message.includes("User denied transaction")) {
                Swal.fire({
                    title: 'Transaction Denied',
                    text: 'Transaction was denied by the user.',
                    icon: 'warning',
                    confirmButtonText: 'OK'
                });
            } else {
                Swal.fire({
                    title: 'Staking Failed',
                    text: `Staking failed: ${error.message}`,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        }
    };
    


    const handleUnstake = async (tokenAddress: string) => {
        if (!web3 || !contract || !address) {
            Swal.fire({
                title: 'Oops!',
                text: 'Please connect your wallet first!',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }
    
        try {
            // Define gas parameters
            const gasLimit = 200000; // Set a reasonable gas limit
            const gasPrice = web3.utils.toWei('20', 'gwei'); // Set the gas price to 20 Gwei

            // Call the unstake function of the smart contract with gas settings
            await contract.methods.unstake(tokenAddress).send({ from: address, gas: gasLimit, gasPrice: gasPrice });

    
            Swal.fire({
                title: 'Success!',
                text: 'Unstaked successfully!',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        } catch (error: any) {
            console.error("Unstaking error:", error);
            if (error.message && error.message.includes("User denied transaction")) {
                Swal.fire({
                    title: 'Transaction Denied',
                    text: 'Transaction was denied by the user.',
                    icon: 'warning',
                    confirmButtonText: 'OK'
                });
            } else {
                Swal.fire({
                    title: 'Unstaking Failed',
                    text: `Unstaking failed: ${error.message}`,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        }
    };

  


    const durationOptions = [
        { key: 'day', percent: '15%' },
        { key: 'month', percent: '24%' },
        { key: 'year', percent: '36%' }
    ];

    const isPrime = (num: number): boolean => {
        if (num <= 1) return false;
        if (num <= 3) return true;
        if (num % 2 === 0 || num % 3 === 0) return false;
        for (let i = 5; i * i <= num; i += 6) {
            if (num % i === 0 || num % (i + 2) === 0) return false;
        }
        return true;
    };

    const validatePrime = (value: string, setter: (value: string) => void) => {
        const num = Number(value);
        if (num !== Math.floor(num)) {
            return;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
        const value = e.target.value;
        const validValue = value.replace(/[^0-9.]/g, ''); // Allow only digits and a single decimal point
        setter(validValue);
    };

    const getWhaleHeadSrcusdt = (): string => {
        if (sliderValueusdt <= 25) return headImages["0-25"];
        if (sliderValueusdt <= 75) return headImages["25-75"];
        return headImages["75-100"];
    };

    const getWhaleHeadSrcbtc = (): string => {
        if (sliderValuebtc <= 25) return headImages["0-25"];
        if (sliderValuebtc <= 75) return headImages["25-75"];
        return headImages["75-100"];
    };

    const getWhaleHeadSrceth = (): string => {
        if (sliderValueeth <= 25) return headImages["0-25"];
        if (sliderValueeth <= 75) return headImages["25-75"];
        return headImages["75-100"];
    };

    return (
        <div className="flex flex-col w-full items-center text-white">
            <div className="flex h-screen w-full items-center text-[40px] my-[20px] md:my-0 md:text-[80px] relative justify-center">
                <img src={banner} alt="Whale" className="absolute w-full h-[100%] my-[20px] md:h-[auto]" />
                <div className="relative z-10 flex flex-col justify-center items-start w-full h-full px-4 mb-[-40px]">
                    <h1 className="font-bold">{t('swim')}</h1>
                    <h1 className="font-bold">{t('earn')}</h1>
                    <p className="mt-4 text-[15px] md:text-[25px]">{t('Join')}</p>
                </div>
                
            </div>
            {/* Conditionally Render No Stakes or Staking Details */}
                {!isConnected || !hasStakes ? (
                    <div className="w-full lg:w-[47%] flex flex-col items-center justify-center bg-black rounded-lg p-8">
                        <h2 className="text-white text-3xl font-bold mb-4">YOUR PLAN</h2>
                        <p className="text-white mb-4">NO STAKES YET</p>
                        <p className="text-white mb-4">
                            You don't have any stakes yet. Start your journey as a whale and make your first stake.
                        </p>
                        <button
                            onClick={scrollToStakingSection}
                            className="bg-blue-500 text-white p-3 rounded-md mt-4"
                        >
                            GET STARTED
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-wrap w-full lg:w-[47%] relative mt-10">
                        {/* Rest of the component showing staking details */}
                        <p>Your current stake:</p>
                        {/* Display staked amount here */}
                        <img src={mystake} className="absolute w-full h-full" alt="" />
                        <div className="p-2 m-2 md:m-10 w-full relative z-10 md:p-0 md:justify-between">
                            <div className="my-auto w-full md:w-[35%]">
                                <div className="flex items-center mb-4">
                                    <img src={usdt} alt="" className="w-14 h-14 mr-4" />
                                    <p className="text-[35px] md:text-[30px] font-bold flex">USDT</p>
                                </div>
                            </div>
                            <div className="flex flex-col mt-4 space-y-4">
                                <div className="flex justify-between">
                                    <p>{t('total')}</p>
                                    <p className="text-[25px] md:text-[20px]">
                                        {stakedAmount.USDT !== null ? stakedAmount.USDT.toFixed(2) : 'Loading...'}
                                    </p>
                                </div>
                                <div className="flex justify-between">
                                    <p>{t('available')}</p>
                                    <p className="text-[25px] md:text-[20px]">
                                        {usdtWalletBalance && !isNaN(parseFloat(usdtWalletBalance))
                                            ? parseFloat(usdtWalletBalance).toFixed(2)
                                            : 'Loading...'}
                                    </p>
                                </div>
                                <div className="flex justify-between">
                                    <p>Staked On:</p>
                                    <p className="text-[25px] md:text-[20px] loader">
                                        {stakedOn.USDT ? new Date(stakedOn.USDT * 1000).toLocaleString() : 'Loading...'}
                                    </p>
                                </div>
                                <div className="flex justify-between">
                                    <p>Unlock On:</p>
                                    <p className="text-[25px] md:text-[20px] loader">
                                        {stakeEnd.USDT ? new Date(stakeEnd.USDT * 1000).toLocaleString() : 'Loading...'}
                                    </p>
                                </div>
                                <div className="flex justify-between">
                                    <p>Current Rewards:</p>
                                    <p className="text-[25px] md:text-[20px] loader">
                                        {stakeRewards.USDT !== null && !isNaN(stakeRewards.USDT)
                                            ? `${stakeRewards.USDT.toFixed(2)} USDT`
                                            : 'Loading...'}
                                    </p>
                                </div>
                                <div className="flex justify-between mt-4">
                                    <button
                                        className="bg-blue-500 text-white p-2 rounded-md"
                                    >
                                        Unlock
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


            <div className="flex justify-between w-full" id="staking-section">
                <h1 className="flex md:text-[60px] text-[30px] font-bold">{t('trading')}</h1>
                <p className="md:text-[20px] text-[13px] items-end flex">{t('risk')}</p>
            </div>

            {/* USDT Section */}
            <div className="flex flex-wrap w-full relative mt-10">
                <img src={usdtbackground} className="absolute w-full h-full" alt="" />
                <div className="p-2 flex flex-wrap w-full relative z-10 md:p-0 md:justify-between">
                    <div className="my-auto pt-5 md:pt-0 ml-2 w-full md:w-[35%] lg:ml-10">
                        <div className="flex items-center">
                            <img src={usdt} alt="" className="w-14 h-14 mr-4" />
                            <p className="text-[35px] md:text-[30px] font-bold flex">USDT</p>
                        </div>
                        <DurationSelector durations={durationOptions} setDuration={setUsdtDuration} />

                    </div>
                    <div className="w-full md:w-[30%] lg:pl-10 pt-16 pb-5">
                        <div className="flex justify-between">
                            <p className="text-[25px] md">{t('stake')}</p>
                            <PrimeInput
                                value={inputValueusdt}
                                setValue={setInputValueusdt}
                                validatePrime={validatePrime}

                            />
                        </div>
                        <div className="flex w-full justify-between">
                            <p className="text-[25px] md">{usdtduration ? usdtduration : "0 Days"}</p>
                            <div className="text-2xl mt-2.5">{`${Math.round(sliderValueusdt)}%`}</div>
                        </div>
                        <WhaleSlider
                            sliderValue={sliderValueusdt}
                            setSliderValue={setSliderValueusdt}
                            getWhaleHeadSrc={getWhaleHeadSrcusdt}
                        />
                    </div>
                    {/* Stake Button */}
                    <div className="w-full h-20 md:w-1/4 md:h-full opacity-50 bg-black rounded-2xl flex justify-center items-center cursor-pointer">
                        <button
                            onClick={handleStakeUSDT} // <-- Add this line
                            className="bg-blue-500 text-white p-2 rounded-md mt-4"
                        >
                            {t('take')}
                        </button>
                    </div>
                </div>
            </div>

            {/* BTC Section */}
            <div className="flex flex-wrap w-full relative mt-10">
                <img src={btcbg} className="absolute w-full h-full" alt="" />
                <div className="p-2 flex flex-wrap w-full relative z-10 md:p-0 md:justify-between">
                    <div className="my-auto pt-5 md:pt-0 ml-2 w-full md:w-[35%] lg:ml-10">
                        <div className="flex items-center">
                            <img src={btc} alt="" className="w-14 h-14 mr-4" />
                            <p className="text-[35px] md:text-[30px] font-bold flex">Bitcoin
                                <sup>
                                    <button title={t('wbtc')}>
                                        <img src={symbol} className="ml-4" alt="" />
                                    </button>
                                </sup>
                            </p>
                        </div>
                        <DurationSelector durations={durationOptions} setDuration={setBtcDuration} />
                    </div>
                    <div className="w-full md:w-[30%] lg:pl-10 pt-16 pb-5">
                        <div className="flex justify-between ">
                            <p className="text-[25px]">{t('stake')}</p>
                            <PrimeInput
                                value={inputValuebtc}
                                setValue={setInputValuebtc}
                                validatePrime={validatePrime}
                            />
                        </div>
                        <div className="flex w-full justify-between">
                            <p className="text-[25px]">{btcduration ? btcduration : "0 Days"}</p>
                            <div className="text-2xl mt-2.5">{`${Math.round(sliderValuebtc)}%`}</div>
                        </div>
                        <WhaleSlider
                            sliderValue={sliderValuebtc}
                            setSliderValue={setSliderValuebtc}
                            getWhaleHeadSrc={getWhaleHeadSrcbtc}
                        />
                    </div>
                    <div className="w-full h-20 md:w-1/4 md:h-full opacity-50 bg-black rounded-2xl flex justify-center items-center cursor-pointer">
                        <p className="text-[35px] md:text-[30px] font-bold">{t('take')} <span className="ml-2">&#9660;</span></p>
                    </div>
                </div>
            </div>

            {/* ETH Section */}
            <div className="flex flex-wrap w-full relative mt-10">
                <img src={ethbg} className="absolute w-full h-full" alt="" />
                <div className="p-2 flex flex-wrap w-full relative z-10 md:p-0 md:justify-between">
                    <div className="my-auto pt-5 md:pt-0 ml-2 w-full md:w-[35%] lg:ml-10">
                        <div className="flex items-center">
                            <img src={eth} alt="" className="w-14 h-14 mr-4" />
                            <p className="text-[35px] md:text-[30px] font-bold flex">Ethereum
                                <sup>
                                    <button title={t('weth')}>
                                        <img src={symbol} className="ml-4" alt="" />
                                    </button>
                                </sup>
                            </p>
                        </div>
                        <DurationSelector durations={durationOptions} setDuration={setEthDuration} />

                    </div>
                    <div className="w-full md:w-[30%] lg:pl-10 pt-16 pb-5">
                        <div className="flex justify-between">
                            <p className="text-[25px] md">{t('stake')}</p>
                            <PrimeInput
                                value={inputValueeth}
                                setValue={setInputValueeth}
                                validatePrime={validatePrime}

                            />
                        </div>
                        <div className="flex w-full justify-between">
                            <p className="text-[25px] md">{ethduration ? ethduration : "0 Days"}</p>
                            <div className="text-2xl mt-2.5">{`${Math.round(sliderValueeth)}%`}</div>
                        </div>
                        <WhaleSlider
                            sliderValue={sliderValueeth}
                            setSliderValue={setSliderValueeth}
                            getWhaleHeadSrc={getWhaleHeadSrceth}
                        />
                    </div>
                    <div className="w-full h-20 md:w-1/4 md:h-full opacity-50 bg-black rounded-2xl flex justify-center items-center cursor-pointer">
                        <p className="text-[35px] md:text-[30px] font-bold">{t('take')} <span className="ml-2">&#9660;</span></p>
                    </div>
                </div>
            </div>

            {/* Footer Section */}
            <div className="flex flex-col my-10 w-full h-auto bg-black">
                <img src={bg_whale} className="w-full h-auto" alt="" />
                <p className="lg:pl-20 pl-10 mt-[-90px] lg:mt-[-200px] text-[18px] md:text-[40px] font-bold lg:text-[51px]">{t('crypto')}</p>
            </div>
            <div className="flex w-full bg-black mt-10 lg:mt-40 justify-between">
                <a href="https://linktr.ee/WHALESTRATEGY" className="w-[45%] lg:w-[45%]">
                    <img src={linktree} alt="" className="w-full h-auto cursor-pointer" />
                </a>
                <a href="https://discord.gg/xpkF6U9KJY" className="w-[45%] lg:w-[45%]">
                    <img src={discord} alt="" className="w-full h-auto cursor-pointer" />
                </a>
            </div>
            <div className="flex justify-between w-full mt-32">
                <h1 className="flex md:text-[60px] text-[30px] font-bold">{t('staking')}</h1>
                <p className="md:text-[20px] text-[13px] items-end flex">{t('risk')}</p>
            </div>
            <div className="flex flex-wrap justify-center w-full gap-7">
                {/* Conditionally Render No Stakes or Staking Details */}
                {!hasStakes ? (
                    <div className="w-full lg:w-[47%] flex flex-col items-center justify-center bg-black rounded-lg p-8">
                        <h2 className="text-white text-3xl font-bold mb-4">YOUR PLAN</h2>
                        <p className="text-white mb-4">NO STAKES YET</p>
                        <p className="text-white mb-4">
                            You don't have any stakes yet. Start your journey as a whale and make your first stake.
                        </p>
                        <button
                            onClick={scrollToStakingSection}
                            className="bg-blue-500 text-white p-3 rounded-md mt-4"
                        >
                            GET STARTED
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-wrap w-full lg:w-[47%] relative mt-10">
                        <img src={mystake} className="absolute w-full h-full" alt="" />
                        <div className="p-2 m-2 md:m-10 w-full relative z-10 md:p-0 md:justify-between">
                            <div className="my-auto w-full md:w-[35%]">
                                <div className="flex items-center mb-4">
                                    <img src={usdt} alt="" className="w-14 h-14 mr-4" />
                                    <p className="text-[35px] md:text-[30px] font-bold flex">USDT</p>
                                </div>
                            </div>
                            <div className="flex flex-col mt-4 space-y-4">
                                <div className="flex justify-between">
                                    <p>{t('total')}</p>
                                    <p className="text-[25px] md:text-[30px]">
                                        {stakedAmount.USDT !== null ? stakedAmount.USDT.toFixed(2) : 'Loading...'}
                                    </p>
                                </div>
                                <div className="flex justify-between">
                                    <p>{t('available')}</p>
                                    <p className="text-[25px] md:text-[30px]">
                                        {usdtWalletBalance && !isNaN(parseFloat(usdtWalletBalance))
                                            ? parseFloat(usdtWalletBalance).toFixed(2)
                                            : 'Loading...'}
                                    </p>
                                </div>
                                <div className="flex justify-between">
                                    <p>Staked On:</p>
                                    <p className="text-[25px] md:text-[30px] loader">
                                        {stakedOn.USDT ? new Date(stakedOn.USDT * 1000).toLocaleString() : 'Loading...'}
                                    </p>
                                </div>
                                <div className="flex justify-between">
                                    <p>Unlock On:</p>
                                    <p className="text-[25px] md:text-[30px] loader">
                                        {stakeEnd.USDT ? new Date(stakeEnd.USDT * 1000).toLocaleString() : 'Loading...'}
                                    </p>
                                </div>
                                <div className="flex justify-between">
                                    <p>Current Rewards:</p>
                                    <p className="text-[25px] md:text-[30px] loader">
                                        {stakeRewards.USDT !== null && !isNaN(stakeRewards.USDT)
                                            ? `${stakeRewards.USDT.toFixed(2)} USDT`
                                            : 'Loading...'}
                                    </p>
                                </div>
                                <div className="flex justify-between mt-4">
                                    <button
                                        className="bg-blue-500 text-white p-2 rounded-md"
                                    >
                                        Unlock
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}




                {/* BTC Section */}
                <div className="flex flex-wrap w-full lg:w-[47%] relative mt-10">
                    <img src={mystake} className="absolute w-full h-full" alt="" />
                    <div className="p-2 m-2 md:m-10 w-full relative z-10 md:p-0 md:justify-between">
                        <div className="my-autow-full md:w-[35%] ">
                            <div className="flex items-center">
                                <img src={btc} alt="" className="w-14 h-14 mr-4" />
                                <p className="text-[35px] md:text-[30px] font-bold flex">Bitcoin</p>
                            </div>

                        </div>
                        <div className="flex mt-10 justify-between">
                            <div className="w-1/2">
                                <p>{t('total')}</p>
                                <p className="flex"><span className="text-[25px] md:text-[40px]">1045</span><span className="text-[13px] mt-3 ml-2 md:mt-6 md:ml-4" >BTC~BTC1045.00</span></p>
                            </div>
                            <div className="w-1/2">
                                <p>{t('available')}</p>
                                <p className="flex"><span className="text-[25px] md:text-[40px]">53</span><span className="text-[13px] mt-3 ml-2 md:mt-6 md:ml-4" >BTC~BTC1045.00</span></p>
                            </div>
                        </div>

                    </div>
                </div>
                {/* ETH Section */}
                <div className="flex flex-wrap w-full lg:w-[47%] relative mt-10">
                    <img src={mystake} className="absolute w-full h-full" alt="" />
                    <div className="p-2 m-2 md:m-10 w-full relative z-10 md:p-0 md:justify-between">
                        <div className="my-autow-full md:w-[35%] ">
                            <div className="flex items-center">
                                <img src={eth} alt="" className="w-14 h-14 mr-4" />
                                <p className="text-[35px] md:text-[30px] font-bold flex">Ethereum</p>
                            </div>

                        </div>
                        <div className="flex mt-10 justify-between">
                            <div className="w-1/2">
                                <p>{t('total')}</p>
                                <p className="flex"><span className="text-[25px] md:text-[40px]">1045</span><span className="text-[13px] mt-3 ml-2 md:mt-6 md:ml-4" >ETH~ETH1045.00</span></p>
                            </div>
                            <div className="w-1/2">
                                <p>{t('available')}</p>
                                <p className="flex"><span className="text-[25px] md:text-[40px]">53</span><span className="text-[13px] mt-3 ml-2 md:mt-6 md:ml-4" >ETH~ETH1045.00</span></p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>


            <div className="w-full h-40"></div>
        </div>
    );
}

export default Staking;
