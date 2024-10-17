"use client";

import { uploadFiles } from "@/app/actions/uploadFile";  // Adjust import as needed
import { useState } from "react";
import { useForm } from "react-hook-form";

// Define the type for form data
interface FormData {
  projectName: string;
}

export default function FileUploader() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Pass the FormData type to useForm
  const { register, handleSubmit, reset } = useForm<FormData>();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
  };

  // Now the form data type matches with the submit handler
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Project Name Field */}
      <div>
        <label>Project Name</label>
        <input
          type="text"
          {...register("projectName", { required: true })}  // Now it's typed properly
          className="border border-gray-300 p-2 w-full"
          placeholder="Enter project name"
        />
      </div>

      {/* File Input Field */}
      <div>
        <label>Select Files</label>
        <input type="file" onChange={onFileChange} multiple className="border border-gray-300 p-2" />
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h3>Selected Files:</h3>
          <ul>
            {selectedFiles.map((file, index) => (
              <li key={index} className="flex justify-between items-center">
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Submit Button */}
      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        Upload Files
      </button>
    </form>
  );
}
