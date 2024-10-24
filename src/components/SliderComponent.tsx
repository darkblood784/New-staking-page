import React, { useCallback, useRef, useState, useEffect } from 'react';

interface WhaleSliderProps {
    sliderValue: number;
    setSliderValue: (value: number) => void;
    getWhaleHeadSrc: () => string;
    availableBalance: number | string; // Added availableBalance to show the balance above the slider
    setInputValue: (value: string) => void; // Added to update input field value based on slider movement
}

const WhaleSlider: React.FC<WhaleSliderProps> = ({
    sliderValue,
    setSliderValue,
    getWhaleHeadSrc,
    availableBalance,
    setInputValue
}) => {
    const sliderContainerRef = useRef<HTMLDivElement>(null);
    const whaleHeadRef = useRef<HTMLImageElement>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const handleResize = () => {
        setWindowWidth(window.innerWidth);
    };

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [isHovered, setIsHovered] = useState<boolean>(false); // State for hover effect

    // Handling the start of a drag (Mouse and Touch)
    const handleStartDrag = useCallback((event: React.MouseEvent | React.TouchEvent) => {
        event.preventDefault();
        setIsDragging(true);
    }, []);

    // Handling the end of a drag (Mouse and Touch)
    const handleEndDrag = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Handling the dragging movement (Mouse and Touch)
    const handleMove = useCallback(
        (event: MouseEvent | TouchEvent) => {
            if (isDragging && sliderContainerRef.current) {
                const bounds = sliderContainerRef.current.getBoundingClientRect();
                let clientX;

                // Determine the clientX value based on the type of event (Mouse or Touch)
                if (event instanceof MouseEvent) {
                    clientX = event.clientX;
                } else if (event instanceof TouchEvent) {
                    clientX = event.touches[0].clientX;
                }

                if (clientX !== undefined) {
                    const mouseX = clientX - bounds.left;
                    const newValue = Math.max(0, Math.min(100, (mouseX / bounds.width) * 100));
                    setSliderValue(newValue);

                    // Update the input field value based on slider value
                    if (typeof availableBalance === 'number' && !isNaN(availableBalance)) {
                        const calculatedValue = ((availableBalance * newValue) / 100).toFixed(2);
                        setInputValue(calculatedValue);
                    }
                }
            }
        },
        [isDragging, setSliderValue, availableBalance, setInputValue]
    );

    // Attaching and cleaning up event listeners for both mouse and touch
    useEffect(() => {
        const handleGlobalEndDrag = () => setIsDragging(false);

        if (isDragging) {
            // Add mouse and touch event listeners
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleGlobalEndDrag);
            document.addEventListener('touchmove', handleMove);
            document.addEventListener('touchend', handleGlobalEndDrag);
        }

        return () => {
            if (isDragging) {
                // Remove mouse and touch event listeners
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleGlobalEndDrag);
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('touchend', handleGlobalEndDrag);
            }
        };
    }, [isDragging, handleMove]);

    // Function to calculate position of whale parts conditionally based on window width
    const getConditionalPosition = (type: 'tail' | 'body' | 'head') => {
        if (windowWidth < 768) {
            // Mobile screens
            switch (type) {
                case 'tail':
                    return '-60px'; // Tail closer for mobile
                case 'body':
                    return '-20px'; // Body closer for mobile
                case 'head':
                    return `calc(${sliderValue}% - 30px)`; // Head adjusted for smaller screen
                default:
                    return '0';
            }
        } else if (windowWidth >= 768 && windowWidth < 1024) {
            // Tablet screens
            switch (type) {
                case 'tail':
                    return '-70px'; // Tail position for tablet
                case 'body':
                    return '-25px'; // Body position for tablet
                case 'head':
                    return `calc(${sliderValue}% - 40px)`; // Head adjusted for tablet
                default:
                    return '0';
            }
        } else {
            // Desktop screens
            switch (type) {
                case 'tail':
                    return '-80px'; // Tail position for desktop
                case 'body':
                    return '-35px'; // Body position for desktop
                case 'head':
                    return `calc(${sliderValue}% - 48px)`; // Head adjusted for desktop
                default:
                    return '0';
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <div ref={sliderContainerRef} className="slider-container relative w-full h-[80px] mb-5">
                {/* Whale Tail: Position adjusted conditionally */}
                <img
                    src="./whale/tail.png"
                    alt="Whale Tail"
                    className="absolute bottom-0 w-[50px] h-[54.5px]"
                    style={{ left: getConditionalPosition('tail') }}
                />

                {/* Whale Body: Position and width adjusted conditionally */}
                <div
                    className="absolute bottom-0 h-[34px]"
                    style={{
                        left: getConditionalPosition('body'),
                        width: `calc(${sliderValue}% - 0px)`,
                        backgroundImage: 'url(./whale/body.png)',
                        backgroundRepeat: 'repeat-x',
                        backgroundSize: 'contain',
                    }}
                ></div>

                {/* Whale Head: Position adjusted conditionally */}
                <img
                    ref={whaleHeadRef}
                    src={getWhaleHeadSrc()}
                    alt="Whale Head"
                    className="absolute cursor-pointer bottom-0 top-[43px] w-[60px] h-[44px]"
                    style={{
                        left: getConditionalPosition('head'), // Position the head with the slider
                        transform: isHovered ? 'scale(1.05)' : 'scale(1.01)', // Hover effect (scaling the whale head)
                        transition: 'transform 0.1s ease', // Smooth transition for the hover effect
                    }}
                    onMouseDown={handleStartDrag}
                    onTouchStart={handleStartDrag} // Handle touch start for mobile devices
                    onMouseEnter={() => setIsHovered(true)} // Set hover state on mouse enter
                    onMouseLeave={() => setIsHovered(false)} // Unset hover state on mouse leave
                />
            </div>

            {/* Buttons for preset values */}
            <div className="buttons-container flex justify-between w-full">
                {[25, 50, 75, 100].map((val) => (
                    <button
                        key={val}
                        onClick={() => {
                            setSliderValue(val);
                            if (typeof availableBalance === 'number' && !isNaN(availableBalance)) {
                                const calculatedValue = ((availableBalance * val) / 100).toFixed(2);
                                setInputValue(calculatedValue);
                            }
                        }}
                        className="text-sm w-[20%] py-1 rounded-full transition-colors duration-200 border-2 hover:bg-white hover:text-black"
                    >
                        {val === 100 ? 'All In' : `${val}%`}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default WhaleSlider;