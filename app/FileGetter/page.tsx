"use client";
import { AiOutlineFilePdf } from "react-icons/ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUniqueProjectNames, getFilesByProjectName } from "@/app/actions-Database/getData";

// Fetch unique project names
const fetchUniqueProjectNames = async () => {
  const names = await getUniqueProjectNames();
  return names.map((name: { project_name: string }) => name.project_name);
};

// Fetch files by project name
const fetchFilesByProjectName = async (projectName: string) => {
  const files = await getFilesByProjectName(projectName);
  return files;
};

export default function FileGetter() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const { data: projectNames, isLoading: loadingProjects, error: projectError } = useQuery({
    queryKey: ["uniqueProjectNames"],
    queryFn: fetchUniqueProjectNames,
    staleTime: 5 * 60 * 1000,
  });

  const { data: files = [], isLoading: loadingFiles, error: fileError } = useQuery({
    queryKey: ["filesByProjectName", selectedProject],
    queryFn: () => fetchFilesByProjectName(selectedProject!),
    enabled: !!selectedProject,
    staleTime: 5 * 60 * 1000,
  });

  const handleProjectChange = (projectName: string) => {
    setSelectedProject(projectName);
  };

  if (loadingProjects || loadingFiles) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderCircle className="animate-spin" color="blue" size={48} />
      </div>
    );
  }

  if (projectError || fileError) {
    return <p className="text-red-500">Error: {projectError?.message || fileError?.message}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-2 max-w-6xl mx-auto mt-1">
      {/* Project Selection Card */}
      <Card className="shadow-md rounded-lg">
        <CardHeader className="p-4 bg-gray-100 border-b">
          <CardTitle className="text-lg font-semibold">Select Project</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Select onValueChange={handleProjectChange} disabled={loadingProjects}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projectNames?.map((projectName: string) => (
                <SelectItem key={projectName} value={projectName}>
                  {projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Files Display Card */}
      {selectedProject && (
        <Card className="shadow-md rounded-lg flex flex-col">
          <CardHeader className="p-4 bg-gray-100 border-b">
            <CardTitle className="text-lg font-semibold">Files for {selectedProject}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full max-h-[calc(100vh-240px)]">
              <div className="space-y-2 p-4">
                {files.length === 0 ? (
                  <p className="text-gray-500">No files found.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {files.map(({ url, fileName }: { url: string; fileName: string }, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg shadow flex items-center">
                        <AiOutlineFilePdf className="text-red-500 text-xl mr-2" />
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {fileName}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
