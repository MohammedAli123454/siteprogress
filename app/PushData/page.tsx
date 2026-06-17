"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import data from "@/app/data.json";
import { db } from "../configs/db";
import { mocDetail, jointsDetail } from "../configs/schema";
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

      for (let i = 0; i < totalItems; i++) {
        const item = jsonData[i];
        const thickness = parseInt(item.THKNESS) || 0;
        const shopJoints = parseInt(item["SHOP JOINTS"]) || 0;
        const shopInchDia = parseInt(item["SHOP INCH DIA"]) || 0;
        const fieldJoints = parseInt(item["FIELD JOINTS"]) || 0;
        const fieldInchDia = parseInt(item["FIELD INCH DIA"]) || 0;
        const totalJoints = parseInt(item["TOTAL JOINTS"]) || 0;
        const totalInchDia = parseInt(item["TOTAL INCH DIA"]) || 0;
  
        await db.insert(jointsDetail).values({
          sizeInches: item["SIZE (INCHES)"],
          pipeSchedule: item["PIPE SCHEDULE"],
          thickness,
          shopJoints,
          shopInchDia,
          fieldJoints,
          fieldInchDia,
          totalJoints,
          totalInchDia,
          moc: item.MOC,
        });

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
        <DialogHeader>
          <DialogTitle>Data Insertion Progress</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <Progress value={progress} className="w-full" />
          <span>{Math.round(progress)}%</span>
        </div>
        <DialogFooter>
          {successMessage && (
            <p id="dialog-description" className="text-center">
              {successMessage}
            </p>
          )}
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default PushDataComponent;
