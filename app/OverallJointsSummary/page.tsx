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

const overallData = jsonData.reduce<DataType[]>((acc, item) => {
  const existing = acc.find(i => i['SIZE (INCHES)'] === item['SIZE (INCHES)']);
  if (existing) {
    existing['SHOP JOINTS'] += item['SHOP JOINTS'];
    existing['SHOP INCH DIA'] += item['SHOP INCH DIA'];
    existing['FIELD JOINTS'] += item['FIELD JOINTS'];
    existing['FIELD INCH DIA'] += item['FIELD INCH DIA'];
    existing['TOTAL JOINTS'] += item['TOTAL JOINTS'];
    existing['TOTAL INCH DIA'] += item['TOTAL INCH DIA'];
  } else {
    acc.push({ ...item });
  }
  return acc;
}, []);

export default function OverallJointsSummary() {
  return (
    <div className="grid grid-cols-1 gap-4 p-4">
      <div>
        <JointSummaryTable data={overallData} />
      </div>
    </div>
  );
}
