"use client";

import { uploadFiles } from "@/app/actions/uploadFile";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AiOutlineClose, AiOutlineFilePdf } from "react-icons/ai";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast"; // Assuming ShadCN has toast utility

interface FormData {
  projectName: string;
}

export default function FileUploader() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, reset } = useForm<FormData>();
  const { toast } = useToast();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles((prevFiles) => [...prevFiles, ...Array.from(files)]);
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
  };

  const handleRemoveAllFiles = () => {
    setSelectedFiles([]);
  };

  const onSubmit = async (data: FormData) => {
    if (selectedFiles.length > 0) {
      setIsUploading(true);
      setUploadProgress(0);

      const totalFiles = selectedFiles.length;
      let uploadedCount = 0;

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("projectName", data.projectName);
        formData.append("files", file);

        await uploadFiles(formData);

        uploadedCount += 1;
        setUploadProgress((uploadedCount / totalFiles) * 100);
      }

      toast({
        title: "Success",
        description: "All Selected Files Uploaded Successfully",
      });

      reset();
      setIsUploading(false);
      setSelectedFiles([]);
    } else {
      alert("Please select at least one file.");
    }
  };

  return (
    <div className="flex gap-4 w-full mt-8 h-[calc(100vh-50px)]">
      {/* First Card: Upload Form */}
      <Card className="w-1/2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl">Upload Files</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="mb-4">
              <label className="block text-lg font-semibold mb-2">Project Name</label>
              <input
                type="text"
                {...register("projectName", { required: true })}
                className="border border-gray-300 p-3 rounded w-full"
                placeholder="Enter project name"
              />
            </div>

            <div className="mb-4">
              <label className="block text-lg font-semibold mb-2">Select Files to Upload</label>
              <input
                type="file"
                onChange={onFileChange}
                multiple
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="cursor-pointer flex items-center justify-center bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700"
                style={{ width: '200px', height: '200px' }}
              >
                Select Files
              </label>
            </div>

            {isUploading && (
              <div className="mb-4">
                <label className="block text-lg font-semibold mb-2">Upload Progress</label>
                <Progress value={uploadProgress} />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Files"}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Second Card: Selected Files in Scroll Area */}
      <Card className="w-1/2 shadow-lg flex flex-col">
        <CardHeader>
          <CardTitle className="text-center text-xl">Selected Files</CardTitle>
        </CardHeader>

        {/* CardContent should take remaining height and allow scrolling */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full max-h-[calc(100vh-240px)]">
            {selectedFiles.length > 0 ? (
              <div className="space-y-2 p-4">
                <h3 className="font-semibold text-lg">Selected Files:</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-lg shadow flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        {file.type === "application/pdf" && (
                          <AiOutlineFilePdf className="text-red-500 text-xl mr-2" />
                        )}
                        <span>{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <AiOutlineClose className="text-xl" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="p-4">No files selected yet.</p>
            )}
          </ScrollArea>
        </CardContent>

        {/* Conditionally show footer if files are selected */}
        {selectedFiles.length > 0 && (
          <CardFooter className="p-4 flex justify-center">
            <button
              type="button"
              onClick={handleRemoveAllFiles}
              className="text-red-500 hover:text-red-700"
            >
              Remove All Selected Files
            </button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
