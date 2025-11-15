import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function FileUploader({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const onDrop = useCallback(async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      const fileData = {
        file,
        status: 'uploading',
        progress: 0,
        id: Date.now() + Math.random(),
      };

      setUploadedFiles((prev) => [...prev, fileData]);

      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/receipts/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.id === fileData.id ? { ...f, progress } : f
              )
            );
          },
        });

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? { ...f, status: 'success', receipt: response.data.receipt }
              : f
          )
        );

        if (onUploadSuccess) {
          onUploadSuccess(response.data.receipt);
        }
      } catch (error) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: 'error',
                  error: error.response?.data?.message || 'Upload failed',
                }
              : f
          )
        );
      } finally {
        setUploading(false);
      }
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const removeFile = (id) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag & drop receipt images here, or click to select'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Supports JPG, PNG, GIF, WebP (max 10MB)
        </p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((fileData) => (
            <div
              key={fileData.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1">
                <File className="h-5 w-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileData.file.name}
                  </p>
                  {fileData.status === 'uploading' && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${fileData.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Uploading... {fileData.progress}%
                      </p>
                    </div>
                  )}
                  {fileData.status === 'success' && (
                    <p className="text-xs text-green-600 mt-1">
                      Uploaded successfully - Processing...
                    </p>
                  )}
                  {fileData.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1">
                      {fileData.error}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {fileData.status === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                {fileData.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                {fileData.status !== 'uploading' && (
                  <button
                    onClick={() => removeFile(fileData.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
