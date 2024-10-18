import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Web3 from "web3";
import { useAccount } from "wagmi"; // Import to use wallet info
import usdtABI from "../usdtABI.json";



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

const BSC_WS_URL = "wss://data-seed-prebsc-1-s1.binance.org:8545/";


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

    

    const { isConnected, address } = useAccount(); // To get wallet address and connection status
    const [web3, setWeb3] = useState<Web3 | null>(null);
    const [contract, setContract] = useState<any>(null);
    const [stakedAmount, setStakedAmount] = useState<{ [key: string]: number | null }>({
        USDT: null,
        BTC: null,
        ETH: null,
    });


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
    
    

    // Initialize Web3 with WebSocket provider when connected
    useEffect(() => {
        if (isConnected) {
            // Initialize Web3 instance with WebSocket provider
            const _web3 = new Web3(new Web3.providers.WebsocketProvider(BSC_WS_URL));
            setWeb3(_web3);

            // Set up the contract instance
            const _contract = new _web3.eth.Contract(contractABI, contractAddress);
            setContract(_contract);

            // Log to indicate that WebSocket provider has been initialized
            console.log("WebSocket provider initialized");
        }
    }, [isConnected]);

    // Fetch staked information from contract using WebSocket
    useEffect(() => {
        const fetchStakeInfo = async () => {
            if (web3 && contract && address) {
                try {
                    console.log("Fetching staked info for all tokens...");
                    const tokens = [
                        { address: usdtAddress, name: "USDT" },
                        { address: wbtcAddress, name: "BTC" },
                        { address: wethAddress, name: "ETH" }
                    ];

                    // Fetch staked amounts for each token asynchronously
                    const promises = tokens.map(async token => {
                        const stakedInfo = await contract.methods.userStakeInfos(address, token.address).call();
                        return {
                            name: token.name,
                            amount: Number(web3.utils.fromWei(stakedInfo.stakedAmount, "ether"))
                        };
                    });

                    const results = await Promise.all(promises);
                    const newStakedAmount = results.reduce<{ [key: string]: number }>((acc, curr) => {
                        acc[curr.name] = curr.amount;
                        return acc;
                    }, {});

                    console.log("Staked info fetched:", newStakedAmount);
                    setStakedAmount(prev => ({ ...prev, ...newStakedAmount }));
                } catch (error) {
                    console.error("Error fetching staking information:", error);
                }
            } else {
                console.warn("Missing web3, contract, or address");
            }
        };

        if (isConnected) {
            fetchStakeInfo();
        }
    }, [web3, contract, address, isConnected]);
    
    
    const hasUserStaked = async (tokenAddress: string) => {
        try {
            // Use call() to interact with the smart contract without sending a transaction
            const userStakeInfo = await contract.methods.userStakeInfos(address, tokenAddress).call();
            
            // Check if stakedAmount is greater than 0
            if (parseFloat(userStakeInfo.stakedAmount) > 0) {
                return true; // User has already staked
            }
            return false; // User has not staked yet
        } catch (error) {
            console.error("Error checking user stake status:", error);
            return false; // Assume user has not staked if there's an error
        }
    };
    
    const handleStakeUSDT = async () => {
        try {
            // 1. Check if wallet is connected
            if (!web3 || !contract || !address) {
                alert("Please connect your wallet first!");
                console.log("Step 1: Wallet connection check failed.");
                return; // Stop here if the wallet isn't connected
            }
            console.log("Step 1: Wallet connection check passed.");
    
            // 2. Check if input amount is valid
            if (!inputValueusdt || parseFloat(inputValueusdt) <= 0) {
                alert("Please enter a valid amount greater than zero to stake.");
                return; // Stop if the user did not enter a valid amount
            }
            console.log("Step 2: Input amount validated:", inputValueusdt);
    
            // 3. Check if the user selected a staking duration
            if (!usdtduration) {
                alert("Please select a staking duration.");
                return; // Stop if the staking duration is not selected
            }
            console.log("Step 3: Duration selected:", usdtduration);
    
            // 4. Check if user has already staked by looking at past events
            let events;
            try {
                events = await contract.getPastEvents('Stake', {
                    filter: { user: address }, // Only filter by the user's address
                    fromBlock: 0, // Start checking from the beginning of the blockchain
                    toBlock: 'latest' // Check until the latest block
                });
    
                // If we find events, it means the user has already staked
                if (events.length > 0) {
                    alert("You have already staked your tokens.");
                    console.log("Step 4: User has already staked tokens.");
                    return; // Stop here if the user already staked
                }
                console.log("Step 4: No existing stakes found for user.");
            } catch (eventError) {
                console.error("Error fetching events:", eventError);
                alert("Failed to check if tokens are already staked. Please try again later.");
                return; // Stop if we can't check for past staking events
            }
    
            // 5. Check if user is on the correct network (BSC Testnet)
            const chainId = await web3.eth.getChainId().catch((error) => {
                console.error("Failed to retrieve network information:", error);
                alert("Failed to retrieve network information. Please check your wallet connection.");
                return null; // Return null to indicate that chainId retrieval failed
            });
    
            if (chainId === null) {
                return; // Stop if we couldn't get the chain ID
            }
    
            console.log("Step 5: Chain ID retrieved:", chainId);
            
            if (Number(chainId) !== 97) { // 97 is the chain ID for BSC Testnet
                alert("Please connect to the BSC Testnet network to proceed.");
                console.log("Step 5: Incorrect network detected. Chain ID:", chainId);
                return; // Stop if the user is not on BSC Testnet
            }
            console.log("Step 5: Correct network detected - BSC Testnet.");
    
            // 6. Convert the input value to the format the blockchain understands
            const amountToStake = web3.utils.toWei(inputValueusdt, "ether");
    
            // 7. Determine the duration in months
            const durationInMonths = usdtduration === '30 Days' ? 1 : usdtduration === '6 Months' ? 6 : 12;
    
            // Define token address for USDT
            const tokenAddress = usdtAddress; // Make sure usdtAddress is defined with the address of the USDT token contract
    
            console.log("Step 6: Ready to stake tokens. Token address:", tokenAddress);
            
            // 8. Finally, call the staking function
            await contract.methods.stake(tokenAddress, durationInMonths, amountToStake)
                .send({ from: address });
    
            alert("Staked successfully!"); // Let the user know that staking succeeded
            console.log("Step 8: Staked successfully.");
        } catch (error) {
            console.error("Staking error:", error);
            
            // Cast error to Error type to ensure TypeScript understands the structure of the error object
            const errorMessage = (error as Error).message;
    
            if (errorMessage.includes("User denied transaction")) {
                alert("Transaction was denied by the user.");
            } else {
                alert(`Staking failed: ${errorMessage}`);
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
            <div className="flex justify-between w-full">
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
                {/* My Staking Section for USDT */}
                <div className="flex flex-wrap w-full lg:w-[47%] relative mt-10">
                    <img src={mystake} className="absolute w-full h-full" alt="" />
                    <div className="p-2 m-2 md:m-10 w-full relative z-10 md:p-0 md:justify-between">
                        <div className="my-autow-full md:w-[35%] ">
                            <div className="flex items-center">
                                <img src={usdt} alt="" className="w-14 h-14 mr-4" />
                                <p className="text-[35px] md:text-[30px] font-bold flex">USDT</p>
                            </div>
                        </div>
                        <div className="flex mt-10 justify-between">
                            <div className="w-1/2">
                                <p>{t('total')}</p>
                                <p className="flex">
                                    <span className="text-[25px] md:text-[40px]">
                                        {stakedAmount.USDT !== null ? stakedAmount.USDT.toFixed(2) : 'Loading...'}
                                    </span>
                                    <span className="text-[13px] mt-3 ml-2 md:mt-6 md:ml-4">
                                        {stakedAmount.USDT !== null ? `USDT~$${stakedAmount.USDT.toFixed(2)}` : ''}
                                    </span>
                                </p>
                            </div>
                            <div className="w-1/2">
                                <p>Available in Wallet</p>
                                <p className="flex">
                                    <span className="text-[25px] md:text-[40px]">
                                        {usdtWalletBalance !== null ? parseFloat(usdtWalletBalance).toFixed(2) : 'Loading...'}
                                    </span>
                                    <span className="text-[13px] mt-3 ml-2 md:mt-6 md:ml-4">
                                        {usdtWalletBalance !== null ? `USDT~$${parseFloat(usdtWalletBalance).toFixed(5)}` : ''}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

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
