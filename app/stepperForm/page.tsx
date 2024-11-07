// "use client";
// import { useState } from 'react';
// import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
// import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';

// // Define an interface for your form fields
// interface FormData {
//   firstName: string;
//   lastName: string;
//   email: string;
//   address: string;
//   city: string;
//   phoneNumber: string;
//   username: string;
//   password: string;
// }

// const steps = [
//   { label: 'Personal Information' },
//   { label: 'Address Information' },
//   { label: 'Contact Information' },
//   { label: 'Account Setup' },
//   { label: 'Review & Save' },
// ];

// const StepperForm = () => {
//   const methods = useForm<FormData>({
//     defaultValues: {
//       firstName: '',
//       lastName: '',
//       email: '',
//       address: '',
//       city: '',
//       phoneNumber: '',
//       username: '',
//       password: '',
//     },
//   });
//   const [step, setStep] = useState(1);
//   const [savedData, setSavedData] = useState<FormData | null>(null);

//   // Define the onSubmit handler type
//   const onSubmit: SubmitHandler<FormData> = (data) => {
//     setSavedData(data);
//     alert('Data saved successfully!');
//   };

//   const onNext = () => setStep((prevStep) => prevStep + 1);
//   const onBack = () => setStep((prevStep) => prevStep - 1);

//   return (
//     <FormProvider {...methods}>
//       <form onSubmit={methods.handleSubmit(onSubmit)} className="max-w-lg mx-auto">
//         {/* Step Indicator */}
//         <div className="flex items-center gap-8 mb-6">
//   {steps.map((_, index) => (
//     <div key={index} className="relative flex items-center">
//       {/* Circle */}
//       <div
//         className={`flex items-center justify-center w-10 h-10 rounded-full border-2  transition-all duration-300 ease-in-out transform hover:scale-110 ${
//           index + 1 <= step 
//             ? 'bg-blue-500 border-blue-500 text-white shadow-lg' 
//             : 'border-gray-300 text-gray-500 hover:border-blue-300 hover:text-blue-500'
//         }`}
//       >
//         {index + 1}
//       </div>

//       {/* Connecting line between circles */}
//       {index < steps.length - 1 && (
//         <div className="absolute top-1/2 left-full w-8">
//           <div
//             className={`h-0.5 ${index + 1 < step ? 'bg-blue-500' : 'bg-gray-300'} rounded-full transition-all duration-300 ease-in-out`}
//           />
//         </div>
//       )}
//     </div>
//   ))}
// </div>








//         <Card className="p-6">
//           <CardHeader>
//             <CardTitle className="text-xl">{steps[step - 1].label}</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {/* Form Fields Based on Steps */}
//             {step === 1 && (
//               <div className="space-y-4">
//                 <div>
//                   <label className="text-sm font-medium">First Name</label>
//                   <Input
//                     type="text"
//                     {...methods.register('firstName', { required: 'First name is required' })}
//                     className="mt-1 w-full"
//                   />
//                   {methods.formState.errors.firstName && (
//                     <p className="text-red-500 text-sm">{methods.formState.errors.firstName.message}</p>
//                   )}
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium">Last Name</label>
//                   <Input
//                     type="text"
//                     {...methods.register('lastName', { required: 'Last name is required' })}
//                     className="mt-1 w-full"
//                   />
//                   {methods.formState.errors.lastName && (
//                     <p className="text-red-500 text-sm">{methods.formState.errors.lastName.message}</p>
//                   )}
//                 </div>
//               </div>
//             )}

//             {step === 2 && (
//               <div className="space-y-4">
//                 <div>
//                   <label className="text-sm font-medium">Address</label>
//                   <Input
//                     type="text"
//                     {...methods.register('address', { required: 'Address is required' })}
//                     className="mt-1 w-full"
//                   />
//                   {methods.formState.errors.address && (
//                     <p className="text-red-500 text-sm">{methods.formState.errors.address.message}</p>
//                   )}
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium">City</label>
//                   <Input
//                     type="text"
//                     {...methods.register('city', { required: 'City is required' })}
//                     className="mt-1 w-full"
//                   />
//                   {methods.formState.errors.city && (
//                     <p className="text-red-500 text-sm">{methods.formState.errors.city.message}</p>
//                   )}
//                 </div>
//               </div>
//             )}

//             {step === 3 && (
//               <div className="space-y-4">
//                 <div>
//                   <label className="text-sm font-medium">Phone Number</label>
//                   <Input
//                     type="text"
//                     {...methods.register('phoneNumber', { required: 'Phone number is required' })}
//                     className="mt-1 w-full"
//                   />
//                   {methods.formState.errors.phoneNumber && (
//                     <p className="text-red-500 text-sm">{methods.formState.errors.phoneNumber.message}</p>
//                   )}
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium">Email</label>
//                   <Input
//                     type="email"
//                     {...methods.register('email', { required: 'Email is required' })}
//                     className="mt-1 w-full"
//                   />
//                   {methods.formState.errors.email && (
//                     <p className="text-red-500 text-sm">{methods.formState.errors.email.message}</p>
//                   )}
//                 </div>
//               </div>
//             )}

//             {step === 4 && (
//               <div className="space-y-4">
//                 <div>
//                   <label className="text-sm font-medium">Username</label>
//                   <Input
//                     type="text"
//                     {...methods.register('username', { required: 'Username is required' })}
//                     className="mt-1 w-full"
//                   />
//                   {methods.formState.errors.username && (
//                     <p className="text-red-500 text-sm">{methods.formState.errors.username.message}</p>
//                   )}
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium">Password</label>
//                   <Input
//                     type="password"
//                     {...methods.register('password', { required: 'Password is required' })}
//                     className="mt-1 w-full"
//                   />
//                   {methods.formState.errors.password && (
//                     <p className="text-red-500 text-sm">{methods.formState.errors.password.message}</p>
//                   )}
//                 </div>
//               </div>
//             )}

//             {step === 5 && savedData && (
//               <div className="space-y-2">
//                 <h3 className="text-lg font-semibold">Review Information</h3>
//                 <p>First Name: {savedData.firstName}</p>
//                 <p>Last Name: {savedData.lastName}</p>
//                 <p>Address: {savedData.address}</p>
//                 <p>City: {savedData.city}</p>
//                 <p>Phone Number: {savedData.phoneNumber}</p>
//                 <p>Email: {savedData.email}</p>
//                 <p>Username: {savedData.username}</p>
//               </div>
//             )}
//           </CardContent>
//           <CardFooter className="flex justify-between">
//             {step > 1 && (
//               <Button type="button" onClick={onBack} variant="outline">
//                 Back
//               </Button>
//             )}
//             {step < 5 && (
//               <Button type="button" onClick={onNext} className="ml-auto">
//                 Next
//               </Button>
//             )}
//             {step === 5 && (
//               <Button type="submit" className="ml-auto">
//                 Save Data
//               </Button>
//             )}
//           </CardFooter>
//         </Card>
//       </form>
//     </FormProvider>
//   );
// };

// export default StepperForm;



'use client'

import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input' // Import the Input component from shadcn-ui

// List of trades
const tradesList = [
    'SAFETY OFFICERS', 'PERMIT RECEIVERS', 'PIPING ENGINEER', 'SUPERVISOR - PIPING',
    'SUPERVISOR - CIVIL', 'SUPERVISOR - PAINTING', 'SUPERVISOR - SCAFFOLDING', 'FABRICATOR',
    'PIPE FITTER', 'GRINDER', 'GAS CUTTER', 'Welder Supervisor/Foreman', '6G WELDER CS',
    'STRUCTURE 3G WELDER', 'WELDER HELPER', 'HELPER', 'CRANE OPERATOR', 'RIGGER III',
    'RIGGING HELPERS', 'ELECTRICIAN', 'FIRE WATCH', 'Mason', 'Steel Fixer', 'Carpenter',
    'Instrument Technician', 'Painter', 'Sand Blaster', 'Scaffolder'
]

interface Trade {
    tradeName: string
    selected: boolean
    nos: string | number
}

const TradeListComponent: React.FC = () => {
    const { control, handleSubmit } = useForm()
    const [tradeValues, setTradeValues] = useState<Trade[]>(
        tradesList.map(trade => ({
            tradeName: trade,
            selected: false,
            nos: ''
        }))
    )

    // Toggle selection of a single trade
    const toggleTradeSelection = (tradeName: string) => {
        setTradeValues(prev =>
            prev.map(trade =>
                trade.tradeName === tradeName
                    ? { ...trade, selected: !trade.selected }
                    : trade
            )
        )
    }

    // Select/Deselect all trades
    const toggleAllTrades = (selectAll: boolean) => {
        setTradeValues(prev =>
            prev.map(trade => ({ ...trade, selected: selectAll }))
        )
    }

    // Handle NOS input change
    const handleNosChange = (tradeName: string, value: string) => {
        setTradeValues(prev =>
            prev.map(trade =>
                trade.tradeName === tradeName
                    ? { ...trade, nos: value }
                    : trade
            )
        )
    }

    const onSubmit = (data: any) => {
        console.log(data)
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full p-4 bg-white rounded shadow-lg">
            {/* Select All / Deselect All Controls */}
            <div className="flex items-center justify-between mb-4">
                <button
                    type="button"
                    onClick={() => toggleAllTrades(true)}
                    className="text-blue-500"
                >
                    Select All
                </button>
                <button
                    type="button"
                    onClick={() => toggleAllTrades(false)}
                    className="text-red-500"
                >
                    Deselect All
                </button>
            </div>

            {/* Grid layout with 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto border p-2">
                {tradeValues.map((trade, index) => (
                    <div key={index} className="flex items-center justify-between gap-4 mb-4">
                        {/* Checkbox and trade name (60% width) */}
                        <div className="flex items-center w-3/5 gap-4">
                            <input
                                type="checkbox"
                                checked={trade.selected}
                                onChange={() => toggleTradeSelection(trade.tradeName)}
                                className="h-4 w-4"
                            />
                            <label className="text-sm">{trade.tradeName}</label>
                        </div>

                        {/* NOS input field (40% width) */}
                        <div className="w-2/5">
                            <Controller
                                control={control}
                                name={`nos-${trade.tradeName}`}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        id={`nos-${trade.tradeName}`}
                                        type="number"
                                        placeholder="Estimated No"
                                        value={trade.nos}
                                        onChange={(e) => {
                                            field.onChange(e)
                                            handleNosChange(trade.tradeName, e.target.value)
                                        }}
                                    />
                                )}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4">
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                    Submit
                </button>
            </div>
        </form>
    )
}

export default TradeListComponent
