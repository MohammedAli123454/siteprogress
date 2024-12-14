'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FaRegCircle } from "react-icons/fa";
import { FaRegSquareFull } from "react-icons/fa6";
import { TbRectangleVertical } from "react-icons/tb";
import { LuTriangleRight } from "react-icons/lu";
import { FiOctagon } from "react-icons/fi";
import { BiCylinder } from "react-icons/bi";
import { GiStraightPipe } from "react-icons/gi";
import { BsOpencollective } from "react-icons/bs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"; // Import the custom Select components
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Zod schema
const shapeSchema = z.object({
  value: z.coerce.number().positive('Please enter a positive number'),
  value2: z.coerce.number().positive('Please enter a positive number').optional(),
});

const formulaExplanations = {
  circle: { 
    formula: 'π * r²', 
    explanation: 'To find the area of a circle, you multiply "pi" (about 3.14) by the radius (the distance from the center to the edge) squared (that means multiplying the radius by itself).' 
  },
  square: { 
    formula: 's²', 
    explanation: 'To find the area of a square, you multiply one side (s) by itself. So, if you know the length of one side, just square it (multiply it by itself)!' 
  },
  rectangle: { 
    formula: 'l * w', 
    explanation: 'To find the area of a rectangle, you multiply the length (l) by the width (w).' 
  },
  octagon: { 
    formula: '2 * (1 + √2) * s²', 
    explanation: 'An octagon has 8 sides. To find its area, you multiply 2 by (1 plus the square root of 2), then multiply by the side length squared (side length times itself).' 
  },
  triangle: { 
    formula: '0.5 * b * h', 
    explanation: 'To find the area of a triangle, multiply the base (b) by the height (h), then divide by 2.' 
  },
  cylinder: { 
    formula: 'π * r² * h', 
    explanation: 'A cylinder is like a can. To find its volume, you multiply "pi" (about 3.14) by the radius squared, then multiply that by the height (how tall it is).' 
  },
  pipe: { 
    formula: 'π * r²', 
    explanation: 'A pipe is like a long cylinder. To find its cross-sectional area (the size of the hole in the middle), you multiply "pi" by the radius squared.' 
  },
  vessel: { 
    formula: 'π * r²', 
    explanation: 'A vessel (like a bowl or cup) with a round bottom uses the same formula as a circle. Multiply "pi" by the radius squared to find the area of the bottom of the vessel.' 
  },
};

type Shape = 'circle' | 'square' | 'rectangle' | 'octagon' | 'triangle' | 'cylinder' | 'pipe' | 'vessel' | null;

interface FormData {
  value: number;
  value2?: number; // optional field for shapes like rectangle and cylinder
}

// Shape options with icons (icon name strings)
const shapeOptions = [
  { value: 'circle', label: 'Circle', icon: <FaRegCircle size={40} /> },
  { value: 'square', label: 'Square', icon: <FaRegSquareFull size={40} /> },
  { value: 'rectangle', label: 'Rectangle', icon: <TbRectangleVertical size={40} /> },
  { value: 'octagon', label: 'Octagon', icon: <FiOctagon size={40} /> },
  { value: 'triangle', label: 'Triangle', icon: <LuTriangleRight size={40} /> },
  { value: 'cylinder', label: 'Cylinder', icon: <BiCylinder size={40} /> },
  { value: 'pipe', label: 'Pipe', icon: <GiStraightPipe size={40} /> },
  { value: 'vessel', label: 'Vessel', icon: <BsOpencollective size={40} /> },
];

export default function Home() {
  const [result, setResult] = useState<number | null>(null);
  const [selectedShape, setSelectedShape] = useState<Shape>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(shapeSchema),
    defaultValues: { value: undefined, value2: undefined },
  });

  const calculateArea = (data: FormData) => {
    const { value, value2 } = data;
    let area: number | null = null;

    switch (selectedShape) {
      case 'circle':
        area = Math.PI * value ** 2;
        break;
      case 'square':
        area = value ** 2;
        break;
      case 'rectangle':
        area = value * (value2 || 0);
        break;
      case 'octagon':
        area = 2 * (1 + Math.sqrt(2)) * value ** 2;
        break;
      case 'triangle':
        area = 0.5 * value * (value2 || 0);  // Base * Height / 2
        break;
      case 'cylinder':
        area = 4 * Math.PI * value ** 2 + 2 * Math.PI * value * (value2 || 0);
        break;
      case 'pipe':
        area = Math.PI * value ** 2;
        break;
      case 'vessel':
        area = Math.PI * value ** 2;
        break;
      default:
        area = null;
    }

    setResult(area);
    reset();
  };

  const handleShapeChange = (value: string) => {
    setSelectedShape(value as Shape); // Directly set the value as Shape type
    setResult(null); // Reset result when changing shape
  };

  // Find the selected shape icon based on the selected shape
  const selectedShapeIcon = shapeOptions.find(option => option.value === selectedShape)?.icon;

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  const formulaExplanation = selectedShape ? formulaExplanations[selectedShape] : null;

  return (
    <div className="h-screen w-screen bg-gray-100 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl flex gap-8">

        {/* Left Card: Form */}
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-center">Calculator area of the selected object</h1>

          {/* Select Dropdown for Shape */}
          <div className="mb-4">
            <Select onValueChange={handleShapeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a Shape" />
              </SelectTrigger>
              <SelectContent>
                {shapeOptions.map((shape) => (
                  <SelectItem key={shape.value} value={shape.value}>
                    {shape.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          {/* Form */}
          {selectedShape && (
            <form onSubmit={handleSubmit(calculateArea)} className="mb-4">
              <label htmlFor="value" className="block mb-2 font-medium">
                {selectedShape === 'circle' ? 'Radius (r):' :
                  selectedShape === 'rectangle' ? 'Length (l):' :
                  selectedShape === 'cylinder' ? 'Radius (r):' :
                  selectedShape === 'pipe' ? 'Radius (r):' :
                  selectedShape === 'vessel' ? 'Radius (r):' :
                  selectedShape === 'triangle' ? 'Base (b):' : 'Side Length (s):'}
              </label>
              <input
                type="number"
                id="value"
                {...register('value')}
                className="border border-gray-300 rounded px-3 py-2 w-full mb-2 focus:ring focus:ring-blue-300 outline-none"
              />
              {(selectedShape === 'rectangle' || selectedShape === 'triangle' || selectedShape === 'cylinder') && (
                <>
                  <label htmlFor="value2" className="block mb-2 font-medium mt-2">
                    {selectedShape === 'rectangle' ? 'Width (w):' : 'Height (h):'}
                  </label>
                  <input
                    type="number"
                    id="value2"
                    {...register('value2')}
                    className="border border-gray-300 rounded px-3 py-2 w-full mb-2 focus:ring focus:ring-blue-300 outline-none"
                  />
                </>
              )}

              {errors.value && <p className="text-red-500 text-sm">{errors.value.message}</p>}
              {errors.value2 && <p className="text-red-500 text-sm">{errors.value2.message}</p>}

              <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded w-full mt-4">
                Calculate
              </button>
            </form>
          )}

          {/* Show Result */}
          {result !== null && (
            <div className="text-center mt-4">
              <h2 className="text-xl font-bold">Result</h2>
              <p className="text-lg">Area: {result.toFixed(2)}</p>
            </div>
          )}
        </div>

      
       {/* Display Selected Shape */}
<div className="mb-4 flex flex-col justify-center items-center gap-5">
  {selectedShape && (
    <>
      <p className="text-center text-sm text-gray-600 mr-4">
        Selected Shape: {selectedShape.charAt(0).toUpperCase() + selectedShape.slice(1)}
      </p>
      {/* Display the shape icon with larger size */}
      {selectedShape === 'circle' && <FaRegCircle size={150} className="text-blue-500" />}
      {selectedShape === 'square' && <FaRegSquareFull size={150} className="text-blue-500" />}
      {selectedShape === 'rectangle' && <TbRectangleVertical size={150} className="text-blue-500" />}
      {selectedShape === 'octagon' && <FiOctagon size={150} className="text-blue-500" />}
      {selectedShape === 'triangle' && <LuTriangleRight size={150} className="text-blue-500" />}
      {selectedShape === 'cylinder' && ( <Image src="/cylinder.svg" alt="Cylinder" width={150} height={150}/>)}
      {selectedShape === 'pipe' && <GiStraightPipe size={150} className="text-blue-500" />}
      {selectedShape === 'vessel' && <BsOpencollective size={150} className="text-blue-500" />}
      
      {/* Button to show Formula and Explanation */}
      <button
        onClick={openDialog}
        className="mt-4 bg-green-500 hover:bg-green-700 text-white font-medium px-4 py-2 rounded"
      >
        Show Formula & Explanation
      </button>
    </>
  )}
</div>
{/* <DialogHeader className="flex justify-center items-center gap-4"> */}
{/* Dialog */}
{selectedShape && formulaExplanation && (
  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
    <DialogTrigger />
    <DialogContent style={{ maxWidth: '800px', width: '100%' }}>
    <DialogHeader >
    <div className="flex justify-between items-center gap-4">
  <div>
    <Badge className="bg-blue-500 text-white text-2xl py-6">{formulaExplanation.formula}</Badge>
  </div>

  {/* Display the selected shape icon */}
  <div className="text-blue-500">
    {selectedShape === 'circle' && <FaRegCircle size={150} />}
    {selectedShape === 'square' && <FaRegSquareFull size={150} />}
    {selectedShape === 'rectangle' && <TbRectangleVertical size={150} />}
    {selectedShape === 'octagon' && <FiOctagon size={150} />}
    {selectedShape === 'triangle' && <LuTriangleRight size={150} />}
    {selectedShape === 'cylinder' && ( <Image src="/cylinder.svg" alt="Cylinder" width={150} height={150}/>)}
    {selectedShape === 'pipe' && <GiStraightPipe size={150} />}
    {selectedShape === 'vessel' && <BsOpencollective size={150} />}
  </div>

  </div>
</DialogHeader>

      <DialogDescription className="mt-4">
       

        {/* Explanation with increased font size */}
        <h3 className="text-lg font-semibold">Explanation:</h3>
        <p className="text-xl">{formulaExplanation.explanation}</p>
      </DialogDescription>
    </DialogContent>
  </Dialog>
)}


      </div>
    </div>
  );
}
