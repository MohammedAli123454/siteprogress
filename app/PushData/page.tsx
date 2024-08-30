"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import data from "@/app/data.json";
import { db } from "../configs/db";
import { mocDetail, jointsDetail } from "../configs/schema";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface DataType {
  "SIZE (INCHES)": string;
  "PIPE SCHEDULE": string;
  THKNESS: string;
  "SHOP JOINTS": string;
  "SHOP INCH DIA": string;
  "FIELD JOINTS": string;
  "FIELD INCH DIA": string;
  "TOTAL JOINTS": string;
  "TOTAL INCH DIA": string;
  MOC: string;
  "MOC NAME": string;
}

const PushDataComponent = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const pushData = async () => {
    const jsonData = data as unknown as DataType[];
    const totalItems = jsonData.length;

    setShowDialog(true);
    setLoading(true);
    setSuccessMessage(null);

    try {
      const uniqueMoc = new Set();
      
      // First, insert unique moc and mocName into moc_detail
      for (let i = 0; i < totalItems; i++) {
        const item = jsonData[i];
        const { MOC, "MOC NAME": mocName } = item;

        if (!uniqueMoc.has(MOC)) {
          uniqueMoc.add(MOC);

          await db.insert(mocDetail).values({
            moc: MOC,
            mocName: mocName,
          });
        }
      }

      // Then, insert relevant data into joints_detail
      for (let i = 0; i < totalItems; i++) {
        const item = jsonData[i];
        await db.insert(jointsDetail).values({
          sizeInches: item?.["SIZE (INCHES)"],
          pipeSchedule: item?.["PIPE SCHEDULE"],
          thickness: parseInt(item?.THKNESS || "0", 10),
          shopJoints: parseInt(item?.["SHOP JOINTS"] || "0", 10),
          shopInchDia: parseInt(item?.["SHOP INCH DIA"] || "0", 10),
          fieldJoints: parseInt(item?.["FIELD JOINTS"] || "0", 10),
          fieldInchDia: parseInt(item?.["FIELD INCH DIA"] || "0", 10),
          totalJoints: parseInt(item?.["TOTAL JOINTS"] || "0", 10),
          totalInchDia: parseInt(item?.["TOTAL INCH DIA"] || "0", 10),
          moc: item?.MOC,
        });

        // Update progress
        setProgress(((i + 1) / totalItems) * 100);
      }

      setSuccessMessage("Data pushed successfully!");
    } catch (error) {
      console.error("Error pushing data:", error);
      setSuccessMessage("Failed to push data");
    } finally {
      setLoading(false);
    }
  };

  const handlePushData = () => {
    pushData();
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setProgress(0);
  };

  return (
    <div>
      {!loading && (
        <Button onClick={handlePushData} disabled={loading}>
          Push Data
        </Button>
      )}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Data Insertion Progress</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <Progress value={progress} className="w-full" />
            <span>{Math.round(progress)}%</span>
          </div>
          <DialogFooter>
            {successMessage && <p className="text-center">{successMessage}</p>}
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PushDataComponent;



