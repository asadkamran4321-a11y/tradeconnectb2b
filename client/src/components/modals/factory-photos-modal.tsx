import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  ZoomIn, 
  Factory,
  X
} from "lucide-react";

interface FactoryPhotosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: string[];
  companyName: string;
}

export default function FactoryPhotosModal({ 
  open, 
  onOpenChange, 
  photos, 
  companyName 
}: FactoryPhotosModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showLargeView, setShowLargeView] = useState(false);

  if (!photos || photos.length === 0) return null;

  const currentPhoto = photos[selectedIndex];

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handleDownload = (photoUrl: string, index: number) => {
    // Use direct anchor link to avoid CORS issues
    const a = document.createElement('a');
    a.href = photoUrl;
    a.download = `${companyName}_factory_photo_${index + 1}.jpg`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      {/* Main Gallery Modal */}
      <Dialog open={open && !showLargeView} onOpenChange={(isOpen) => {
        if (!isOpen) {
          onOpenChange(false);
          setSelectedIndex(0);
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="modal-factory-title">
              <Factory className="h-6 w-6 text-primary" />
              {companyName} - Factory & Facilities ({photos.length} Photos)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Main Photo Display */}
            <div className="relative">
              <Card>
                <CardContent className="p-4">
                  <div className="relative group">
                    <img
                      src={currentPhoto}
                      alt={`Factory photo ${selectedIndex + 1}`}
                      className="w-full h-[400px] object-cover rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
                      onClick={() => setShowLargeView(true)}
                      data-testid={`img-factory-main-${selectedIndex}`}
                    />
                    
                    {/* Overlay Controls */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        onClick={() => setShowLargeView(true)}
                        className="bg-white text-black hover:bg-gray-100"
                        data-testid="button-zoom-main"
                      >
                        <ZoomIn className="h-4 w-4 mr-2" />
                        View Full Size
                      </Button>
                    </div>

                    {/* Navigation Arrows */}
                    {photos.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                          onClick={handlePrevious}
                          data-testid="button-previous-photo"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                          onClick={handleNext}
                          data-testid="button-next-photo"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {/* Photo Counter */}
                    <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm" data-testid="text-photo-counter">
                      {selectedIndex + 1} / {photos.length}
                    </div>

                    {/* Download Button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute bottom-4 right-4 bg-black/70 text-white hover:bg-black/80"
                      onClick={() => handleDownload(currentPhoto, selectedIndex)}
                      data-testid="button-download-current"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Thumbnail Strip */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 cursor-pointer rounded-lg border-2 transition-all ${
                      index === selectedIndex 
                        ? 'border-primary shadow-lg scale-105' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedIndex(index)}
                    data-testid={`thumbnail-factory-${index}`}
                  >
                    <img
                      src={photo}
                      alt={`Factory thumbnail ${index + 1}`}
                      className="w-20 h-16 object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Size View Modal */}
      <Dialog open={showLargeView} onOpenChange={setShowLargeView}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black">
          <div className="relative w-full h-[95vh] flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={() => setShowLargeView(false)}
              data-testid="button-close-fullsize"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Full Size Image */}
            <img
              src={currentPhoto}
              alt={`Factory photo ${selectedIndex + 1} - Full Size`}
              className="max-w-full max-h-full object-contain"
              data-testid="img-factory-fullsize"
            />

            {/* Navigation Controls for Full Size */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                  onClick={handlePrevious}
                  data-testid="button-previous-fullsize"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                  onClick={handleNext}
                  data-testid="button-next-fullsize"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Bottom Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/70 rounded-full px-4 py-2">
              <span className="text-white text-sm" data-testid="text-fullsize-counter">
                {selectedIndex + 1} / {photos.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => handleDownload(currentPhoto, selectedIndex)}
                data-testid="button-download-fullsize"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}