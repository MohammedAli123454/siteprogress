"use client";

import { uploadFiles } from "@/app/actions/uploadFile";  // Adjust import as needed
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AiOutlineClose, AiOutlineFilePdf } from "react-icons/ai";  // Icons

// Define the type for form data
interface FormData {
  projectName: string;
}

export default function FileUploader() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Pass the FormData type to useForm
  const { register, handleSubmit, reset } = useForm<FormData>();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;  // Extract files from the event
  
    if (files) {
      // Ensure files is not null before using it
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
      // Create a FormData object to send files and projectName
      const formData = new FormData();

      // Append projectName to formData
      formData.append("projectName", data.projectName);

      // Append each file to formData
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      // Call your server action to upload files
      const urls = await uploadFiles(formData);  // Pass the formData object
      console.log("Uploaded files:", urls);
      reset();
    } else {
      alert("Please select at least one file.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 bg-gray-100 rounded-lg shadow-lg">
      {/* Project Name Field */}
      <div className="mb-4">
        <label className="block text-lg font-semibold mb-2">Project Name</label>
        <input
          type="text"
          {...register("projectName", { required: true })}
          className="border border-gray-300 p-3 rounded w-full"
          placeholder="Enter project name"
        />
      </div>

      {/* File Input Field */}
      <div className="mb-4">
        <label className="block text-lg font-semibold mb-2">Select Files</label>
        <input
          type="file"
          onChange={onFileChange}
          multiple
          className="hidden"
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className="cursor-pointer inline-block bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
        >
          Choose Files
        </label>
      </div>

      {/* Selected Files Grid */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Selected Files:</h3>
          <div className="grid grid-cols-2 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
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

          {/* Remove All Files Button */}
          <button
            type="button"
            onClick={handleRemoveAllFiles}
            className="text-red-500 hover:text-red-700 mt-4"
          >
            Remove All Files
          </button>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600"
      >
        Upload Files
      </button>
    </form>
  );
}
