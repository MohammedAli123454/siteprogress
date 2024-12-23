"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { AiOutlineClose, AiOutlineFilePdf } from "react-icons/ai";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getallAwardedMocs } from "@/app/actions-Database/getData";
import { useQuery } from "@tanstack/react-query";
import { uploadFiles } from "@/app/actions/uploadFile";

interface FormData {
  projectName: string;
  category: string;
}

const fetchMocNames = async () => {
  const names = await getallAwardedMocs();
  return names.map((name: { mocName: string }) => name.mocName);
};

export default function FileUploader() {
  const [selectedFiles, setSelectedFiles] = useState<Set<File>>(new Set());
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(false);

  const { data: mocNames, isLoading: loadingMocs, refetch } = useQuery({
    queryKey: ["mocNames"],
    queryFn: fetchMocNames,
    staleTime: 5 * 60 * 1000,
  });

  const formMethods = useForm<FormData>();
  const { handleSubmit, reset, setValue } = formMethods;
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = new Set([...selectedFiles, ...Array.from(e.target.files || [])]);
    setSelectedFiles(files);
  };

  const handleProjectChange = (value: string) => {
    setValue("projectName", value);
    // Clear the error message if the project is selected
    if (dialogMessage === "Please select a project.") {
      setDialogMessage("");
    }
  };
  
  const handleCategoryChange = (value: string) => {
    setValue("category", value);
    // Clear the error message if the category is selected
    if (dialogMessage === "Please select a drawing category.") {
      setDialogMessage("");
    }
  };

  const removeFile = (fileToRemove: File) => {
    setSelectedFiles(prevFiles => new Set([...prevFiles].filter(file => file !== fileToRemove)));
  };

  const removeAllFiles = () => setSelectedFiles(new Set());

  const onSubmit = async (data: FormData) => {
    if (selectedFiles.size === 0) {
      setDialogMessage("Please select at least one file.");

      return;
    }

    if (!data.projectName) {
      setDialogMessage("Please select a project.");

      return;
    }

    if (!data.category) {
      setDialogMessage("Please select a drawing category.");

      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const totalFiles = selectedFiles.size;
    let uploadedCount = 0;

    console.log(selectedFiles);

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
    setSuccessMessage(true);
    reset();
    setSelectedFiles(new Set());
    setValue('projectName', '');
    setValue('category', '');
    refetch();
  };

  return (
    <div className="w-full h-screen flex justify-center items-center bg-gray-50">
      <div className="min-w-full h-full bg-white shadow-lg rounded-lg p-6">
        {/* Success Message */}
        {successMessage && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
            <div className="bg-green-100 text-green-700 p-6 rounded-lg shadow-md flex items-center space-x-4">
              <span className="flex-1 text-lg font-medium">Drawings have been saved successfully!</span>
              <button
                className="ml-2 text-green-700 hover:text-green-900"
                onClick={() => setSuccessMessage(false)}
              >
                <AiOutlineClose />
              </button>
            </div>
          </div>
        )}

         {/* Error Message */}
      {dialogMessage && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 text-center">
          {dialogMessage}
        </div>
      )}

        {/* Component Heading */}
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Upload the Project Drawing</h1>

        <FormProvider {...formMethods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Layout: Left side (Project Name, Drawing Category) & Right side (File Upload) */}
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column: Project Name & Drawing Category */}
              <div className="col-span-8">
                <Card className="h-full flex items-center justify-center p-0">
                  <CardContent className="flex flex-col justify-center items-center w-full h-full p-6">
                    <div className="space-y-6 w-full">
                      {/* Project Name */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <label className="col-span-3 text-lg font-medium text-gray-600">Project Name</label>
                        <div className="col-span-9">
                        <Select
                          onValueChange={handleProjectChange}  // Use the handler to clear message on selection
                          disabled={loadingMocs}
                        >
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
                      </div>

                      {/* Drawing Category */}
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-3 text-lg font-medium text-gray-600">Drawing Category</label>
                        <div className="col-span-9">
                        <Select onValueChange={handleCategoryChange}>  {/* Use the handler here as well */}
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="P&I Drawings">P&I Drawings</SelectItem>
                            <SelectItem value="Isometric Drawings">Isometric Drawings</SelectItem>
                          </SelectContent>
                        </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: File Upload */}
              <div className="col-span-4">
                <Card className="h-full flex items-center justify-center p-0">
                  <CardContent className="flex justify-center items-center w-full h-full p-6">
                    <div className="flex flex-col items-center justify-center h-full w-full">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        multiple
                        className="hidden"
                        id="file-input"
                      />
                      <label
                        htmlFor="file-input"
                        className="cursor-pointer flex flex-col items-center justify-center bg-blue-100 border-4 border-dotted border-blue-500 text-blue-600 p-8 rounded-lg hover:bg-blue-200 transition-all duration-300 w-full"
                      >
                        <div className="text-center">
                          <span className="block text-2xl font-semibold mb-2">Select Files To</span>
                          <span className="block text-sm">or drag and drop files here</span>
                        </div>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Selected Files Section (Spans the entire width) */}
            <Card className="w-full mt-6">
              <CardContent className="p-6">
                <div className="h-[300px] overflow-auto">
                  {selectedFiles.size > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg text-gray-600">Selected Files:</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[...selectedFiles].map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 border border-gray-300 rounded-md shadow-sm"
                          >
                            <div className="flex items-center space-x-3">
                              <AiOutlineFilePdf className="text-red-500 text-2xl" />
                              <div>
                                <p className="text-gray-800 font-medium">{file.name}</p>
                                <p className="text-gray-500 text-sm">{(file.size / 1024).toFixed(2)} KB</p>
                              </div>
                            </div>
                            <AiOutlineClose
                              className="text-red-600 cursor-pointer hover:text-red-800"
                              onClick={() => removeFile(file)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full text-gray-500">
                      No files selected.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upload Progress */}
            {isUploading && (
              <div className="grid grid-cols-12 gap-4 items-center">
                <label className="col-span-3 text-lg font-medium text-gray-600">Upload Progress</label>
                <div className="col-span-9 flex items-center">
                  <Progress value={uploadProgress} className="flex-1" />
                  <span className="ml-2 text-gray-700">{Math.round(uploadProgress)}%</span>
                </div>
              </div>
            )}

            {/* Buttons (Remove All and Upload Files) */}
            <div className="flex justify-between mt-6">
              {selectedFiles.size > 0 && (
                <div className="flex space-x-4">
                  <button
                    type="button"
                    className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
                    onClick={removeAllFiles}
                  >
                    Remove All
                  </button>

                  <button
                    type="submit"
                    className="bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-all duration-300"
                    disabled={isUploading}
                  >
                    {isUploading ? "Uploading..." : "Upload Files"}
                  </button>
                </div>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}




