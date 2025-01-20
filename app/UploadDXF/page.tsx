"use client";

import { useState } from 'react';

// Helper function to parse DXF content
async function parseDXF(fileContent: string): Promise<Record<string, string[]>> {
  try {
    const lines = fileContent.split('\n');
    const sections: Record<string, string[]> = {};

    let currentSection: string | null = null;
    let currentContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === '0') {
        const nextLine = lines[i + 1]?.trim();

        if (nextLine === 'SECTION') {
          if (currentSection) {
            sections[currentSection] = currentContent;
          }
          currentSection = lines[i + 2]?.trim();
          currentContent = [];
          i += 2;
        } else if (nextLine === 'ENDSEC') {
          if (currentSection) {
            sections[currentSection] = currentContent;
          }
          currentSection = null;
          currentContent = [];
          i++;
        } else {
          currentContent.push(nextLine);
        }
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    return sections;
  } catch (error) {
    console.error('Error parsing DXF file:', error);
    throw error;
  }
}

export default function UploadDXF() {
  const [parsedData, setParsedData] = useState<Record<string, string[]> | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const parsed = await parseDXF(content);
        setParsedData(parsed);
      };

      reader.readAsText(file);
    }
  };

  return (
    <div>
      <h1>Upload and Parse DXF File</h1>
      <input type="file" accept=".dxf" onChange={handleFileUpload} />

      {parsedData && (
        <div>
          <h2>Parsed DXF Sections</h2>
          {Object.entries(parsedData).map(([section, content]) => (
            <div key={section}>
              <h3>{section}</h3>
              <pre>{JSON.stringify(content, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
