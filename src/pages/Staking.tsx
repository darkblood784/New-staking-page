import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Web3 from "web3";
import { useAccount } from "wagmi"; // Import to use wallet info
import usdtABI from "../usdtABI.json";
import Swal from 'sweetalert2';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import ReactDOM from 'react-dom/client'; // If using React 18
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPiggyBank, faWallet, faCalendarCheck, faLockOpen, faCoins, faAward, faPercentage } from '@fortawesome/free-solid-svg-icons';



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

import BigNumber from 'bignumber.js'; // For handling large numbers


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
const erc20ABI = JSON.parse(import.meta.env.VITE_erc20ABI); // Assuming the ABI is stored as a JSON string



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

    const [usdtPrice, setUsdtPrice] = useState<number | null>(null);
    const [btcPrice, setBtcPrice] = useState<number | null>(null);
    const [ethPrice, setEthPrice] = useState<number | null>(null);

    const [usdtWalletBalance, setUsdtWalletBalance] = useState<string | null>(null);
    const [btcWalletBalance, setBtcWalletBalance] = useState<string | null>(null);
    const [ethWalletBalance, setEthWalletBalance] = useState<string | null>(null);


    const [testMode, setTestMode] = useState<boolean>(false);

    const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const [hasStakes, setHasStakes] = useState(false); // State to track if the user has any active stakes
    

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
    const [earnedRewards, setEarnedRewards] = useState<{ [key: string]: number | null }>({
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

    // Function to calculate APR based on duration
    const calculateAPR = (stakedOn: number, stakeEnd: number): number => {
        const durationDays = Math.ceil((stakeEnd - stakedOn) / (60 * 60 * 24)); // Convert seconds to days
        if (durationDays === 30) {
            return 15; // 1 month duration
        } else if (durationDays === 180) {
            return 24; // 6 months duration
        } else if (durationDays === 365) {
            return 36; // 1 year duration
        } else {
            return 0; // Default case for invalid durations
        }
    };
    


    // Updated apr calculation
    const apr = stakeEnd.USDT && stakedOn.USDT 
        ? calculateAPR(stakedOn.USDT, stakeEnd.USDT)
        : 0;


    // Function to format BigInt values for ERC20 tokens with 18 decimals
    const formatBigInt = (value: any, decimals = 4) => {
        if (!value) return "0.0000";
  
        try {
          // Create a BigNumber from the value
          const bigValue = new BigNumber(value.toString());
  
          // Shift by -18 to convert from WEI to the token value (e.g., 1 USDT instead of 1 * 10^18 WEI)
          const formattedValue = bigValue.shiftedBy(-18);
  
          // Format with a fixed number of decimals (e.g., 2 decimals)
          return formattedValue.toFixed(decimals);
        } catch (error) {
        console.error("Error formatting BigInt value:", error);
        return value.toString();
        }
    };

    // Function to calculate daily profit
    const calculateDailyProfit = () => {
        if (!hasStakes) {
            return 0; // No stakes, so no profit
        }

        let totalDailyProfit = 0;

        // Iterate over each staked token and calculate the daily profit
        ['USDT', 'BTC', 'ETH'].forEach((token) => {
            if (stakedAmount[token] && stakedAmount[token] > 0) {
                // Calculate APR for the specific token
                const apr = token === "USDT" ? 15 : token === "BTC" ? 24 : 36;

                // Convert APR to daily rate (APR is annual, so divide by 365)
                const dailyRate = apr / 100 / 365;

                // Calculate profit earned for the previous day
                const dailyProfit = stakedAmount[token] * dailyRate;

                // Accumulate the total daily profit for all staked tokens
                totalDailyProfit += dailyProfit;
            }
        });

    // Return total profit rounded to 2 decimal places
    return totalDailyProfit.toFixed(2);
};


    useEffect(() => {
        if (isConnected && address) {
            // Check if the user has an active stake and if they are logging in after 12:00 AM
            const lastPopupDate = localStorage.getItem('lastPopupDate');
            const today = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format

            if (lastPopupDate !== today) {
                // Update local storage to today's date
                localStorage.setItem('lastPopupDate', today);

                if (hasStakes) {
                    // Calculate the previous day's profit
                    const profit = calculateDailyProfit();

                    Swal.fire({
                        title: 'Daily Profit Report',
                        text: `You made a profit of ${profit} USDT yesterday!`,
                        icon: 'info',
                        confirmButtonText: 'OK',
                    });
                } else {
                    // Show popup indicating no stakes yet
                    Swal.fire({
                        title: 'No Stakes Yet',
                        text: 'You currently have no active stakes. Start staking to earn rewards!',
                        icon: 'info',
                        confirmButtonText: 'OK',
                    });
                }
            }
        }
    }, [isConnected, address, hasStakes]);

    
    
    const [selectedToken, setSelectedToken] = useState<string>('USDT');

    const tokens = [
        { name: 'USDT', icon: usdt },
        { name: 'BTC', icon: btc },
        { name: 'ETH', icon: eth },
    ];

    // Handle selecting a token
    const handleSelectToken = (tokenName: string) => {
        setSelectedToken(tokenName);
    };
      


    useEffect(() => {
        // Fetch prices from CoinGecko API for USDT, BTC, and ETH
        const fetchPrices = async () => {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether,bitcoin,ethereum&vs_currencies=usd');
                const data = await response.json();
                if (data.tether) {
                    setUsdtPrice(data.tether.usd);
                }
                if (data.bitcoin) {
                    setBtcPrice(data.bitcoin.usd);
                }
                if (data.ethereum) {
                    setEthPrice(data.ethereum.usd);
                }
            } catch (error) {
                console.error("Error fetching token prices:", error);
            }
        };

        fetchPrices();
    }, []);

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
    

    useEffect(() => {
        if (isConnected) {
            const _web3 = new Web3(window.ethereum);
            setWeb3(_web3);
            const _contract = new _web3.eth.Contract(contractABI, contractAddress);
            setContract(_contract);

            console.log("Contract initialized:", _contract);  // Add this line to check if the contract is initialized properly


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
        } else {
            setWeb3(null);
            setContract(null);
            setHasStakes(false);
            setStakedAmount({ USDT: null, BTC: null, ETH: null });
            setStakeRewards({ USDT: null, BTC: null, ETH: null });
            setEarnedRewards({ USDT: null, BTC: null, ETH: null });
            setStakeEnd({ USDT: null, BTC: null, ETH: null });
            setStakedOn({ USDT: null, BTC: null, ETH: null });
            setUsdtWalletBalance(null); // Reset wallet balance when disconnected
            setBtcWalletBalance(null);
            setEthWalletBalance(null);
        }
    }, [isConnected]);
    
    // Define individual stake checks
    const hasUSDTStake = stakedAmount.USDT !== null && stakedAmount.USDT > 0;
    const hasBTCStake = stakedAmount.BTC !== null && stakedAmount.BTC > 0;
    const hasETHStake = stakedAmount.ETH !== null && stakedAmount.ETH > 0;

    // Update the 'hasStakes' state based on individual token stakes
    useEffect(() => {
        const hasStakeValue = hasUSDTStake || hasBTCStake || hasETHStake;
        setHasStakes(hasStakeValue);
    }, [hasUSDTStake, hasBTCStake, hasETHStake]);

    // Fetch wallet balance function to be used globally
    const fetchWalletBalance = async () => {
        if (web3 && address && isConnected) {
            try {
                // USDT Balance
                const usdtContract = new web3.eth.Contract(erc20ABI, usdtAddress);
                const usdtBalance: string = await usdtContract.methods.balanceOf(address).call();
                setUsdtWalletBalance(web3.utils.fromWei(usdtBalance, 'ether'));

                // WBTC Balance
                const btcContract = new web3.eth.Contract(erc20ABI, wbtcAddress);
                const btcBalance: string = await btcContract.methods.balanceOf(address).call();
                setBtcWalletBalance(web3.utils.fromWei(btcBalance, 'ether'));

                // WETH Balance
                const ethContract = new web3.eth.Contract(erc20ABI, wethAddress);
                const ethBalance: string = await ethContract.methods.balanceOf(address).call();
                setEthWalletBalance(web3.utils.fromWei(ethBalance, 'ether'));
            } catch (error) {
                console.error("Error fetching balances:", error);
                setUsdtWalletBalance("Error");
                setBtcWalletBalance("Error");
                setEthWalletBalance("Error");
            }
        } else {
            setUsdtWalletBalance("Connect Wallet");
            setBtcWalletBalance("Connect Wallet");
            setEthWalletBalance("Connect Wallet");
        }
    };

    // UseEffect to call fetchWalletBalance when needed
    useEffect(() => {
        if (isConnected) {
            fetchWalletBalance();
        }
    }, [web3, address, isConnected]);

    

    
    
    // Function to fetch staking information
    // Example of fetching staking information and handling BigInt correctly
    const fetchStakeInfo = async () => {
        if (web3 && contract && address && isConnected) {
            try {
                console.log("Attempting to fetch staking information...");

                const tokens = [
                    { address: usdtAddress, name: "USDT" },
                    { address: wbtcAddress, name: "BTC" },
                    { address: wethAddress, name: "ETH" }
                ];

                let hasActiveStakes = false;

                const promises = tokens.map(async (token) => {
                    try {
                        console.log(`Fetching data for token: ${token.name}`);
                        const stakedInfo = await contract.methods.userStakeInfos(address, token.address).call();
                        console.log(`Staked info for ${token.name}:`, stakedInfo);

                        // Use BigInt conversion for calculations
                        const stakedAmountBigInt = stakedInfo.stakedAmount ? BigInt(stakedInfo.stakedAmount) : BigInt(0);
                        const rewardsBigInt = stakedInfo.rewards ? BigInt(stakedInfo.rewards) : BigInt(0);

                        // Convert BigInt to a string, then to a number if needed for frontend calculations
                        const stakedAmount = Number(stakedAmountBigInt.toString());
                        const rewards = Number(rewardsBigInt.toString());

                        const currentTimestamp = Math.floor(Date.now() / 1000);
                        const daysElapsed = Math.floor((currentTimestamp - stakedInfo.stakedAt) / (60 * 60 * 24));
                        const apr = token.name === "USDT" ? 15 : token.name === "BTC" ? 24 : 36;
                        const earnedRewards = (stakedAmount * apr / 100) * (daysElapsed / 365);

                        const amount = stakedAmount;
                        console.log(`Amount staked for ${token.name}:`, amount);

                        if (amount > 0) {
                            hasActiveStakes = true;
                        }

                        return {
                            name: token.name,
                            amount,
                            rewards,
                            earnedRewards,
                            stakeEnd: stakedInfo.stakeEnd ? Number(stakedInfo.stakeEnd) : null,
                            stakedAt: stakedInfo.stakedAt ? Number(stakedInfo.stakedAt) : null,
                        };
                    } catch (innerError) {
                        console.error(`Error fetching staking information for ${token.name}:`, innerError);
                        return null; // Return null if an error occurs
                    }
                });

                const results = await Promise.all(promises);
                console.log("Final results from fetchStakeInfo:", results);

                // Filter out any null results from failed fetches
                const validResults = results.filter(result => result !== null);
                if (validResults.length === 0) {
                    throw new Error("Failed to fetch staking information for all tokens.");
                }

                console.log("Has active stakes after fetching:", hasActiveStakes);
                setHasStakes(hasActiveStakes);

                // Process results and update state
                const stakedAmounts: { [key: string]: number } = {};
                const stakeRewards: { [key: string]: number } = {};
                const earnedRewardsMap: { [key: string]: number } = {};
                const stakeEnds: { [key: string]: number | null } = {};
                const stakedOns: { [key: string]: number | null } = {};

                validResults.forEach((token) => {
                    stakedAmounts[token.name] = token.amount;
                    stakeRewards[token.name] = token.rewards;
                    earnedRewardsMap[token.name] = token.earnedRewards;
                    stakeEnds[token.name] = token.stakeEnd;
                    stakedOns[token.name] = token.stakedAt;
                });

                setStakedAmount(stakedAmounts);
                setStakeRewards(stakeRewards);
                setEarnedRewards(earnedRewardsMap);
                setStakeEnd(stakeEnds);
                setStakedOn(stakedOns);

                console.log("Successfully fetched staking information");
            } catch (error) {
                console.error("Error fetching staking information:", error);
                Swal.fire({
                    title: 'Data Fetch Error',
                    text: 'Unable to retrieve staking information. Please check your Chain or Network try again.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } else {
            console.warn("Missing web3, contract, or address");
        }
    };

    useEffect(() => {
        const fetchAllData = async () => {
            if (isConnected && web3 && address) {
                console.log("Polling for latest wallet balance and staking information...");
                await fetchWalletBalance();
                await fetchStakeInfo();
            }
        };
    
        fetchAllData(); // Fetch data initially when conditions are met.
    
        const interval = setInterval(() => {
            fetchAllData(); // Poll every 10 seconds
        }, 5000);
    
        return () => clearInterval(interval); // Clean up on unmount
    }, [isConnected, web3, address]);
    


    useEffect(() => {
        if (!isConnected && !web3 && !address) {
          const interval = setInterval(() => {
            console.log("Polling for updated wallet balance and staking information...");
            fetchWalletBalance();
            fetchStakeInfo();
          }, 5000); // Poll every 10 seconds
      
          return () => clearInterval(interval); // Clean up on unmount
        }
      }, [isConnected, web3, address]);
      
        

    // Function to scroll to the staking section
    const scrollToStakingSection = () => {
        const stakingSection = document.getElementById('staking-section'); // Assume you have a wrapper element with this ID
        if (stakingSection) {
            stakingSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Function to scroll to the staking section
    const scrollToStakingSection2 = () => {
        const stakingSection = document.getElementById('my-stakes'); // Assume you have a wrapper element with this ID
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
    

    
    

    const handleStakeUSDT = () => {
        if (!web3 || !contract || !address) {
            Swal.fire({
                title: 'Oops!',
                text: 'Please connect your wallet first!',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }
    
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
    
        // Confirm staking details
        confirmStaking('USDT', inputValueusdt, usdtduration, executeStakeUSDT);
    };
    
    // Create the actual execution function
    const executeStakeUSDT = async () => {
        if (!web3) {
            console.error("Web3 is not initialized");
            return;
        }
        try {
            // Convert input value to Wei
            const amountToStake = web3.utils.toWei(inputValueusdt, "ether");

            // Step 1: Check allowance
            const usdtContract = new web3.eth.Contract(erc20ABI, usdtAddress);
            const allowance = await usdtContract.methods.allowance(address, contractAddress).call();

            // If the allowance is less than the amount to stake, we need to approve
            if (Number(allowance) < Number(amountToStake)) {
                // Approve the staking contract to transfer the amountToStake on behalf of the user
                await usdtContract.methods
                    .approve(contractAddress, amountToStake) // Approve the exact amount needed
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

            // Call the stake function on the contract
            await contract.methods.stake(usdtAddress, durationInMonths, amountToStake)
                .send({ from: address, gas: gasLimit, gasPrice: gasPrice })
                .on('receipt', async () => {
                    Swal.fire({
                        title: 'Success!',
                        text: 'Staked successfully!',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });

                    // Clear input fields and update UI
                    setInputValueusdt('');
                    setSliderValueusdt(0);
                    setUsdtDuration('');

                    // Fetch updated staking information
                    await fetchStakeInfo();
                    await fetchWalletBalance();
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


    const handleStakeBTC = () => {
        if (!web3 || !contract || !address) {
            Swal.fire({
                title: 'Oops!',
                text: 'Please connect your wallet first!',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }
    
        if (!inputValuebtc || parseFloat(inputValuebtc) <= 0) {
            Swal.fire({
                title: 'Invalid Input',
                text: 'Please enter a valid amount greater than zero to stake.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
    
        if (!btcduration) {
            Swal.fire({
                title: 'Select Duration',
                text: 'Please select a staking duration.',
                icon: 'info',
                confirmButtonText: 'OK'
            });
            return;
        }
    
        confirmStaking('BTC', inputValuebtc, btcduration, executeStakeBTC);
    };

    // Create the actual execution function for BTC
    const executeStakeBTC = async () => {
        if (!web3) {
            console.error("Web3 is not initialized");
            return;
        }
        try {
            // Convert input value to Wei
            const amountToStake = web3.utils.toWei(inputValuebtc, "ether");

            // Step 1: Check allowance
            const btcContract = new web3.eth.Contract(erc20ABI, wbtcAddress); // Create a contract instance for WBTC
            const allowance = await btcContract.methods.allowance(address, contractAddress).call(); // Get the current allowance

            // If allowance is less than the amount to stake, we need to approve it
            if (Number(allowance) < Number(amountToStake)) {
                // Approve the staking contract to transfer the amountToStake on behalf of the user
                await btcContract.methods
                    .approve(contractAddress, amountToStake) // Approving the exact amount to stake
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
            const durationInMonths = btcduration === '30 Days' ? 1 : btcduration === '6 Months' ? 6 : 12; // Determine duration in months
            const gasLimit = 200000; // Set a reasonable gas limit
            const gasPrice = web3.utils.toWei('6', 'gwei'); // Set gas price

            // Call the stake function on the staking contract
            await contract.methods.stake(wbtcAddress, durationInMonths, amountToStake)
                .send({ from: address, gas: gasLimit, gasPrice: gasPrice })
                .on('receipt', async () => {
                    Swal.fire({
                        title: 'Success!',
                        text: 'Staked successfully!',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });

                    // Clear input fields and update UI
                    setInputValuebtc(''); // Reset input field
                    setSliderValuebtc(0); // Reset slider value
                    setBtcDuration('');   // Reset BTC duration selection

                    // Fetch updated staking information and wallet balance
                    await fetchStakeInfo();
                    await fetchWalletBalance();
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


    const handleStakeETH = () => {
        if (!web3 || !contract || !address) {
            Swal.fire({
                title: 'Oops!',
                text: 'Please connect your wallet first!',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }
    
        if (!inputValueeth || parseFloat(inputValueeth) <= 0) {
            Swal.fire({
                title: 'Invalid Input',
                text: 'Please enter a valid amount greater than zero to stake.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
    
        if (!ethduration) {
            Swal.fire({
                title: 'Select Duration',
                text: 'Please select a staking duration.',
                icon: 'info',
                confirmButtonText: 'OK'
            });
            return;
        }
    
        confirmStaking('ETH', inputValueeth, ethduration, executeStakeETH);
    };

    // Create the actual execution function for ETH
    const executeStakeETH = async () => {
        if (!web3) {
            console.error("Web3 is not initialized");
            return;
        }
        try {
            // Convert input value to Wei
            const amountToStake = web3.utils.toWei(inputValueeth, "ether");

            // Step 1: Check allowance
            const ethContract = new web3.eth.Contract(erc20ABI, wethAddress); // Create a contract instance for WETH
            const allowance = await ethContract.methods.allowance(address, contractAddress).call(); // Get current allowance

            // If the allowance is less than the amount to stake, we need to approve it
            if (Number(allowance) < Number(amountToStake)) {
                // Approve the staking contract to transfer the amountToStake on behalf of the user
                await ethContract.methods
                    .approve(contractAddress, amountToStake) // Approving the exact amount to stake
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
            const durationInMonths = ethduration === '30 Days' ? 1 : ethduration === '6 Months' ? 6 : 12; // Determine staking duration
            const gasLimit = 200000; // Set a reasonable gas limit
            const gasPrice = web3.utils.toWei('6', 'gwei'); // Set gas price

            // Call the stake function on the staking contract
            await contract.methods.stake(wethAddress, durationInMonths, amountToStake)
                .send({ from: address, gas: gasLimit, gasPrice: gasPrice })
                .on('receipt', async () => {
                    Swal.fire({
                        title: 'Success!',
                        text: 'Staked successfully!',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });

                    // Clear input fields and update UI
                    setInputValueeth(''); // Reset input field
                    setSliderValueeth(0); // Reset slider value
                    setEthDuration('');   // Reset ETH duration selection

                    // Fetch updated staking information and wallet balance
                    await fetchStakeInfo();
                    await fetchWalletBalance();
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



    
    const confirmStaking = (
        tokenName: string,
        amount: string | number,
        duration: string,
        handleStake: () => Promise<void>
    ) => {
        Swal.fire({
            title: `Confirm Staking ${tokenName}`,
            html: `
                <p>You are about to stake:</p>
                <ul>
                    <li><b>Token:</b> ${tokenName}</li>
                    <li><b>Amount:</b> ${amount}</li>
                    <li><b>Duration:</b> ${duration}</li>
                </ul>
            `,
            showCancelButton: true,
            confirmButtonText: 'Confirm',
        }).then((result) => {
            if (result.isConfirmed) {
                handleStake();
            }
        });
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
            // Fetch the stake information to check if it's an early unstake
            const stakeInfo = await contract.methods.userStakeInfos(address, tokenAddress).call();
            const currentTime = Math.floor(Date.now() / 1000); // Get the current time in seconds
    
            // Check if it's an early unstake
            if (currentTime < stakeInfo.stakeEnd) {
                // Show a confirmation dialog with the penalty warning
                const result = await Swal.fire({
                    title: 'Early Unstake Warning',
                    html: 'You are attempting to unstake early.<br>A 6% penalty will be applied.<br>Do you wish to continue?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, Unstake',
                    cancelButtonText: 'No, Cancel'
                });
                
    
                // If the user cancels, exit the function
                if (!result.isConfirmed) {
                    return;
                }
            }
    
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
            {/* Conditionally Render No Stakes Yet or Show My Stakes Button */}
            {!hasStakes ? (
                <div className="w-full lg:w-[47%] flex flex-col items-center justify-center bg-black rounded-lg p-8">
                    <h2 className="text-white text-3xl font-bold mb-4">{t('nostakeyet')}</h2>
                    <p className="text-white mb-4">
                        {t('nostakeline')}
                    </p>
                    <button
                        onClick={scrollToStakingSection}
                        className="bg-blue-500 hover:bg-blue-700 text-white p-3 rounded-md mt-4 transform hover:scale-105 transition-transform duration-300 focus:outline-none"
                    >
                        {t('getstarted')}
                    </button>
                </div>
            ) : (
                // Render My Stakes Button if Wallet has Stakes
                <div className="flex justify-end w-full lg:w-[100%] mt-4 pr-6">
                    <button
                        onClick={scrollToStakingSection2}
                        className="ml-auto bg-blue-500 hover:bg-blue-700 text-white p-3 rounded-md transform hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl active:scale-95 focus:outline-none"
                    >
                        MY STAKES
                    </button>
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
                    {/* Left Side: Token Information and Duration */}
                    <div className="my-auto pt-5 md:pt-0 ml-2 w-full md:w-[35%] lg:ml-10">
                        <div className="flex items-center">
                            <img src={usdt} alt="USDT Icon" className="w-14 h-14 mr-4" />
                            <p className="text-[35px] md:text-[30px] font-bold flex">USDT</p>
                        </div>
                        <DurationSelector durations={durationOptions} setDuration={setUsdtDuration} />
                    </div>
                    
                    {/* Middle Section: Available Balance, Stake Input, and Slider */}
                    <div className="w-full md:w-[30%] lg:pl-10 pt-5 pb-5">
                        {/* Available in Wallet */}
                        <div className="flex justify-between items-center mb-5">
                            <p><FontAwesomeIcon icon={faWallet} className="mr-2" />{t('available')}</p>
                            <div className="flex flex-col text-[20px] md:text-[25px]">
                                <p>
                                    {usdtWalletBalance && usdtWalletBalance !== "Error" && usdtWalletBalance !== "Connect Wallet" && !isNaN(parseFloat(usdtWalletBalance))
                                        ? parseFloat(usdtWalletBalance).toFixed(2)
                                        : usdtWalletBalance}
                                </p>
                                {usdtPrice !== null && usdtWalletBalance && usdtWalletBalance !== "Error" && usdtWalletBalance !== "Connect Wallet" && !isNaN(parseFloat(usdtWalletBalance)) && (
                                    <p className="text-sm text-right">~${(parseFloat(usdtWalletBalance) * usdtPrice).toFixed(2)} USD</p>
                                )}
                            </div>
                        </div>

                        {/* Stake Input */}
                        <div className="flex justify-between items-center">
                            <p className="text-[25px] md:text-[20px]">{t('stake')}</p>
                            <PrimeInput
                                value={inputValueusdt}
                                setValue={(val: any) => {
                                    setInputValueusdt(val);

                                    // Update the slider value based on the input value
                                    if (usdtWalletBalance && usdtWalletBalance !== "Error" && usdtWalletBalance !== "Connect Wallet" && !isNaN(parseFloat(usdtWalletBalance))) {
                                        const balance = parseFloat(usdtWalletBalance);
                                        const newSliderValue = Math.min(100, (val / balance) * 100);
                                        setSliderValueusdt(newSliderValue);
                                    }
                                }}
                                validatePrime={validatePrime}
                            />
                        </div>

                        {/* Duration and Slider */}
                        <div className="flex w-full justify-between items-center">
                            <p className="text-[25px] md:text-[20px]">{usdtduration ? usdtduration : "0 Days"}</p>
                            <div className="text-2xl mt-2.5">{`${Math.round(sliderValueusdt)}%`}</div>
                        </div>

                        {/* Whale Slider */}
                        <WhaleSlider
                            sliderValue={sliderValueusdt}
                            setSliderValue={(val) => {
                                setSliderValueusdt(val);
                                if (usdtWalletBalance && usdtWalletBalance !== "Error" && usdtWalletBalance !== "Connect Wallet" && !isNaN(parseFloat(usdtWalletBalance))) {
                                    // Convert balance to a float and get its precision
                                    const balanceFloat = parseFloat(usdtWalletBalance);
                                    const precision = balanceFloat.toString().split(".")[1]?.length || 0; // Get decimal precision

                                    // Calculate based on selected percentage (e.g., 25%, 50%, 75%, or 100%)
                                    const calculatedValue = (balanceFloat * val) / 100;
                                    
                                    setInputValueusdt(
                                        val === 100
                                            ? balanceFloat.toFixed(precision) // Use entire balance for "All In"
                                            : calculatedValue.toFixed(precision) // Adjusted calculated value for other percentages
                                    );
                                }
                            }}
                            getWhaleHeadSrc={getWhaleHeadSrcusdt}
                            availableBalance={usdtWalletBalance !== "Error" && usdtWalletBalance !== "Connect Wallet" && !isNaN(formatBigInt(usdtWalletBalance))
                                ? formatBigInt(usdtWalletBalance)
                                : 0}
                            setInputValue={setInputValueusdt}
                        />
                    </div>

                    {/* Stake Button */}
                    <div className="w-full h-20 md:w-1/4 md:h-full opacity-70 bg-black rounded-2xl flex justify-center items-center cursor-pointer">
                        <button
                            onClick={handleStakeUSDT} 
                            className="text-[35px] md:text-[30px] font-bold transform hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl active:scale-95 focus:outline-none text-white"
                        >
                            {t('take')} <span className="ml-2">&#9660;</span>
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
                    {/* Middle Section: Available Balance, Stake Input, and Slider */}
                    <div className="w-full md:w-[30%] lg:pl-10 pt-16 pb-5">
                        {/* Available in Wallet */}
                        <div className="flex justify-between items-center mb-5">
                            <p><FontAwesomeIcon icon={faWallet} className="mr-2" />{t('available')}</p>
                            <div className="flex flex-col text-[20px] md:text-[25px]">
                                <p>
                                    {btcWalletBalance && btcWalletBalance !== "Error" && btcWalletBalance !== "Connect Wallet" && !isNaN(parseFloat(btcWalletBalance))
                                        ? parseFloat(btcWalletBalance).toFixed(2)
                                        : btcWalletBalance}
                                </p>
                                {btcPrice !== null && btcWalletBalance && btcWalletBalance !== "Error" && btcWalletBalance !== "Connect Wallet" && !isNaN(parseFloat(btcWalletBalance)) && (
                                    <p className="text-sm text-right">~${(parseFloat(btcWalletBalance) * btcPrice).toFixed(2)} USD</p>
                                )}
                            </div>
                        </div>
                        {/* Stake Input */}
                        <div className="flex justify-between items-center">
                            <p className="text-[25px] md:text-[20px]">{t('stake')}</p>
                            <PrimeInput
                                value={inputValuebtc}
                                setValue={(val: any) => {
                                    setInputValuebtc(val);

                                    // Update the slider value based on the input value
                                    if (btcWalletBalance && btcWalletBalance !== "Error" && btcWalletBalance !== "Connect Wallet" && !isNaN(parseFloat(btcWalletBalance))) {
                                        const balance = parseFloat(btcWalletBalance);
                                        const newSliderValue = Math.min(100, (val / balance) * 100);
                                        setSliderValuebtc(newSliderValue);
                                    }
                                }}
                                validatePrime={validatePrime}
                            />
                        </div>
                        <div className="flex w-full justify-between">
                            <p className="text-[25px]">{btcduration ? btcduration : "0 Days"}</p>
                            <div className="text-2xl mt-2.5">{`${Math.round(sliderValuebtc)}%`}</div>
                        </div>
                        {/* Whale Slider */}
                        <WhaleSlider
                            sliderValue={sliderValuebtc}
                            setSliderValue={(val) => {
                                setSliderValuebtc(val);
                                if (btcWalletBalance && btcWalletBalance !== "Error" && btcWalletBalance !== "Connect Wallet" && !isNaN(parseFloat(btcWalletBalance))) {
                                        // Convert balance to a float and get its precision
                                        const balanceFloat = parseFloat(btcWalletBalance);
                                        const precision = balanceFloat.toString().split(".")[1]?.length || 0; // Get decimal precision

                                        // Calculate based on selected percentage (e.g., 25%, 50%, 75%, or 100%)
                                        const calculatedValue = (balanceFloat * val) / 100;
                                        
                                        console.log("BTC Wallet Balance:", balanceFloat);
                                        console.log("Precision:", precision);
                                        console.log("Calculated Value:", calculatedValue);

                                        setInputValuebtc(
                                            val === 100
                                                ? balanceFloat.toFixed(precision) // Use entire balance for "All In"
                                                : calculatedValue.toFixed(precision) // Adjusted calculated value for other percentages
                                        );
                                    }
                            }}
                            getWhaleHeadSrc={getWhaleHeadSrcbtc}
                            availableBalance={btcWalletBalance !== "Error" && btcWalletBalance !== "Connect Wallet" && !isNaN(formatBigInt(btcWalletBalance))
                                ? formatBigInt(btcWalletBalance)
                                : 0}
                            setInputValue={setInputValuebtc}
                        />
                    </div>
                    {/* Stake Button */}
                    <div className="w-full h-20 md:w-1/4 md:h-full opacity-70 bg-black rounded-2xl flex justify-center items-center cursor-pointer">
                        <button
                            onClick={handleStakeBTC} 
                            className="text-[35px] md:text-[30px] font-bold transform hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl active:scale-95 focus:outline-none text-white"
                        >
                            {t('take')} <span className="ml-2">&#9660;</span>
                        </button>
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
                        {/* Available in Wallet */}
                        <div className="flex justify-between items-center mb-5">
                            <p><FontAwesomeIcon icon={faWallet} className="mr-2" />{t('available')}</p>
                            <div className="flex flex-col text-[20px] md:text-[25px]">
                                <p>
                                    {ethWalletBalance && ethWalletBalance !== "Error" && ethWalletBalance !== "Connect Wallet" && !isNaN(parseFloat(ethWalletBalance))
                                        ? parseFloat(ethWalletBalance).toFixed(2)
                                        : ethWalletBalance}
                                </p>
                                {ethPrice !== null && ethWalletBalance && ethWalletBalance !== "Error" && ethWalletBalance !== "Connect Wallet" && !isNaN(parseFloat(ethWalletBalance)) && (
                                    <p className="text-sm text-right">~${(parseFloat(ethWalletBalance) * ethPrice).toFixed(2)} USD</p>
                                )}
                            </div>
                        </div>
                        {/* Stake Input */}
                        <div className="flex justify-between items-center">
                            <p className="text-[25px] md:text-[20px]">{t('stake')}</p>
                            <PrimeInput
                                value={inputValueeth}
                                setValue={(val: any) => {
                                    setInputValueeth(val);

                                    // Update the slider value based on the input value
                                    if (ethWalletBalance && ethWalletBalance !== "Error" && ethWalletBalance !== "Connect Wallet" && !isNaN(parseFloat(ethWalletBalance))) {
                                        const balance = parseFloat(ethWalletBalance);
                                        const newSliderValue = Math.min(100, (val / balance) * 100);
                                        setSliderValueeth(newSliderValue);
                                    }
                                }}
                                validatePrime={validatePrime}
                            />
                        </div>
                        <div className="flex w-full justify-between">
                            <p className="text-[25px]">{ethduration ? ethduration : "0 Days"}</p>
                            <div className="text-2xl mt-2.5">{`${Math.round(sliderValueeth)}%`}</div>
                        </div>
                        {/* Whale Slider */}
                        <WhaleSlider
                            sliderValue={sliderValueeth}
                            setSliderValue={(val) => {
                                setSliderValueeth(val);
                                if (
                                    ethWalletBalance &&
                                    ethWalletBalance !== "Error" &&
                                    ethWalletBalance !== "Connect Wallet" &&
                                    !isNaN(parseFloat(ethWalletBalance))
                                ) {
                                    // Convert balance to a float and get its precision
                                    const balanceFloat = parseFloat(ethWalletBalance);
                                    const precision = balanceFloat.toString().split(".")[1]?.length || 0; // Get decimal precision
                                
                                    // Calculate based on selected percentage
                                    const calculatedValue = (balanceFloat * val) / 100;
                                
                                    // Set the input value or adjust slider based on the actual precision
                                    setSliderValueeth(
                                        val === 100
                                            ? 100 // Full slider value for "All In"
                                            : Math.min(100, (calculatedValue / balanceFloat) * 100) // Calculated slider value
                                    );
                                
                                    setInputValueeth(
                                        val === 100
                                            ? balanceFloat.toFixed(precision) // Use entire balance for "All In"
                                            : calculatedValue.toFixed(precision) // Adjusted calculated value for other percentages
                                    );
                                }
                                
                            }}
                            getWhaleHeadSrc={getWhaleHeadSrceth}
                            availableBalance={ethWalletBalance !== "Error" && ethWalletBalance !== "Connect Wallet" && !isNaN(formatBigInt(ethWalletBalance))
                                ? formatBigInt(ethWalletBalance)
                                : 0}
                            setInputValue={setInputValueeth}
                        />
                    </div>
                    {/* Stake Button */}
                    <div className="w-full h-20 md:w-1/4 md:h-full opacity-70 bg-black rounded-2xl flex justify-center items-center cursor-pointer">
                        <button
                            onClick={handleStakeETH} 
                            className="text-[35px] md:text-[30px] font-bold transform hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl active:scale-95 focus:outline-none text-white"
                        >
                            {t('take')} <span className="ml-2">&#9660;</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Section */}
            
            <div className="flex justify-between w-full mt-32" id="my-stakes">
                <h1 className="flex md:text-[60px] text-[30px] font-bold">{t('staking')}</h1>
                <p className="md:text-[20px] text-[13px] items-end flex">{t('risk')}</p>
            </div>
            <div className="flex flex-wrap w-full lg:w-[47%] relative mt-10">
                {/* Background Image */}
                <img src={mystake} className="absolute w-full h-full" alt="" />

                {/* Main Content with Token Information and Stake Details */}
                <div className="p-2 m-2 md:m-10 w-full relative z-10 md:p-0 md:justify-between">
                    {/* Token Name and Icon */}
                    <div className="my-auto w-full md:w-[35%]">
                        <div className="flex items-center mb-4">
                            <img src={usdt} alt="USDT Icon" className="w-14 h-14 mr-4" />
                            <p className="text-[35px] md:text-[30px] font-bold flex">USDT</p>
                        </div>
                    </div>

                    {/* Conditional Rendering for Stake Details or "No Stakes Yet" */}
                    {formatBigInt(stakedAmount.USDT) > 0 ? (
                        // Stake Details View
                        <div className="flex flex-col mt-4 space-y-2 text-right">
                            {/* Total Staked */}
                            <div className="flex justify-between items-center">
                                <p><FontAwesomeIcon icon={faPiggyBank} className="mr-2" />{t('total')}</p>
                                <div className="flex flex-col text-[25px] md:text-[30px]">
                                    <p>{stakedAmount.USDT !== null ? `${formatBigInt(stakedAmount.USDT)} USDT` : 'Loading...'}</p>
                                    {usdtPrice !== null && stakedAmount.USDT !== null && (
                                        <p className="text-sm">~${(parseFloat(formatBigInt(stakedAmount.USDT)) * usdtPrice).toFixed(2)} USD</p>
                                    )}
                                </div>
                            </div>

                            {/* Available in Wallet */}
                            <div className="flex justify-between items-center">
                                <p><FontAwesomeIcon icon={faWallet} className="mr-2" />{t('available')}</p>
                                <div className="flex flex-col text-[25px] md:text-[30px] text-right">
                                    <p>
                                        {usdtWalletBalance && !isNaN(parseFloat(usdtWalletBalance))
                                            ? `${parseFloat(usdtWalletBalance).toFixed(2)} USDT`
                                            : 'Loading...'}
                                    </p>
                                    {usdtPrice !== null && usdtWalletBalance && !isNaN(parseFloat(usdtWalletBalance)) && (
                                        <p className="text-sm text-right">~${(parseFloat(usdtWalletBalance) * usdtPrice).toFixed(2)} USD</p>
                                    )}
                                </div>
                            </div>

                            {/* Other Stake Information like Stake On, Unlock In, APR, Earned Rewards, etc. */}
                            <div className="flex justify-between items-center">
                                <p><FontAwesomeIcon icon={faCalendarCheck} className="mr-2" />{t('Stakeon')}</p>
                                <div className="flex flex-col text-[25px] md:text-[30px] loader">
                                    {stakedOn.USDT ? (
                                        <>
                                            <p>{new Date(stakedOn.USDT * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            <p className="text-sm text-right">{Math.ceil((Date.now() - stakedOn.USDT * 1000) / (1000 * 60 * 60 * 24))} days ago</p>
                                        </>
                                    ) : (
                                        'Loading...'
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <p><FontAwesomeIcon icon={faLockOpen} className="mr-2" />{t('unlockin')}</p>
                                <div className="flex flex-col text-[25px] md:text-[30px] loader">
                                    {stakeEnd.USDT && stakedOn.USDT ? (
                                        <>
                                            <p>{new Date(stakeEnd.USDT * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            <p className="text-sm text-right">{Math.ceil((stakeEnd.USDT * 1000 - Date.now()) / (1000 * 60 * 60 * 24))} days to go</p>
                                            <div className="w-full h-4 bg-gray-300 rounded-full overflow-hidden mt-2">
                                                <div
                                                    className="h-full bg-green-500 transition-all duration-500 ease-in-out"
                                                    style={{
                                                        width: `${
                                                            ((Date.now() / 1000 - stakedOn.USDT) / (stakeEnd.USDT - stakedOn.USDT)) * 100
                                                        }%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </>
                                    ) : (
                                        'Loading...'
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <p><FontAwesomeIcon icon={faPercentage} className="mr-2" />APR:</p>
                                <p className="text-[25px] md:text-[30px] loader text-green-500" id="apr-tooltip">
                                    ~{apr}% <i className="fas fa-info-circle ml-2"></i>
                                </p>
                                <ReactTooltip anchorId="apr-tooltip" place="top" content="This is the annual percentage rate (APR) which determines the yield for your staked tokens." />
                            </div>
                            <div className="flex justify-between items-center">
                                <p><FontAwesomeIcon icon={faAward} className="mr-2" />{t('earnsofar')}</p>
                                <div className="flex flex-col text-[25px] md:text-[30px] loader">
                                    {earnedRewards.USDT !== null ? (
                                        <>
                                            <p>{`${formatBigInt(earnedRewards.USDT)} USDT`}</p>
                                            <p className="text-sm text-right text-green-500">
                                                ~{Math.min((earnedRewards.USDT / stakedAmount.USDT) * 100, apr).toFixed(2)}% Earned
                                            </p>
                                        </>
                                    ) : (
                                        'Loading...'
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <p><FontAwesomeIcon icon={faCoins} className="mr-2" />{t('totalreward')}</p>
                                <div className="flex flex-col text-[25px] md:text-[30px] loader text-green-500">
                                    {usdtPrice !== null && stakeRewards.USDT !== null && (
                                        <p>~${(parseFloat(formatBigInt(stakeRewards.USDT)) * usdtPrice).toFixed(2)} USD</p>
                                    )}
                                    <p className="text-sm text-right">
                                        {stakeRewards.USDT !== null && !isNaN(stakeRewards.USDT)
                                            ? `${formatBigInt(stakeRewards.USDT)} USDT`
                                            : 'Loading...'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-between mt-4">
                                <button
                                    className="bg-blue-500 hover:bg-blue-700 text-white p-3 rounded-md transform hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl active:scale-95 focus:outline-none"
                                    onClick={() => handleUnstake(usdtAddress)}
                                >
                                    Unstake
                                </button>
                            </div>
                        </div>
                    ) : (
                        // "No Stakes Yet" View
                        <div className="flex flex-col items-center justify-center p-8">
                            <h2 className="text-white text-3xl font-bold mb-4">{t('nostakeyet')}</h2>
                            <p className="text-white mb-4">
                                {t('nostakeline')}
                            </p>
                            <button
                                onClick={scrollToStakingSection}
                                className="bg-blue-500 hover:bg-blue-700 text-white p-3 rounded-md mt-4 transform hover:scale-105 transition-transform duration-300 focus:outline-none"
                            >
                                {t('getstarted')}
                            </button>
                        </div>
                    )}
                </div>
            </div>


                {/* BTC Section */}
                <div className="flex flex-wrap w-full lg:w-[47%] relative mt-10">
                    <img src={mystake} className="absolute w-full h-full" alt="" />
                    <div className="p-2 m-2 md:m-10 w-full relative z-10 md:p-0 md:justify-between">
                        <div className="my-auto w-full md:w-[35%]">
                            <div className="flex items-center mb-4">
                                <img src={btc} alt="BTC Icon" className="w-14 h-14 mr-4" />
                                <p className="text-[35px] md:text-[30px] font-bold flex">Bitcoin</p>
                            </div>
                        </div>

                        {/* Conditional Rendering for Stake Details or "No Stakes Yet" */}
                        {formatBigInt(stakedAmount.BTC) > 0 ? (
                            // Stake Details View
                            <div className="flex flex-col mt-4 space-y-2 text-right">
                                {/* Total Staked */}
                                <div className="flex justify-between items-center">
                                    <p><FontAwesomeIcon icon={faPiggyBank} className="mr-2" />{t('total')}</p>
                                    <div className="flex flex-col text-[25px] md:text-[30px]">
                                        <p>{stakedAmount.BTC !== null ? formatBigInt(stakedAmount.BTC) : 'Loading...'}</p>
                                        {btcPrice !== null && stakedAmount.BTC !== null && (
                                            <p className="text-sm">~${formatBigInt((stakedAmount.BTC * btcPrice))} USD</p>
                                        )}
                                    </div>
                                </div>
                                {/* Available in Wallet */}
                                <div className="flex justify-between items-center">
                                    <p><FontAwesomeIcon icon={faWallet} className="mr-2" />{t('available')}</p>
                                    <div className="flex flex-col text-[25px] md:text-[30px] text-right">
                                        <p>
                                            {btcWalletBalance && !isNaN(parseFloat(btcWalletBalance))
                                                ? `${parseFloat(btcWalletBalance).toFixed(2)} BTC`
                                                : 'Loading...'}
                                        </p>
                                        {btcPrice !== null && btcWalletBalance && !isNaN(parseFloat(btcWalletBalance)) && (
                                            <p className="text-sm">~${(parseFloat(btcWalletBalance) * btcPrice).toFixed(2)} USD</p>
                                        )}
                                    </div>
                                </div>
                                {/* Other Stake Information like Stake On, Unlock In, APR, Earned Rewards, etc. */}
                                <div className="flex justify-between items-center">
                                    <p><FontAwesomeIcon icon={faCalendarCheck} className="mr-2" />{t('Stakeon')}</p>
                                    <div className="flex flex-col text-[25px] md:text-[30px] loader">
                                        {stakedOn.BTC ? (
                                            <>
                                                <p>{new Date(stakedOn.BTC * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                <p className="text-sm text-right">{Math.ceil((Date.now() - stakedOn.BTC * 1000) / (1000 * 60 * 60 * 24))} days ago</p>
                                            </>
                                        ) : (
                                            'Loading...'
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p><FontAwesomeIcon icon={faLockOpen} className="mr-2" />{t('unlockin')}</p>
                                    <div className="flex flex-col text-[25px] md:text-[30px] loader">
                                        {stakeEnd.BTC && stakedOn.BTC ? (
                                            <>
                                                <p>{new Date(stakeEnd.BTC * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                <p className="text-sm text-right">{Math.ceil((stakeEnd.BTC * 1000 - Date.now()) / (1000 * 60 * 60 * 24))} days to go</p>
                                                <div className="w-full h-4 bg-gray-300 rounded-full overflow-hidden mt-2">
                                                    <div className="h-full bg-green-500 transition-all duration-500 ease-in-out"
                                                        style={{ width: `${((Date.now() / 1000 - stakedOn.BTC) / (stakeEnd.BTC - stakedOn.BTC)) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </>
                                        ) : (
                                            'Loading...'
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p><FontAwesomeIcon icon={faPercentage} className="mr-2" />APR:</p>
                                    <p className="text-[25px] md:text-[30px] loader text-green-500" id="apr-tooltip">
                                        ~{apr}% <i className="fas fa-info-circle ml-2"></i>
                                    </p>
                                    <ReactTooltip anchorId="apr-tooltip" place="top" content="This is the annual percentage rate (APR) which determines the yield for your staked tokens." />
                                </div>
                                <div className="flex justify-between items-center">
                                    <p><FontAwesomeIcon icon={faAward} className="mr-2" />{t('earnsofar')}</p>
                                    <div className="flex flex-col text-[25px] md:text-[30px] loader">
                                        {earnedRewards.BTC !== null && !isNaN(earnedRewards.BTC) && stakedAmount.BTC !== null ? (
                                            <>
                                                <p>{`${formatBigInt(earnedRewards.BTC)} BTC`}</p>
                                                <p className="text-sm text-right text-green-500">
                                                    ~{Math.min((earnedRewards.BTC / stakedAmount.BTC) * 100, apr).toFixed(2)}% Earned
                                                </p>
                                            </>
                                        ) : (
                                            'Loading...'
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center ">
                                    <p><FontAwesomeIcon icon={faCoins} className="mr-2" />{t('totalreward')}</p>
                                    <div className="flex flex-col text-[25px] md:text-[30px] loader text-green-500">
                                        
                                        {btcPrice !== null && stakeRewards.BTC !== null && (
                                            <p>~${(parseFloat(formatBigInt(stakeRewards.BTC)) * btcPrice).toFixed(2)} USD</p>
                                        )}
                                        <p className="text-sm text-right">
                                            {stakeRewards.BTC !== null && !isNaN(stakeRewards.BTC)
                                                ? `${formatBigInt(stakeRewards.BTC)} BTC`
                                                : 'Loading...'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-between mt-4">
                                    <button
                                        className="bg-blue-500 hover:bg-blue-700 text-white p-3 rounded-md transform hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl active:scale-95 focus:outline-none"
                                        onClick={() => handleUnstake(wbtcAddress)}
                                    >
                                        Unstake
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // "No Stakes Yet" View
                            <div className="flex flex-col items-center justify-center p-8">
                                <h2 className="text-white text-3xl font-bold mb-4">{t('nostakeyet')}</h2>
                                <p className="text-white mb-4">
                                    {t('nostakeline')}
                                </p>
                                <button
                                    onClick={scrollToStakingSection}
                                    className="bg-blue-500 hover:bg-blue-700 text-white p-3 rounded-md mt-4 transform hover:scale-105 transition-transform duration-300 focus:outline-none"
                                >
                                    {t('getstarted')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ETH Section */}
                <div className="flex flex-wrap w-full lg:w-[47%] relative mt-10">
                    <img src={mystake} className="absolute w-full h-full" alt="" />
                    <div className="p-2 m-2 md:m-10 w-full relative z-10 md:p-0 md:justify-between">
                        <div className="my-auto w-full md:w-[35%]">
                            <div className="flex items-center mb-4">
                                <img src={eth} alt="ETH Icon" className="w-14 h-14 mr-4" />
                                <p className="text-[35px] md:text-[30px] font-bold flex">Ethereum</p>
                            </div>
                        </div>

                        {/* Conditional Rendering for Stake Details or "No Stakes Yet" */}
                        {formatBigInt(stakedAmount.ETH) > 0 ? (
                            // Stake Details View
                            <div className="flex flex-col mt-4 space-y-2 text-right">
                                {/* Total Staked */}
                                <div className="flex justify-between items-center">
                                    <p><FontAwesomeIcon icon={faPiggyBank} className="mr-2" />{t('total')}</p>
                                    <div className="flex flex-col text-[25px] md:text-[30px]">
                                        <p>{stakedAmount.ETH !== null ? `${formatBigInt(stakedAmount.ETH)} ETH` : 'Loading...'}</p>
                                        {ethPrice !== null && stakedAmount.ETH !== null && (
                                            <p className="text-sm">~${(parseFloat(formatBigInt(stakedAmount.ETH)) * ethPrice).toFixed(2)} USD</p>
                                        )}
                                    </div>
                                </div>

                                {/* Available in Wallet */}
                                <div className="flex justify-between items-center">
                                    <p><FontAwesomeIcon icon={faWallet} className="mr-2" />{t('available')}</p>
                                    <div className="flex flex-col text-[25px] md:text-[30px] text-right">
                                        <p>
                                            {ethWalletBalance && !isNaN(parseFloat(ethWalletBalance))
                                                ? `${parseFloat(ethWalletBalance).toFixed(2)} ETH`
                                                : 'Loading...'}
                                        </p>
                                        {ethPrice !== null && ethWalletBalance && !isNaN(parseFloat(ethWalletBalance)) && (
                                            <p className="text-sm text-right">~${(parseFloat(ethWalletBalance) * ethPrice).toFixed(2)} USD</p>
                                        )}
                                    </div>
                                </div>

                                {/* Other Stake Information like Stake On, Unlock In, APR, Earned Rewards, etc. */}
                                <div className="flex justify-between items-center">
                                    <p><FontAwesomeIcon icon={faCalendarCheck} className="mr-2" />{t('Stakeon')}</p>
                                    <div className="flex flex-col text-[25px] md:text-[30px] loader">
                                        {stakedOn.ETH ? (
                                            <>
                                                <p>{new Date(stakedOn.ETH * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                <p className="text-sm text-right">{Math.ceil((Date.now() - stakedOn.ETH * 1000) / (1000 * 60 * 60 * 24))} days ago</p>
                                            </>
                                        ) : (
                                            'Loading...'
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p><FontAwesomeIcon icon={faLockOpen} className="mr-2" />{t('unlockin')}</p>
                                    <div className="flex flex-col text-[25px] md:text-[30px] loader">
                                        {stakeEnd.ETH && stakedOn.ETH ? (
                                            <>
                                                <p>{new Date(stakeEnd.ETH * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                <p className="text-sm text-right">{Math.ceil((stakeEnd.ETH * 1000 - Date.now()) / (1000 * 60 * 60 * 24))} days to go</p>
                                                <div className="w-full h-4 bg-gray-300 rounded-full overflow-hidden mt-2">
                                                    <div className="h-full bg-green-500 transition-all duration-500 ease-in-out"
                                                        style={{ width: `${((Date.now() / 1000 - stakedOn.ETH) / (stakeEnd.ETH - stakedOn.ETH)) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </>
                                        ) : (
                                            'Loading...'
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p><FontAwesomeIcon icon={faPercentage} className="mr-2" />APR:</p>
                                    <p className="text-[25px] md:text-[30px] loader text-green-500" id="apr-tooltip">
                                        ~{apr}% <i className="fas fa-info-circle ml-2"></i>
                                    </p>
                                    <ReactTooltip anchorId="apr-tooltip" place="top" content="This is the annual percentage rate (APR) which determines the yield for your staked tokens." />
                                </div>
                                <div className="flex justify-between items-center">
                                    <p><FontAwesomeIcon icon={faAward} className="mr-2" />{t('earnsofar')}</p>
                                    <div className="flex flex-col text-[25px] md:text-[30px] loader">
                                        {earnedRewards.ETH !== null && !isNaN(earnedRewards.ETH) && stakedAmount.ETH !== null ? (
                                            <>
                                                <p>{`${formatBigInt(earnedRewards.ETH)} ETH`}</p>
                                                <p className="text-sm text-right text-green-500">
                                                    ~{Math.min((earnedRewards.ETH / stakedAmount.ETH) * 100, apr).toFixed(2)}% Earned
                                                </p>
                                            </>
                                        ) : (
                                            'Loading...'
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p><FontAwesomeIcon icon={faCoins} className="mr-2" />{t('totalreward')}</p>
                                    <div className="flex flex-col text-[25px] md:text-[30px] loader text-green-500">
                                        {ethPrice !== null && stakeRewards.ETH !== null && (
                                            <p>~${(parseFloat(formatBigInt(stakeRewards.ETH)) * ethPrice).toFixed(2)} USD</p>
                                        )}
                                        <p className="text-sm text-right">
                                            {stakeRewards.ETH !== null && !isNaN(stakeRewards.ETH)
                                                ? `${formatBigInt(stakeRewards.ETH)} ETH`
                                                : 'Loading...'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-between mt-4">
                                    <button
                                        className="bg-blue-500 hover:bg-blue-700 text-white p-3 rounded-md transform hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl active:scale-95 focus:outline-none"
                                        onClick={() => handleUnstake(wethAddress)}
                                    >
                                        Unstake
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // "No Stakes Yet" View
                            <div className="flex flex-col items-center justify-center p-8">
                                <h2 className="text-white text-3xl font-bold mb-4">{t('nostakeyet')}</h2>
                                <p className="text-white mb-4">
                                    {t('nostakeline')}
                                </p>
                                <button
                                    onClick={scrollToStakingSection}
                                    className="bg-blue-500 hover:bg-blue-700 text-white p-3 rounded-md mt-4 transform hover:scale-105 transition-transform duration-300 focus:outline-none"
                                >
                                    {t('getstarted')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>


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
                
                
                <div className="w-full h-40"></div>
        </div>
    );
}

export default Staking;
