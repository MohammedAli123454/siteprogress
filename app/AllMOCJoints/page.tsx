import Link from 'next/link';
import data from '@/app/data.json';
import { JointSummaryTable } from "@/components/JointSummaryTable";

type DataType = {
  "SIZE (INCHES)": number;
  "PIPE SCHEDULE": string;
  "THKNESS": string;
  "SHOP JOINTS": number;
  "SHOP INCH DIA": number;
  "FIELD JOINTS": number;
  "FIELD INCH DIA": number;
  "TOTAL JOINTS": number;
  "TOTAL INCH DIA": number;
  "MOC": string;
};

const jsonData = data as unknown as DataType[];

// Create a Set of MOC values
const mocSet = new Set<string>(jsonData.map(item => item.MOC));

// Convert Set to Array
const uniqueMOC = Array.from(mocSet);

export default function AllMOCJoints() {
  return (
    <div className="grid grid-cols-1 gap-4 p-4">
      {uniqueMOC.map((moc, index) => (
        <div key={index}>
          <JointSummaryTable data={jsonData} moc={moc} />
        </div>
      ))}
    </div>
  );
}
