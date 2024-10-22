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

interface FormData {
  projectName: string;
  category: string;
}

// Fetch unique project names
const fetchMocNames = async () => {
  const names = await getallAwardedMocs();
  return names.map((name: { mocName: string }) => name.mocName);
};

export default function FileUploader() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: mocNames, isLoading: loadingMocs, error: mocError } = useQuery({
    queryKey: ["mocNames"],
    queryFn: fetchMocNames,
    staleTime: 5 * 60 * 1000,
  });

  const formMethods = useForm<FormData>();
  const { handleSubmit, reset, setValue } = formMethods;
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      setSelectedFiles(prevFiles => [...prevFiles, ...files]);
    }
  };

  const removeFile = (fileToRemove: File) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
  };

  const removeAllFiles = () => setSelectedFiles([]);

  const onSubmit = async (data: FormData) => {
    if (selectedFiles.length === 0) {
      alert("Please select at least one file.");
      return;
    }
    if (!selectedCategory) {
      alert("Please select a drawing category.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const totalFiles = selectedFiles.length;
    let uploadedCount = 0;

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("projectName", data.projectName);
      formData.append("category", selectedCategory);
      formData.append("files", file);

      await uploadFiles(formData);

      uploadedCount += 1;
      setUploadProgress((uploadedCount / totalFiles) * 100);
    }

    toast({
      title: "Success",
      description: "All selected files uploaded successfully!",
    });

    reset();
    setIsUploading(false);
    setSelectedFiles([]);
  };

  const handleProjectChange = (value: string) => setValue("projectName", value);

  const handleCategoryChange = (value: string) => setSelectedCategory(value);

  return (
    <div className="flex gap-8 w-full mt-12 h-[calc(100vh-80px)] justify-center items-start">
      {/* First Card: Upload Form */}
      <Card className="w-[45%] shadow-lg border border-gray-200 rounded-lg flex flex-col">
        <CardContent>
          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Project Name */}
              <div>
                <label className="block text-lg font-medium text-gray-600 mb-2">Project Name</label>
                <Select onValueChange={handleProjectChange} disabled={loadingMocs}>
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
                <Select onValueChange={handleCategoryChange}>
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
                  <Progress value={uploadProgress} />
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
                      className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between transition-all hover:shadow-md"
                    >
                      <div className="flex items-center">
                        {file.type === "application/pdf" && (
                          <AiOutlineFilePdf className="text-red-500 text-xl mr-2" />
                        )}
                        <span>{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <AiOutlineClose className="text-xl" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="p-6 text-center text-gray-500">No files selected yet.</p>
            )}
          </ScrollArea>
        </CardContent>

        {selectedFiles.length > 0 && (
          <CardFooter className="p-6 flex justify-center">
            <button
              type="button"
              onClick={removeAllFiles}
              className="text-red-500 hover:text-red-700 font-semibold"
            >
              Remove All Selected Files
            </button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
