import React from "react";

const LoadingSpinner = ({ fullScreen = false }) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <div className="text-sm font-semibold text-primary animate-pulse">Đang tải dữ liệu...</div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f9f9ff]">
        {spinner}
      </div>
    );
  }

  return (
    <div className="w-full py-12 flex items-center justify-center">
      {spinner}
    </div>
  );
};

export default LoadingSpinner;
