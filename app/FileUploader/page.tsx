"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { AiOutlineClose, AiOutlineFilePdf } from "react-icons/ai";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getallAwardedMocs } from "@/app/actions-Database/getData";
import { useQuery } from "@tanstack/react-query";
import { uploadFiles } from "@/app/actions/uploadFile";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface FormData {
  projectName: string;
  category: string;
}

const fetchMocNames = async () => {
  const names = await getallAwardedMocs();
  return names.map((name: { mocName: string }) => name.mocName);
};

export default function FileUploader() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  
  const { data: mocNames, isLoading: loadingMocs } = useQuery({
    queryKey: ["mocNames"],
    queryFn: fetchMocNames,
    staleTime: 5 * 60 * 1000,
  });

  const formMethods = useForm<FormData>();
  const { handleSubmit, reset, setValue } = formMethods;
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setSelectedFiles(prevFiles => [...prevFiles, ...files]);
  };

  const removeFile = (fileToRemove: File) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
  };

  const removeAllFiles = () => setSelectedFiles([]);

  const onSubmit = async (data: FormData) => {
    if (selectedFiles.length === 0) {
      setDialogMessage("Please select at least one file.");
      setDialogOpen(true);
      return;
    }

    if (!data.projectName) {
      setDialogMessage("Please select a project.");
      setDialogOpen(true);
      return;
    }

    if (!data.category) {
      setDialogMessage("Please select a drawing category.");
      setDialogOpen(true);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const totalFiles = selectedFiles.length;
    let uploadedCount = 0;

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("projectName", data.projectName);
      formData.append("category", data.category);
      formData.append("files", file);

      await uploadFiles(formData);

      uploadedCount += 1;
      setUploadProgress((uploadedCount / totalFiles) * 100);
    }

    setIsUploading(false);
    // Ensure that the success message shows up after all files have been uploaded
    setDialogMessage("All selected files uploaded successfully!");
    setDialogOpen(true);

    // Reset form and selected files after the upload completes
    reset();
    setSelectedFiles([]);
        // Clear the Select fields
        setValue('projectName', '');
        setValue('category', '');
  };

  return (
    <div className="flex gap-8 w-full mt-12 h-[calc(100vh-80px)] justify-center items-start">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <p>{dialogMessage}</p>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* First Card: Upload Form */}
      <Card className="w-[45%] shadow-lg border border-gray-200 rounded-lg flex flex-col">
        <CardContent>
          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Project Name */}
              <div>
                <label className="block text-lg font-medium text-gray-600 mb-2">Project Name</label>
                <Select onValueChange={(value) => setValue("projectName", value)} disabled={loadingMocs}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {mocNames?.map((projectName: string) => (
                      <SelectItem key={projectName} value={projectName}>
                        {projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Drawing Category */}
              <div>
                <label className="block text-lg font-medium text-gray-600 mb-2">Drawing Category</label>
                <Select onValueChange={(value) => setValue("category", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P&I Drawings">P&I Drawings</SelectItem>
                    <SelectItem value="Isometric Drawings">Isometric Drawings</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-lg font-medium text-gray-600 mb-2">Select Files to Upload</label>
                <input type="file" onChange={handleFileChange} multiple className="hidden" id="file-input" />
                <label
                  htmlFor="file-input"
                  className="cursor-pointer flex flex-col items-center justify-center bg-blue-100 border-4 border-dotted border-blue-500 text-blue-600 p-8 rounded-lg hover:bg-blue-200 transition-all duration-300"
                  style={{ width: "100%", height: "200px" }}
                >
                  <div className="text-center">
                    <span className="block text-2xl font-semibold mb-2">Click to Upload</span>
                    <span className="block text-sm">or drag and drop files here</span>
                  </div>
                </label>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div>
                  <label className="block text-lg font-medium text-gray-600 mb-2">Upload Progress</label>
                  <div className="flex items-center">
                    <Progress value={uploadProgress} className="flex-1" />
                    <span className="ml-2 text-gray-700">{Math.round(uploadProgress)}%</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-all duration-300"
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Upload Files"}
              </button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>

      {/* Second Card: Selected Files */}
      <Card className="w-[45%] shadow-lg border border-gray-200 rounded-lg flex flex-col">
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[300px] overflow-auto">
            {selectedFiles.length > 0 ? (
              <div className="space-y-4 p-6">
                <h3 className="font-medium text-lg text-gray-600">Selected Files:</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border border-gray-300 rounded-md shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <AiOutlineFilePdf className="text-red-500 text-2xl" />
                        <span className="font-medium text-sm text-gray-800">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <AiOutlineClose />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-gray-500">No files selected</div>
            )}
          </ScrollArea>
        </CardContent>

        {/* Remove All Button */}
        {selectedFiles.length > 0 && (
          <CardFooter className="p-4">
            <button
              type="button"
              onClick={removeAllFiles}
              className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition-all duration-300"
            >
              Remove All Files
            </button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}


