"use client";
import { useEffect, useState } from "react";
import { getUniqueProjectNames, getFilesByProjectName } from "@/app/actions-Database/getData";
import { AiOutlineClose, AiOutlineFilePdf } from "react-icons/ai";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function FileGetter() {
  const [projectNames, setProjectNames] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [files, setFiles] = useState<{ url: string, fileName: string }[]>([]);  // Updated to store both url and fileName
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch unique project names on component mount
  useEffect(() => {
    const loadProjectNames = async () => {
      setLoading(true);  // Start loading
      try {
        const names = await getUniqueProjectNames();
        const projectNamesArray = names.map((name: { project_name: string }) => name.project_name);  // Extract project_name
        setProjectNames(projectNamesArray);
      } catch (error) {
        console.error("Failed to load project names:", error);
        setError("Error fetching project names.");
      } finally {
        setLoading(false);  // End loading
      }
    };
    loadProjectNames();
  }, []);

  // Handle project selection
  const handleProjectChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const projectName = event.target.value;
    setSelectedProject(projectName);
    setFiles([]);
    setError(null);
    
    if (projectName) {
      setLoading(true);  // Set loading state when fetching files
      try {
        const retrievedFiles = await getFilesByProjectName(projectName);
        setFiles(retrievedFiles);  // No need to map, as retrievedFiles already contains url and fileName
      } catch (error) {
        console.error("Failed to load files:", error);
        setError("Error fetching files for the selected project.");
      } finally {
        setLoading(false);  // Stop loading
      }
    }
  };

  return (
    <div>
      {/* Show loading message */}
      {loading && <p>Loading...</p>}
      
      {/* Show error if exists */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Project name dropdown */}
      <select onChange={handleProjectChange} defaultValue="" disabled={loading || projectNames.length === 0}>
        <option value="" disabled>Select a project</option>
        {projectNames.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      {/* Show selected project files */}
      {selectedProject && (
        <Card className="shadow-md rounded-lg overflow-hidden">
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2">Files for {selectedProject}</h3>
            <ScrollArea className="h-full max-h-[400px] overflow-auto"> {/* Ensure overflow auto is set */}
              <div className="overflow-y-auto h-full"> {/* Ensure this container can scroll */}
                <ul className="grid grid-cols-3 gap-4">
                  {files.length === 0 ? (
                    <li>No files found.</li>
                  ) : (
                    files.map(({ url, fileName }) => (
                      <li key={url} className="bg-white p-4 rounded-lg shadow flex items-center">
                        <div className="flex items-center">
                          <AiOutlineFilePdf className="text-red-500 text-xl mr-2" />
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {fileName} {/* Show fileName instead of url */}
                          </a>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


