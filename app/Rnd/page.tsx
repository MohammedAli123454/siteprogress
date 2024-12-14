"use client";

import { useState } from "react";

const steps = [
    { label: "Personal Information" },
    { label: "Address Information" },
    { label: "Contact Information" },
    { label: "Account Setup" },
    { label: "Review & Save" },
];

export default function Rnd() {
    const [currentStep, setCurrentStep] = useState(1);

    const handleNext = () => {
        if (currentStep < steps.length) setCurrentStep((prev) => prev + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep((prev) => prev - 1);
    };

    return (
<div className="flex items-center justify-center min-h-[90vh] bg-white border border-gray-200 p-8 max-w-[1400px] mx-auto">
            {/* Parent container now has max-width */}
            <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-[900px]"> {/* This controls the child container's width */}
                {/* Step Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-indigo-600">
                        {steps[currentStep - 1].label}
                    </h2>
                    <p className="text-gray-600">
                        Step {currentStep} of {steps.length}.
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-24 mb-6">
                    {steps.map((step, index) => (
                        <div key={index} className="relative flex items-center">
                            {/* Circle */}
                            <div
                                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ease-in-out transform ${index + 1 <= currentStep
                                        ? "bg-blue-500 border-blue-500 text-white shadow-lg scale-110"
                                        : "border-gray-300 text-gray-500 hover:border-blue-300 hover:text-blue-500"
                                    }`}

                            >
                                {index + 1}
                            </div>
                            {/* Connecting line */}
                            {index < steps.length - 1 && (
                                <div className="absolute top-1/2 left-full w-24">
                                    <div
                                        className={`h-0.5 ${index + 1 < currentStep
                                                ? "bg-blue-500"
                                                : "bg-gray-300"
                                            } rounded-full transition-all duration-300 ease-in-out`}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className="px-4 py-2 text-sm bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 disabled:opacity-50"
                        aria-label="Go to previous step"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={currentStep === steps.length}
                        className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                        aria-label="Go to next step">Next</button>

                </div>
            </div>
        </div>
    );
}
