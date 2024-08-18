"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"

  
  
  const ProjectDescription = () => {
    const [showAccordion, setShowAccordion] = useState(true);
  
    const projectDetails = {
      projectDescription: {
        pipingScopeOfWorks: [
          "Replacing of existing standard manual globe valves with heavy duty valves to meet process requirements on the common spillback line of the first and second stages of the makeup compressors.",
          "Installation of 8x6” reducer and trimming the existing pipe to accommodate the new 6” globe valve.",
          "Scaffolding works to be performed by trained and certified scaffolders with all certification.",
          "Demolished valves to be removed and transported to designated area.",
          "Provide certified tools/lifting equipment as per the requirement with approved lifting plan for removal and erection of the valve.",
          "Bolt torqueing and bolt tightening to be done as per reference drawing and procedures."
        ]
      },
      preShutdownActivitiesMechanical: [
        "Shifting of new valves, pipes, and scaffolding materials to the specified location and storing them properly.",
        "Complete the scaffolding activity on the 02 locations where valve replacements are to be done."
      ],
      shutdownActivitiesMechanical: [
        "After degasifying the line and obtaining necessary work permits, valve de-bolting will be done and existing valve will be removed. Cold cutting of existing pipe joint to be done.",
        "Install new 8x6” reducer and trim the existing pipe to accommodate the new 6” manual globe valve, ensuring flange faces are matched.",
        "Fit-up and welding of field joints, bolting of flanged joints to be completed, and RT for field joints to be done. After bolt tightening and QC clearance, the line is to be offered for mechanical clearance.",
        "After successful completion of mechanical clearance, the line is handed over to operations."
      ]
    };
  
    return (
      <div className="p-6 bg-gray-100">
        <div className="flex justify-end mb-4">
          <label className="mr-2">Show Accordion</label>
          <Switch checked={showAccordion} onCheckedChange={setShowAccordion} />
        </div>
  
        {showAccordion ? (
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-xl font-bold">Project Description</AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent>
                    <h3 className="text-lg font-semibold mb-2">Piping Scope of Works:</h3>
                    <ul className="list-disc ml-6 text-base">
                      {projectDetails.projectDescription.pipingScopeOfWorks.map((item, index) => (
                        <li key={index} className="mb-2">{item}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
  
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-xl font-bold">Pre-Shutdown Activities – Mechanical</AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent>
                    <ul className="list-disc ml-6 text-base">
                      {projectDetails.preShutdownActivitiesMechanical.map((item, index) => (
                        <li key={index} className="mb-2">{item}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
  
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-xl font-bold">Shutdown Activities – Mechanical</AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent>
                    <ul className="list-disc ml-6 text-base">
                      {projectDetails.shutdownActivitiesMechanical.map((item, index) => (
                        <li key={index} className="mb-2">{item}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">Project Description</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">Piping Scope of Works:</h3>
                <ul className="list-disc ml-6 text-base">
                  {projectDetails.projectDescription.pipingScopeOfWorks.map((item, index) => (
                    <li key={index} className="mb-2">{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
  
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">Pre-Shutdown Activities – Mechanical</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc ml-6 text-base">
                  {projectDetails.preShutdownActivitiesMechanical.map((item, index) => (
                    <li key={index} className="mb-2">{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
  
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">Shutdown Activities – Mechanical</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc ml-6 text-base">
                  {projectDetails.shutdownActivitiesMechanical.map((item, index) => (
                    <li key={index} className="mb-2">{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };
  
  export default ProjectDescription;