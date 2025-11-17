import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Factory,
  X
} from "lucide-react";

interface AdminFactoryPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  photosUrl: string;
  companyName: string;
}

export default function AdminFactoryPhotosModal({ 
  isOpen, 
  onClose, 
  photosUrl, 
  companyName 
}: AdminFactoryPhotosModalProps) {
  const [photos, setPhotos] = useState<{url: string, caption: string}[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !photosUrl) return;
    
    fetch(photosUrl)
      .then(response => response.json())
      .then(data => {
        setPhotos(data || []);
        setLoading(false);
      })
      .catch(() => {
        setPhotos([]);
        setLoading(false);
      });
  }, [isOpen, photosUrl]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              {companyName} - Factory Photos
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <p>Loading photos...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (photos.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              {companyName} - Factory Photos
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <p>No factory photos available</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentPhoto = photos[selectedIndex];

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            {companyName} - Factory Photos
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Photo Counter */}
          <div className="text-center text-sm text-gray-500">
            Photo {selectedIndex + 1} of {photos.length}
          </div>

          {/* Main Photo */}
          <div className="relative bg-gray-50 rounded-lg border min-h-[400px] flex items-center justify-center">
            <img
              src={currentPhoto.url}
              alt={currentPhoto.caption}
              className="max-w-full max-h-[50vh] object-contain rounded"
              data-testid="img-factory-photo"
            />
            
            {/* Navigation Arrows */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  onClick={handlePrevious}
                  data-testid="button-previous-photo"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  onClick={handleNext}
                  data-testid="button-next-photo"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Photo Caption */}
          {currentPhoto.caption && (
            <div className="text-center">
              <p className="text-gray-700 font-medium">{currentPhoto.caption}</p>
            </div>
          )}

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-2">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                    index === selectedIndex ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  data-testid={`thumbnail-${index}`}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}