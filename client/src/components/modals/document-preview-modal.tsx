import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  ExternalLink, 
  FileText, 
  Eye, 
  X 
} from "lucide-react";

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    title: string;
    url: string;
    fileName?: string;
    type: 'business-license' | 'certification' | 'export-license' | 'company-profile' | 'audit-report';
    verified?: boolean;
  } | null;
}

const getDocumentTypeLabel = (type: string) => {
  switch (type) {
    case 'business-license':
      return 'Business License';
    case 'certification':
      return 'Product Certification';
    case 'export-license':
      return 'Export/Import License';
    case 'company-profile':
      return 'Company Profile';
    case 'audit-report':
      return 'Audit Report';
    default:
      return 'Document';
  }
};

const getDocumentTypeColor = (type: string) => {
  switch (type) {
    case 'business-license':
      return 'bg-blue-100 text-blue-800';
    case 'certification':
      return 'bg-green-100 text-green-800';
    case 'export-license':
      return 'bg-purple-100 text-purple-800';
    case 'company-profile':
      return 'bg-orange-100 text-orange-800';
    case 'audit-report':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function DocumentPreviewModal({ 
  open, 
  onOpenChange, 
  document: documentData 
}: DocumentPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!documentData) return null;

  const isPdf = documentData.url.toLowerCase().includes('.pdf');
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(documentData.url);

  const handleDownload = () => {
    // Use direct anchor link to avoid CORS issues
    const a = document.createElement('a');
    a.href = documentData.url;
    a.download = documentData.fileName || `${documentData.title}.${isPdf ? 'pdf' : 'file'}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenExternal = () => {
    window.open(documentData.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <DialogTitle className="text-xl" data-testid="modal-document-title">
                  {documentData.title}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getDocumentTypeColor(documentData.type)} data-testid="badge-document-type">
                    {getDocumentTypeLabel(documentData.type)}
                  </Badge>
                  {documentData.verified && (
                    <Badge variant="default" className="bg-green-600 text-white" data-testid="badge-verified">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                data-testid="button-download-document"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenExternal}
                data-testid="button-open-external"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open External
              </Button>
            </div>
          </div>
          {documentData.fileName && (
            <DialogDescription data-testid="text-document-filename">
              File: {documentData.fileName}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isPdf ? (
            <div className="w-full h-[50vh] bg-gray-50 rounded-lg border">
              <iframe
                src={documentData.url}
                title={documentData.title}
                className="w-full h-full rounded-lg"
                data-testid="iframe-pdf-preview"
              />
            </div>
          ) : isImage ? (
            <div className="flex items-center justify-center h-[50vh] bg-gray-50 rounded-lg border">
              <img
                src={documentData.url}
                alt={documentData.title}
                className="max-w-full max-h-full object-contain rounded"
                data-testid="img-document-preview"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[50vh] bg-gray-50 rounded-lg border">
              <div className="text-center space-y-4">
                <FileText className="h-16 w-16 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">Document Preview Not Available</p>
                  <p className="text-gray-500">Use the buttons above to download or view the document externally.</p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleDownload} data-testid="button-download-fallback">
                    <Download className="h-4 w-4 mr-2" />
                    Download Document
                  </Button>
                  <Button variant="outline" onClick={handleOpenExternal} data-testid="button-view-external-fallback">
                    <Eye className="h-4 w-4 mr-2" />
                    View External
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}