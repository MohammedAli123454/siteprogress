import React from "react";

const CustomerStatement = () => {
  // Sample JSON data as per the attached customer statement
  const customerStatementData = [
    { date: "18-12-2024", documentNo: "YD/00458", documentType: "TRF FROM DOMAS", description: "R.V. Cash", debit: 0, credit: 1000 },
    { date: "19-12-2024", documentNo: "YD/00496", documentType: "R.V. Bank TRANS", description: "R.V. Cash", debit: 0, credit: 500 },
    { date: "21-12-2024", documentNo: "YD/00427", documentType: "TRF FROM DOMAS", description: "R.V. Cash", debit: 0, credit: 1350 },
    { date: "21-12-2024", documentNo: "XDN00478", documentType: "Delivery Note", description: "Sales Invoice", debit: 524.0, credit: 0 },
    { date: "23-12-2024", documentNo: "XDN00480", documentType: "Delivery Note", description: "Sales Invoice", debit: 2624.0, credit: 0 },
    { date: "23-12-2024", documentNo: "XDN00482", documentType: "Delivery Note", description: "Sales Invoice", debit: 870.0, credit: 0 },
    { date: "31-12-2024", documentNo: "YD/00466", documentType: "Sales Invoice", description: "Final Invoice", debit: 3924.0, credit: 0 },
    { date: "31-12-2024", documentNo: "XDN00484", documentType: "Delivery Note", description: "Sales Invoice", debit: 1848.0, credit: 0 },
    { date: "31-12-2024", documentNo: "XDN00486", documentType: "Delivery Note", description: "Sales Invoice", debit: 524.0, credit: 0 },
    { date: "31-12-2024", documentNo: "XDN00488", documentType: "Delivery Note", description: "Sales Invoice", debit: 1135.0, credit: 0 },
    { date: "31-12-2024", documentNo: "XDN00490", documentType: "Delivery Note", description: "Sales Invoice", debit: 0, credit: 0 },
    { date: "31-12-2024", documentNo: "XDN00492", documentType: "Delivery Note", description: "Sales Invoice", debit: 0, credit: 0 },
    { date: "31-12-2024", documentNo: "XDN00494", documentType: "Delivery Note", description: "Sales Invoice", debit: 0, credit: 0 },
    { date: "12-01-2025", documentNo: "YD/00160", documentType: "Sales Invoice", description: "Sales Transaction", debit: 0, credit: 0 },
    { date: "18-12-2025", documentNo: "YD/00458", documentType: "TRF FROM DOMAS", description: "R.V. Cash", debit: 0, credit: 200 },
    { date: "19-12-2025", documentNo: "YD/00496", documentType: "R.V. Bank TRANS", description: "R.V. Cash", debit: 0, credit: 300 },
    { date: "21-12-2025", documentNo: "YD/00427", documentType: "TRF FROM DOMAS", description: "R.V. Cash", debit: 0, credit: 500 },
  ];

  // Calculate running balance dynamically
  let runningBalance = 0; // Initial balance as per the provided data
  const statementWithBalance = customerStatementData.map((item) => {
    runningBalance = runningBalance + item.debit - item.credit; // Debit is added, Credit is subtracted
    return { ...item, balance: runningBalance };
  });

  // Calculate totals
  const totalDebit = statementWithBalance.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = statementWithBalance.reduce((sum, item) => sum + item.credit, 0);
  const finalBalance = statementWithBalance[statementWithBalance.length - 1].balance;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Customer Statement</h1>
      <p className="text-gray-700 mb-4">Statement Date: 24-01-2025</p>
      <div className="overflow-x-auto">
        <table className="table-auto w-full border-collapse border border-gray-300">
          {/* Fixed header */}
          <thead className="bg-gray-200 sticky top-0 z-10">
            <tr>
              <th className="border border-gray-300 px-4 py-2">Date</th>
              <th className="border border-gray-300 px-4 py-2">Document No</th>
              <th className="border border-gray-300 px-4 py-2">Document Type</th>
              <th className="border border-gray-300 px-4 py-2">Description</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Debit</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Credit</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Balance</th>
            </tr>
          </thead>
        </table>

        {/* Table Body with Scroll */}
        <div style={{ maxHeight: "500px", overflowY: "auto" }}>
          <table className="table-auto w-full border-collapse border border-gray-300">
            <tbody>
              {statementWithBalance.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="border border-gray-300 px-4 py-2">{item.date}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.documentNo}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.documentType}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{item.debit.toFixed(2)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{item.credit.toFixed(2)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{item.balance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <table className="table-auto w-full border-collapse border border-gray-300">
          <tfoot className="bg-gray-100">
            <tr>
              <td className="border border-gray-300 px-4 py-2 font-bold" colSpan={4}>Totals</td>
              <td className="border border-gray-300 px-4 py-2 text-right font-bold">{totalDebit.toFixed(2)}</td>
              <td className="border border-gray-300 px-4 py-2 text-right font-bold">{totalCredit.toFixed(2)}</td>
              <td className="border border-gray-300 px-4 py-2 text-right font-bold">{finalBalance.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default CustomerStatement;
