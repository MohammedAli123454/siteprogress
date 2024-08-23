"use client"
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
  } from "@/components/ui/drawer"
import { Separator } from '@/components/ui/separator';

const carFeatures = [
  "Air Conditioner",
  "Leather Seats",
  "Touchscreen Display",
  "Child Safety Lock",
  "Stability Control",
  "Rain Sensing Wiper",
  "Anti-Lock Braking",
  "Power Windows",
  "Cruise Control",
  "Heated Seats",
  "Bluetooth",
  "Vanity Mirror",
  "Digital Odometer",
  "Panoramic Moonroof",
  "Driver Air Bag",
  "Traction Control",
  "Rear Spoiler",
  "Android Audio",
  "HomeLink",
  "Heater",
  "Tachometer",
  "Brake Assist",
  "Power Door Locks",
  "Fog Lights Front",
  "Windows Electric",
  "Apple CarPlay",
  "Power Steering"
];

export default function CarFeatures() {
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const handleFeatureChange = (feature: string) => {
      setSelectedFeatures(prev =>
          prev.includes(feature)
              ? prev.filter(f => f !== feature)
              : [...prev, feature]
      );
  };

  const showSelectedFeatures = () => {
      alert(JSON.stringify(selectedFeatures, null, 2));
  };

  const selectAllFeatures = () => {
      setSelectedFeatures(carFeatures);
  };

  const deselectAllFeatures = () => {
      setSelectedFeatures([]);
  };

  return (
      <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Car Features</h2>

          <Card className="p-4 mb-4">
              <h3 className="text-lg font-semibold mb-2 text-center">Selected Features</h3>
              <ul className="list-disc pl-5">
                  {selectedFeatures.map((feature, index) => (
                      <li key={index}>{feature}</li>
                  ))}
              </ul>
          </Card>

          <Drawer>
              <DrawerTrigger asChild>
                  <Button className="mb-4 bg-blue-500 text-white">
                      Add Features
                  </Button>
              </DrawerTrigger>
              <DrawerContent className='p-4'>
                  <h2 className="text-xl font-bold mb-4 text-center">Select Car Features</h2>
                  <Separator className="my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {carFeatures.map((feature, index) => (
                          <div key={index} className="flex items-center">
                              <Checkbox
                                  id={`feature-${index}`}
                                  checked={selectedFeatures.includes(feature)}
                                  onCheckedChange={() => handleFeatureChange(feature)}
                              />
                              <label
                                  htmlFor={`feature-${index}`}
                                  className="ml-2 text-sm font-medium leading-none"
                              >
                                  {feature}
                              </label>
                          </div>
                      ))}
                  </div>
                  <div className="mt-6 flex justify-end gap-4">
                      <Button onClick={selectAllFeatures} className="bg-green-500 text-white">
                          Select All
                      </Button>
                      <Button onClick={deselectAllFeatures} className="bg-red-500 text-white">
                          Deselect All
                      </Button>
                      <DrawerClose asChild>
                          <Button className="bg-blue-500 text-white">
                              Submit
                          </Button>
                      </DrawerClose>
                  </div>
              </DrawerContent>
          </Drawer>
      </div>
  );
}