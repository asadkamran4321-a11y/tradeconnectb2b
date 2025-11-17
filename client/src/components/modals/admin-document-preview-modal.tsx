import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Eye, X, FileText } from "lucide-react";

interface AdminDocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  documentTitle: string;
  fileName: string;
}

export default function AdminDocumentPreviewModal({ 
  isOpen, 
  onClose, 
  documentUrl, 
  documentTitle, 
  fileName 
}: AdminDocumentPreviewModalProps) {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = documentUrl;
    a.download = fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenExternal = () => {
    window.open(documentUrl, '_blank', 'noopener,noreferrer');
  };

  const isImage = documentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {documentTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleDownload} data-testid="button-download">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={handleOpenExternal} data-testid="button-view-external">
              <Eye className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>

          {isImage ? (
            <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-lg border">
              <img
                src={documentUrl}
                alt={documentTitle}
                className="max-w-full max-h-[60vh] object-contain rounded"
                data-testid="img-document-preview"
              />
            </div>
          ) : documentUrl.endsWith('.html') ? (
            <div className="min-h-[400px] bg-white rounded-lg border">
              <iframe
                src={documentUrl}
                title={documentTitle}
                className="w-full h-[60vh] rounded"
                data-testid="iframe-document-preview"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-lg border">
              <div className="text-center space-y-4">
                <FileText className="h-16 w-16 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">Document Preview</p>
                  <p className="text-gray-500">Click the buttons above to download or view the document.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}