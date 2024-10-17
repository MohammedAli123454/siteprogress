"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import countryData from "@/app/countries.json";
import { db } from "../configs/db";
import { countries } from "../configs/schema";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";


interface CountryDetails {
    Population: number;
    Currency: string;
    NationalLanguage: string;
    GDP: number;
  }
  
  interface CountryData {
    CountryName: string;
    Details: CountryDetails;
  }
  

const PushCountriesData = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const pushData = async () => {
    const jsonData = countryData as unknown as CountryData[];
    const totalItems = jsonData.length;

    setShowDialog(true);
    setLoading(true);
    setSuccessMessage(null);

    try {
      // Insert country data
      for (let i = 0; i < totalItems; i++) {
        const item = jsonData[i];

        await db.insert(countries).values({
          countryName: item.CountryName,
          details: item.Details,
        });

        // Update progress
        setProgress(((i + 1) / totalItems) * 100);
      }

      setSuccessMessage("Country data pushed successfully!");
    } catch (error) {
      console.error("Error pushing country data:", error);
      setSuccessMessage("Failed to push country data");
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
          Push Country Data
        </Button>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent aria-describedby="dialog-description">
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PushCountriesData;
