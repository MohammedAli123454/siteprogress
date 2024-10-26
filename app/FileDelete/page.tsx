"use client";

import { AiOutlineFilePdf } from "react-icons/ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUniqueProjectNames, getFilesByProjectName } from "@/app/actions-Database/getData";
import { deleteFile } from "@/app/actions/uploadFile"; 
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress"; 
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";

const fetchUniqueProjectNames = async () => {
  const names = await getUniqueProjectNames();
  return names.map((name: { project_name: string }) => name.project_name);
};

const fetchFilesForSelectedProject = async (projectName: string, category: string) => {
  const allFiles = await getFilesByProjectName(projectName, category);
  return allFiles; 
};

export default function FileDelete() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFileUrls, setSelectedFileUrls] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [allFiles, setAllFiles] = useState<{ id: string; url: string; fileName: string }[]>([]);
  const [deletionProgress, setDeletionProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [showFilesCard, setShowFilesCard] = useState(false); // Control visibility of the allFiles card

  const { data: projectNames, isLoading: loadingProjects, error: projectError } = useQuery({
    queryKey: ["uniqueProjectNames"],
    queryFn: fetchUniqueProjectNames,
    staleTime: 5 * 60 * 1000,
  });

  const handleProjectChange = (projectName: string) => {
    setSelectedProject(projectName);
    setSelectedFileUrls([]);
    setSelectAll(false);
    setAllFiles([]); 
  };

  const handleCategoryChange = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSelectedFileUrls([]);
    setSelectAll(false);
  };

  const handleFetchFiles = async () => {
    if (!selectedProject) {
      openDialog("Please select a project.");
      return;
    }

    if (!selectedCategory) {
      openDialog("Please select a category.");
      return;
    }

    setLoadingFiles(true);
    const fetchedFiles = await fetchFilesForSelectedProject(selectedProject, selectedCategory);
    const formattedFiles = fetchedFiles.map((file: { url: string; fileName: string, category: string }) => ({
      id: generateUniqueId(),
      url: file.url,
      fileName: file.fileName,
      category: file.category,
    }));
    setAllFiles(formattedFiles);
    setLoadingFiles(false);
    setShowFilesCard(true); // Show allFiles card and hide the first card
  };

  const handleSelectFile = (fileUrl: string) => {
    setSelectedFileUrls((prevSelected) =>
      prevSelected.includes(fileUrl) ? prevSelected.filter((url) => url !== fileUrl) : [...prevSelected, fileUrl]
    );
  };

  const handleSelectAll = () => {
    setSelectAll((prev) => !prev);
    setSelectedFileUrls(selectAll ? [] : allFiles.map((file) => file.url));
  };

  const handleDeleteFiles = async () => {
    if (selectedFileUrls.length > 0) {
      setIsDeleting(true);
      setDeletionProgress(0);

      const totalFiles = selectedFileUrls.length;
      let deletedCount = 0;

      for (const fileUrl of selectedFileUrls) {
        await deleteFile(fileUrl);
        deletedCount += 1;
        setDeletionProgress((deletedCount / totalFiles) * 100);
      }
      openDialog("All selected allFiles deleted successfully!");
 

      const remainingFiles = allFiles.filter(file => !selectedFileUrls.includes(file.url));
      setAllFiles(remainingFiles);
      setSelectedFileUrls([]);
      setSelectAll(false);
      setIsDeleting(false);
      setDeletionProgress(0); 
    }
  };


  const openDialog = (message: string) => {
    setDialogMessage(message);
    setDialogOpen(true);
  };

  const handleCancel = () => {
    setSelectedProject(null);
    setAllFiles([]);
    setSelectedFileUrls([]);
    setShowFilesCard(false); // Show the first card again on cancel
  };

  if (loadingProjects || loadingFiles) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderCircle className="animate-spin" color="blue" size={48} />
      </div>
    );
  }

  if (projectError) {
    return <p className="text-red-500">Error: {projectError.message}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-2 max-w-6xl mx-auto mt-1">

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message</DialogTitle>
          </DialogHeader>
          <p>{dialogMessage}</p>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!showFilesCard && (
        <Card className="shadow-md rounded-lg">
          <CardHeader className="p-2 bg-gray-100 border-b"> {/* Reduced height */}
            <CardTitle className="text-lg font-semibold w-full">Select Project and Drawing Category</CardTitle> {/* Extended width */}
          </CardHeader>
          <CardContent className="p-6">
            {/* Project Selection */}
            <label className="block text-lg font-medium text-gray-600 mb-2">Select Project</label>
            <Select onValueChange={handleProjectChange} disabled={loadingProjects}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projectNames?.map((projectName) => (
                  <SelectItem key={projectName} value={projectName}>
                    {projectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
     
            {/* Drawing Category Selection */}
            <div className="mt-4">
              <label className="block text-lg font-medium text-gray-600 mb-2">Drawing Category</label>
              <Select onValueChange={handleCategoryChange} disabled={loadingProjects}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P&I Drawings">P&I Drawings</SelectItem>
                  <SelectItem value="Isometric Drawings">Isometric Drawings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4">
              <Button onClick={handleFetchFiles} disabled={!selectedCategory || loadingFiles}>
                OK to Show Files
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showFilesCard && (
        <Card className="shadow-md rounded-lg flex flex-col w-full h-full">
          <CardHeader className="p-2 bg-gray-100 border-b"> {/* Reduced height */}
            <CardTitle className="text-xl font-normal w-full">{selectedProject} - {selectedCategory}</CardTitle> {/* Extended width */}
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full max-h-[calc(100vh-240px)]">
              <div className="space-y-2 p-4">
                {isDeleting && (
                  <div>
                    <label className="block text-lg font-medium text-gray-600 mb-2">Deletion Progress</label>
                    <Progress value={deletionProgress} />
                    <span className="ml-2 text-gray-700">{Math.round(deletionProgress)}%</span>
                  </div>
                )}
                {allFiles.length === 0 ? (
                  <p className="text-gray-500">No allFiles found.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2 col-span-full">
                      <Checkbox id="selectAll" checked={selectAll} onCheckedChange={handleSelectAll} />
                      <label htmlFor="selectAll" className="text-lg font-medium text-gray-600">
                        Select All
                      </label>
                    </div>
                    {allFiles.map((file) => (
                      <div key={file.id} className="border p-2 rounded-md flex items-center space-x-2">
                        <Checkbox
                          id={file.id}
                          checked={selectedFileUrls.includes(file.url)}
                          onCheckedChange={() => handleSelectFile(file.url)}
                        />
                        <label htmlFor={file.id} className="text-md text-gray-700 flex items-center">
                          <AiOutlineFilePdf size={20} className="text-red-600 mr-2" />
                          {file.fileName}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <div className="p-4 border-t"> {/* Card footer for buttons */}
            <Button
              onClick={handleDeleteFiles}
              disabled={selectedFileUrls.length === 0 || isDeleting}
              variant="destructive"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
            <Button onClick={handleCancel} variant="outline" className="ml-2">
              Cancel
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function generateUniqueId() {
  return `_${Math.random().toString(36).substr(2, 9)}`;
}