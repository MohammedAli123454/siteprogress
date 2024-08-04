import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type HeaderType = {
  label: string;
  className: string;
};

type FooterType = {
  label: string | number;
  className: string;
};

type MocTableProps = {
  data: any[];
  headers: HeaderType[];
  columns: (item: any, index: number) => JSX.Element[];
  grandTotals: FooterType[];
  title: string;
};

export default function MocTable({ data, headers, columns, grandTotals, title }: MocTableProps) {
  return (
    <div className="w-full">
      <div className="bg-red-50 p-2">
        <h2 className="text-xl font-bold flex justify-center items-center">{title}</h2>
      </div>
      <Table className="mt-3 table-fixed w-full">
        <TableHeader>
          <TableRow className="flex sticky top-0 bg-gray-200">
            {headers.map((header, index) => (
              <TableCell key={index} className={header.className}>{header.label}</TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={item.MOC} className={`flex ${index % 2 === 0 ? "bg-gray-100" : ""}`}>
              {columns(item, index)}
            </TableRow>
          ))}
          <TableRow className="flex bg-gray-200 font-bold">
            {grandTotals.map((footer, index) => (
              <TableCell key={index} className={footer.className}>{footer.label}</TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
