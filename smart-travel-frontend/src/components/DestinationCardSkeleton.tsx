export default function DestinationCardSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300" />
      
      {/* Content skeleton */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        
        {/* Subtitle */}
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 bg-gray-200 rounded-lg" />
          <div className="h-20 bg-gray-200 rounded-lg" />
        </div>
        
        {/* Button */}
        <div className="h-10 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}
