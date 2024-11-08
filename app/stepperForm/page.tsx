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



'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import tradeList from '@/app/tradelist.json';

// Define the Trade interface
interface Trade {
  TradeName: string;
  Discipline: string;
  selected: boolean;
  nos: string | number;
}

const typedTradeList: Trade[] = tradeList as Trade[];

// Main component
const TradeListComponent: React.FC = () => {
  const [tradeValues, setTradeValues] = useState<Trade[]>(
    typedTradeList.map((trade) => ({
      ...trade,
      selected: false,
      nos: '',
    }))
  );

  const [showValues, setShowValues] = useState(false); // New state to toggle showing values

  // Toggle selection of a single trade
  const toggleTradeSelection = (tradeName: string, discipline: string) => {
    setTradeValues((prev) =>
      prev.map((trade) =>
        trade.TradeName === tradeName && trade.Discipline === discipline
          ? { ...trade, selected: !trade.selected }
          : trade
      )
    );
  };

  // Select or deselect all trades
  const toggleAllTrades = (selectAll: boolean) => {
    setTradeValues((prev) => prev.map((trade) => ({ ...trade, selected: selectAll })));
  };

  // Handle NOS input change (to prevent one input affecting another)
  const handleNosChange = (tradeName: string, discipline: string, value: string) => {
    setTradeValues((prev) =>
      prev.map((trade) =>
        trade.TradeName === tradeName && trade.Discipline === discipline
          ? { ...trade, nos: value }
          : trade
      )
    );
  };

  // Group trades by discipline
  const groupedTrades = tradeValues.reduce((acc, trade) => {
    if (!acc[trade.Discipline]) {
      acc[trade.Discipline] = [];
    }
    acc[trade.Discipline].push(trade);
    return acc;
  }, {} as Record<string, Trade[]>);

  const disciplines = Object.entries(groupedTrades);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4"> {/* Use the same background for the entire screen */}
      <div className="max-w-screen-lg w-full p-6 bg-gray-200 rounded-lg shadow-lg space-y-6"> {/* Card background is same as screen */}
        {/* Select All / Deselect All Controls */}
        <div className="flex justify-between mb-4">
          <button
            type="button"
            onClick={() => toggleAllTrades(true)}
            className="text-blue-500 px-4 py-2 border rounded hover:bg-blue-100"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => toggleAllTrades(false)}
            className="text-red-500 px-4 py-2 border rounded hover:bg-red-100"
          >
            Deselect All
          </button>
        </div>

        {/* Render disciplines in a single column layout */}
        <div className="grid grid-cols-1 gap-6">
          {disciplines.map(([discipline, trades]) => (
            <Card key={discipline} className="border p-4 space-y-4 bg-gray-200 shadow-none"> {/* Same background for card */}
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Select the trade persons for  {discipline}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trades.map((trade, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={trade.selected}
                        onCheckedChange={() =>
                          toggleTradeSelection(trade.TradeName, trade.Discipline)
                        }
                      />
                      <span className="text-gray-700">{trade.TradeName}</span>
                    </div>
                    <div className="flex justify-center sm:justify-between">
                      <Input
                        type="number"
                        placeholder="Enter Required No."
                        value={trade.nos}
                        onChange={(e) =>
                          handleNosChange(trade.TradeName, trade.Discipline, e.target.value)
                        }
                        className="w-full sm:w-1/2 bg-gray-300 border-gray-400 text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Button to toggle showing the trade values */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setShowValues(!showValues)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-400"
          >
            {showValues ? 'Hide Values' : 'Show Values'}
          </button>
        </div>

        {/* Conditionally render trade values */}
        {showValues && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800">Trade Values:</h3>
            <pre className="bg-gray-200 p-4 rounded">{JSON.stringify(tradeValues, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeListComponent;
